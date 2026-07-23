const logger = require('../utils/logger');
const { getGroqClient } = require('../config/groq');
const supabaseAdmin = require('../config/supabase').supabaseAdmin;
const detectLanguage = require('../utils/languageDetector');
const nigerianFraudPatterns = require('../data/nigerianFraudPatterns');

const cache = {
  activePatterns: null,
  activePatternsFetchedAt: 0,
};

/**
 * Build a structured few-shot example block for the Groq prompt.
 *
 * @param {Array<Object>} examples
 * @returns {string}
 */
function buildFewShotBlock(examples) {
  return examples
    .map(
      (pattern) =>
        `Template: ${pattern.template}\nCategory: ${pattern.category}\nRed Flags: ${pattern.red_flags.join(', ')}\nSafe Response: ${pattern.safe_response}`
    )
    .join('\n\n');
}

/**
 * Select relevant few-shot examples based on detected language and bank mentions.
 *
 * @param {string} messageText
 * @param {'english' | 'pidgin' | 'mixed'} language
 * @returns {Array<Object>}
 */
function selectFewShotExamples(messageText, language) {
  const normalizedText = String(messageText || '').toLowerCase();

  const bankMatches = nigerianFraudPatterns.filter((pattern) => {
    const bankName = String(pattern.bank_name || '').toLowerCase();
    return bankName && normalizedText.includes(bankName);
  });

  const languageMatches = nigerianFraudPatterns.filter(
    (pattern) => pattern.language === language && !bankMatches.find((match) => match.id === pattern.id)
  );

  const selected = [];

  const addUnique = (items) => {
    for (const item of items) {
      if (selected.length >= 5) break;
      if (!selected.some((existing) => existing.id === item.id)) {
        selected.push(item);
      }
    }
  };

  addUnique(bankMatches);
  addUnique(languageMatches);

  if (selected.length < 5) {
    const randomCandidates = nigerianFraudPatterns
      .filter((pattern) => !selected.some((existing) => existing.id === pattern.id))
      .sort(() => Math.random() - 0.5);
    addUnique(randomCandidates);
  }

  return selected.slice(0, 5);
}

/**
 * Normalize and validate the classifier verdict object.
 *
 * @param {Object} result
 * @param {'english' | 'pidgin' | 'mixed'} languageDetected
 * @returns {Object}
 */
function normalizeVerdict(result, languageDetected) {
  const acceptedVerdicts = ['scam', 'safe', 'suspicious'];
  const verdict = acceptedVerdicts.includes(result.verdict) ? result.verdict : 'suspicious';
  const confidenceScore = Number.isInteger(result.confidence_score)
    ? Math.max(0, Math.min(100, result.confidence_score))
    : 60;

  return {
    verdict,
    confidence_score: confidenceScore,
    scam_category: typeof result.scam_category === 'string' ? result.scam_category : null,
    impersonated_bank: typeof result.impersonated_bank === 'string' ? result.impersonated_bank : null,
    explanation: String(
      result.explanation ||
        (languageDetected === 'pidgin'
          ? 'Dis na scam check result.'
          : 'This is a scam check result.')
    ),
    language_detected: languageDetected,
    red_flags: Array.isArray(result.red_flags) ? result.red_flags : [],
    safe_to_click: typeof result.safe_to_click === 'boolean' ? result.safe_to_click : false,
    recommended_action: String(
      result.recommended_action ||
        (languageDetected === 'pidgin'
          ? 'Ignore am and no share anything.'
          : 'Ignore it and do not share any details.')
    ),
  };
}

/**
 * Fallback rule-based classification when Groq is unavailable.
 *
 * @param {string} messageText
 * @param {'english' | 'pidgin' | 'mixed'} languageDetected
 * @returns {Object}
 */
function runFallbackClassifier(messageText, languageDetected) {
  const normalizedText = String(messageText || '').toLowerCase();
  const matchedFlags = [];

  nigerianFraudPatterns.forEach((pattern) => {
    const hits = pattern.red_flags.filter((flag) => normalizedText.includes(flag.toLowerCase()));
    if (hits.length >= 2) {
      matchedFlags.push(...hits);
    }
  });

  const fallbackTriggers = ['bvn', 'otp', 'verify', 'click', 'account frozen'];
  const keywordMatches = fallbackTriggers.filter((keyword) => normalizedText.includes(keyword));

  if (matchedFlags.length >= 2) {
    return {
      verdict: 'suspicious',
      confidence_score: 65,
      scam_category: null,
      impersonated_bank: null,
      explanation: 'Our AI is temporarily unavailable. This is a rule-based assessment.',
      language_detected: languageDetected,
      red_flags: Array.from(new Set(matchedFlags)),
      safe_to_click: false,
      recommended_action:
        languageDetected === 'pidgin'
          ? 'Ignore am and no click any link.'
          : 'Ignore it and do not click any links.',
    };
  }

  if (keywordMatches.length > 0) {
    return {
      verdict: 'suspicious',
      confidence_score: 55,
      scam_category: null,
      impersonated_bank: null,
      explanation: 'Our AI is temporarily unavailable. This is a rule-based assessment.',
      language_detected: languageDetected,
      red_flags: keywordMatches,
      safe_to_click: false,
      recommended_action:
        languageDetected === 'pidgin'
          ? 'No click the link and no give anybody your details.'
          : 'Do not click the link and do not give anyone your details.',
    };
  }

  return {
    verdict: 'safe',
    confidence_score: 70,
    scam_category: null,
    impersonated_bank: null,
    explanation: 'Our AI is temporarily unavailable. This is a rule-based assessment.',
    language_detected: languageDetected,
    red_flags: [],
    safe_to_click: true,
    recommended_action:
      languageDetected === 'pidgin'
        ? 'If you no sure, still no click anything and check with official source.'
        : 'If unsure, still do not click anything and verify with official sources.',
  };
}

/**
 * Analyze a suspicious message using Groq and fallback logic.
 *
 * @param {string} messageText
 * @param {string|null} userId
 * @returns {Promise<Object>}
 */
async function analyzeMessage(messageText, userId = null) {
  const languageDetected = detectLanguage(messageText);
  const fewShotExamples = selectFewShotExamples(messageText, languageDetected);
  const fewShotBlock = buildFewShotBlock(fewShotExamples);

  const prompt = `Here are examples of known Nigerian scam patterns:\n\n${fewShotBlock}\n\nNow analyze this message:\n"${String(messageText).replace(/"/g, '\\"')}"\n\nDetected language: ${languageDetected}\n\nReturn only the JSON verdict.`;

  let usedFallback = false;
  let finalVerdict = null;

  try {
    const client = getGroqClient();

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are ScamShield NG, an AI safety system that protects Nigerians from ALL forms of financial and social fraud — not just bank scams. You have deep knowledge of Nigerian fraud patterns including fake bank alerts, fake job offers, investment scams, government impersonation, telecom scams, loan scams, romance scams, and crypto fraud. You understand Nigerian Pidgin English, local slang, and how fraudsters target Nigerians across all sectors.\n\nYour job is to analyze a suspicious message and return a JSON verdict. You must respond with ONLY valid JSON — no preamble, no explanation, no markdown code blocks. Just the raw JSON object.\n\nNigerian banks and institutions: GTBank, Zenith Bank, Access Bank, First Bank, UBA, Kuda, Opay, Palmpay, Moniepoint, Wema Bank, Sterling Bank, FCMB, Stanbic IBTC.\nGovernment bodies: CBN, EFCC, NAFDAC, NIMC, NCC, Federal Government of Nigeria.\nTelecoms: MTN Nigeria, Airtel Nigeria, Glo, 9mobile.\nCrypto/Fintech platforms: Binance, Luno, Patricia, Bitmama, Flutterwave, Paystack.\n\nRespond with exactly this JSON shape:\n{\n  "verdict": "scam" | "safe" | "suspicious",\n  "confidence_score": <integer 0-100>,\n  "scam_category": <string slug or null>,\n  "impersonated_bank": <string or null>,\n  "explanation": <string: 1-2 sentences in the same language as the input — Pidgin if input is Pidgin, English otherwise>,\n  "red_flags": [<array of specific red flags found, or empty array>],\n  "safe_to_click": <boolean>,\n  "recommended_action": <string: what the user should do, in same language as the input>\n}`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const payload = response.choices?.[0]?.message?.content;
    if (payload) {
      const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
      finalVerdict = normalizeVerdict(parsed, languageDetected);
    }
  } catch (error) {
    usedFallback = true;
    logger.error({ message: 'Groq API failure, using fallback classifier', error: error?.message || error });
  }

  if (!finalVerdict) {
    usedFallback = true;
    finalVerdict = runFallbackClassifier(messageText, languageDetected);
  }

  logger.info({
    message: 'scam check completed',
    messageLength: String(messageText || '').length,
    languageDetected,
    verdict: finalVerdict.verdict,
    confidence_score: finalVerdict.confidence_score,
    usedFallback,
    userId,
  });

  return finalVerdict;
}

/**
 * Fetch active fraud patterns from Supabase with a 5-minute cache.
 *
 * @returns {Promise<Array<Object>>}
 */
async function getActivePatterns() {
  const now = Date.now();

  if (cache.activePatterns && now - cache.activePatternsFetchedAt < 5 * 60 * 1000) {
    return cache.activePatterns;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('fraud_patterns')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error) {
      logger.error({ message: 'Failed to fetch active patterns', error: error.message || error });
      return [];
    }

    cache.activePatterns = data || [];
    cache.activePatternsFetchedAt = now;
    return cache.activePatterns;
  } catch (error) {
    logger.error({ message: 'Exception fetching active patterns', error: error.message || error });
    return [];
  }
}

/**
 * Retrieve aggregated scam check statistics from Supabase.
 *
 * @returns {Promise<Object>}
 */
async function getScamStats() {
  try {
    const [{ count: totalCount }, { count: scamCount }, { count: safeCount }, rowsResponse] = await Promise.all([
      supabaseAdmin.from('scam_checks').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('scam_checks').select('*', { count: 'exact', head: true }).eq('verdict', 'scam'),
      supabaseAdmin.from('scam_checks').select('*', { count: 'exact', head: true }).eq('verdict', 'safe'),
      supabaseAdmin.from('scam_checks').select('scam_category, impersonated_bank', { count: 'exact' }).limit('all'),
    ]);

    const categoryCounts = {};
    const bankCounts = {};

    (rowsResponse.data || []).forEach((row) => {
      if (row.scam_category) {
        categoryCounts[row.scam_category] = (categoryCounts[row.scam_category] || 0) + 1;
      }
      if (row.impersonated_bank) {
        bankCounts[row.impersonated_bank] = (bankCounts[row.impersonated_bank] || 0) + 1;
      }
    });

    const mostCommonScamCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const mostCommonImpersonatedBank = Object.entries(bankCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      total_checks: Number(totalCount) || 0,
      scam_count: Number(scamCount) || 0,
      safe_count: Number(safeCount) || 0,
      most_common_scam_category: mostCommonScamCategory,
      most_common_impersonated_bank: mostCommonImpersonatedBank,
    };
  } catch (error) {
    logger.error({ message: 'Failed to fetch scam stats', error: error.message || error });
    return {
      total_checks: 0,
      scam_count: 0,
      safe_count: 0,
      most_common_scam_category: null,
      most_common_impersonated_bank: null,
    };
  }
}

module.exports = {
  analyzeMessage,
  getActivePatterns,
  getScamStats,
};

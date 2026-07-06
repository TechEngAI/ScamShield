const asyncHandler = require('../utils/asyncHandler');
const { supabaseAdmin } = require('../config/supabase');
const scamService = require('../services/scam.service');
const { analyzeImageForScam } = require('../services/vision.service');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../utils/logger');

function normalizeSource(source) {
  return ['web', 'whatsapp', 'sms', 'api'].includes(source) ? source : 'web';
}

exports.checkScam = asyncHandler(async (req, res) => {
  const { message_text: messageText, source } = req.body;
  const userId = req.user?.id || null;
  
  console.log('Scam check request:', { messageText, source, userId });
  
  const verdict = await scamService.analyzeMessage(messageText, userId);

  console.log('Analysis verdict:', verdict);

  const insertPayload = {
    message_text: messageText,
    user_id: userId,
    verdict: verdict.verdict,
    confidence_score: verdict.confidence_score,
    scam_category: verdict.scam_category,
    impersonated_bank: verdict.impersonated_bank,
    explanation: verdict.explanation,
    language_detected: verdict.language_detected,
    red_flags: verdict.red_flags || [],
    safe_to_click: verdict.safe_to_click,
    recommended_action: verdict.recommended_action,
    source: normalizeSource(source),
  };

  console.log('Insert payload:', insertPayload);

  logger.info('Attempting to save scam check to database', { insertPayload });

  // Try to save to database, but don't fail the request if it fails
  let savedData = null;
  try {
    // Simple insert without select to avoid the WHERE clause error
    const { error } = await supabaseAdmin
      .from('scam_checks')
      .insert(insertPayload);

    if (error) {
      console.error('Database insert error:', error);
      logger.error('Failed to save scam check to database', { 
        error: error.message, 
        code: error.code,
        details: error.details,
        hint: error.hint,
        insertPayload 
      });
    } else {
      console.log('Database insert successful');
      // If insert succeeded, try to query the last inserted record
      const { data: queryData } = await supabaseAdmin
        .from('scam_checks')
        .select(
          'id, verdict, confidence_score, scam_category, impersonated_bank, explanation, language_detected, red_flags, safe_to_click, recommended_action, created_at'
        )
        .eq('user_id', userId)
        .eq('message_text', messageText)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (queryData) {
        savedData = queryData;
      }
    }
  } catch (dbError) {
    console.error('Database insert exception:', dbError);
    logger.error('Exception saving scam check to database', { 
      error: dbError.message,
      insertPayload 
    });
  }

  // Return the analysis result regardless of database save success
  const responseData = savedData ? {
    ...savedData,
    confidence_score: Math.round(Number(savedData.confidence_score) || 0),
    red_flags: savedData.red_flags || [],
    safe_to_click: Boolean(savedData.safe_to_click),
  } : {
    ...verdict,
    confidence_score: Math.round(Number(verdict.confidence_score) || 0),
    red_flags: verdict.red_flags || [],
    safe_to_click: Boolean(verdict.safe_to_click),
    created_at: new Date().toISOString(),
  };

  console.log('Response data:', responseData);

  return sendSuccess(
    res,
    responseData,
    'Scam check completed',
    200
  );
});

exports.getHistory = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const verdict = req.query.verdict;
  const from = (page - 1) * limit;
  const to = page * limit - 1;

  console.log('History request:', { userId: req.user.id, page, limit, verdict });

  let query = supabaseAdmin
    .from('scam_checks')
    .select(
      'id, message_text, verdict, confidence_score, scam_category, impersonated_bank, explanation, language_detected, red_flags, safe_to_click, recommended_action, source, created_at',
      { count: 'exact' }
    )
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (verdict) {
    query = query.eq('verdict', verdict);
  }

  const { data, error, count } = await query;

  console.log('History query result:', { data, error, count });

  if (error) {
    console.error('History query error:', error);
    return sendError(res, error.message || 'failed to fetch scam history', 500);
  }

  return sendSuccess(
    res,
    {
      checks: (data || []).map((check) => ({
        ...check,
        confidence_score: Math.round(Number(check.confidence_score) || 0),
        red_flags: check.red_flags || [],
        safe_to_click: Boolean(check.safe_to_click),
      })),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    },
    'Scam history retrieved',
    200
  );
});

exports.getPatterns = asyncHandler(async (_req, res) => {
  const patterns = await scamService.getActivePatterns();
  return sendSuccess(res, patterns, 'Fraud patterns retrieved', 200);
});

/**
 * Analyses an uploaded image for scam content
 * Extracts text using vision AI then runs scam classification
 */
exports.checkImageScam = asyncHandler(async (req, res) => {
  // 1. Get uploaded file from multer
  const file = req.file;
  if (!file) {
    return sendError(res, 'please upload an image file', 400);
  }

  // 2. Convert buffer to base64
  const imageBase64 = file.buffer.toString('base64');
  const mimeType = file.mimetype;

  logger.info('Image scam check started', {
    mimeType,
    fileSize: file.size
  });

  // 3. Run vision analysis
  const { extractedText, analysis } = await analyzeImageForScam(imageBase64, mimeType);

  // 4. Save to scam_checks table
  const insertPayload = {
    user_id: req.user?.id || null,
    message_text: extractedText,
    verdict: analysis.verdict,
    confidence_score: analysis.confidence_score,
    scam_category: analysis.scam_category || null,
    impersonated_bank: analysis.impersonated_bank || null,
    explanation: analysis.explanation,
    language_detected: analysis.language_detected,
    red_flags: analysis.red_flags || [],
    safe_to_click: analysis.safe_to_click ?? true,
    recommended_action: analysis.recommended_action || null,
    source: 'web'
  };

  // Try to save to database, but don't fail the request if it fails
  let savedData = null;
  try {
    // Simple insert without select to avoid the WHERE clause error
    const { error } = await supabaseAdmin
      .from('scam_checks')
      .insert(insertPayload);

    if (error) {
      logger.error('Failed to save image scam check to database', { 
        error: error.message, 
        code: error.code,
        details: error.details,
        hint: error.hint,
        insertPayload 
      });
    } else {
      console.log('Database insert successful');
      // If insert succeeded, try to query the last inserted record
      const { data: queryData } = await supabaseAdmin
        .from('scam_checks')
        .select(
          'id, verdict, confidence_score, scam_category, impersonated_bank, explanation, language_detected, red_flags, safe_to_click, recommended_action, created_at'
        )
        .eq('user_id', req.user?.id)
        .eq('message_text', extractedText)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (queryData) {
        savedData = queryData;
      }
    }
  } catch (dbError) {
    logger.error('Exception saving image scam check to database', { 
      error: dbError.message,
      insertPayload 
    });
  }

  // 5. Return result
  const responseData = savedData ? {
    ...savedData,
    confidence_score: Math.round(Number(savedData.confidence_score) || 0),
    red_flags: savedData.red_flags || [],
    safe_to_click: Boolean(savedData.safe_to_click),
    extractedText
  } : {
    ...analysis,
    confidence_score: Math.round(Number(analysis.confidence_score) || 0),
    red_flags: analysis.red_flags || [],
    safe_to_click: Boolean(analysis.safe_to_click),
    extractedText,
    created_at: new Date().toISOString(),
  };

  return sendSuccess(res, responseData, 'image analysed successfully');
});

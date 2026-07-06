const asyncHandler = require('../utils/asyncHandler');
const { supabaseAdmin } = require('../config/supabase');
const { analyzeMessage } = require('../services/scam.service');
const { analyzeImageForScam, downloadTwilioMedia } = require('../services/vision.service');
const { sendWhatsAppMessage, splitLongMessage } = require('../services/whatsapp.service');
const messageFormatter = require('../utils/messageFormatter');
const logger = require('../utils/logger');

/**
 * Handle incoming WhatsApp message from Twilio webhook
 *
 * CRITICAL: Must respond to Twilio within 10 seconds
 * We send 200 immediately with empty TwiML, then process asynchronously
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.handleIncoming = asyncHandler(async (req, res) => {
  const { Body, From, MessageSid, NumMedia } = req.body;

  // Log incoming message (privacy: don't log full message text in production)
  logger.info('WhatsApp message received', {
    messageSid: MessageSid,
    from: From,
    messageLength: Body?.length || 0,
    numMedia: NumMedia,
    allBodyKeys: Object.keys(req.body),
    hasMediaUrl0: !!req.body.MediaUrl0,
    hasMediaUrl: !!req.body.MediaUrl,
    hasMediaContentType0: !!req.body.MediaContentType0
  });

  // STEP 1: Respond to Twilio immediately with 200 and empty TwiML
  // This prevents Twilio from retrying while we process asynchronously
  res.set('Content-Type', 'text/xml');
  res.send('<Response></Response>');

  // STEP 2: Process asynchronously (don't await)
  processMessageAsync(Body, From, MessageSid, NumMedia, req.body).catch((error) => {
    logger.error('Error processing WhatsApp message asynchronously', {
      messageSid: MessageSid,
      error: error.message,
      stack: error.stack
    });
  });
});

/**
 * Process WhatsApp message asynchronously
 * This function runs after the 200 response has been sent to Twilio
 *
 * @param {string} body - Message text
 * @param {string} from - Sender's WhatsApp number
 * @param {string} messageSid - Twilio message ID
 * @param {number} numMedia - Number of media attachments
 * @param {Object} fullBody - Full Twilio webhook body
 */
async function processMessageAsync(body, from, messageSid, numMedia, fullBody) {
  try {
    // STEP 3: Check for images first (before checking body text)
    if (parseInt(numMedia) > 0) {
      // Handle image analysis
      await processImageMessage(from, fullBody, messageSid);
      return;
    }

    // STEP 4: Validate text message
    if (!body || body.trim().length === 0) {
      await sendWhatsAppMessage(from, formatHelpMessage());
      return;
    }

    const messageText = body.trim();

    if (messageText.length < 10) {
      await sendWhatsAppMessage(
        from,
        "Abeg send the full suspicious message. It's too short to analyse."
      );
      return;
    }

    // Truncate if too long (max 2000 chars for analysis)
    const analysisText = messageText.length > 2000 ? messageText.substring(0, 2000) : messageText;

    // STEP 4: Send "processing" message
    await sendWhatsAppMessage(
      from,
      '🔍 *ScamShield NG is analysing your message...*\n\nThis usually takes 2-3 seconds. We go send you the result now.'
    );

    // STEP 5: Run the scam classifier
    const result = await analyzeMessage(analysisText);

    logger.info('Scam analysis completed', {
      messageSid,
      verdict: result.verdict,
      confidence: result.confidence_score
    });

    // STEP 6: Save to database
    await supabaseAdmin.from('scam_checks').insert({
      message_text: analysisText,
      user_id: null, // Anonymous - WhatsApp users aren't logged in
      verdict: result.verdict,
      confidence_score: result.confidence_score,
      scam_category: result.scam_category,
      impersonated_bank: result.impersonated_bank,
      explanation: result.explanation,
      language_detected: result.language_detected,
      red_flags: result.red_flags,
      safe_to_click: result.safe_to_click,
      recommended_action: result.recommended_action,
      source: 'whatsapp'
    });

    logger.info('Scam check saved to database', { messageSid });

    // STEP 7: Format and send verdict
    const formattedVerdict = messageFormatter.formatVerdict(result);
    await sendWhatsAppMessage(from, formattedVerdict);

    logger.info('Verdict sent to user', { messageSid, verdict: result.verdict });

  } catch (error) {
    logger.error('Error processing WhatsApp message', {
      messageSid,
      error: error.message,
      stack: error.stack
    });

    // STEP 8: Send error message to user
    try {
      await sendWhatsAppMessage(
        from,
        '⚠️ ScamShield NG don encounter error. Abeg try again in a few seconds.\n\nIf the problem continues, visit scamshield.ng to check your message.'
      );
    } catch (sendError) {
      logger.error('Failed to send error message to user', {
        messageSid,
        error: sendError.message
      });
    }
  }
}

/**
 * Format help message for invalid or empty messages
 * @returns {string} Help message
 */
function formatHelpMessage() {
  return '*ScamShield NG — Nigerian Fraud Detection*\n\n' +
    'Forward any suspicious message to this number and we go tell you if na scam.\n\n' +
    'Examples:\n' +
    '• Bank account restriction alerts\n' +
    '• Fake investment offers\n' +
    '• BVN/OTP requests\n' +
    '• Money transfer requests\n\n' +
    'Powered by AI — protecting Nigerians from financial fraud.';
}

/**
 * Process WhatsApp image message asynchronously
 * @param {string} from - Sender's WhatsApp number
 * @param {Object} fullBody - Full Twilio webhook body
 * @param {string} messageSid - Twilio message ID
 */
async function processImageMessage(from, fullBody, messageSid) {
  try {
    logger.info('Processing WhatsApp image message', { messageSid, from, fullBodyKeys: Object.keys(fullBody) });

    // Send acknowledgement
    await sendWhatsAppMessage(from,
      '🖼️ *ScamShield NG don receive your image!*\n\n' +
      'We dey extract the text and analyse am for scam patterns...\n' +
      'This go take 5-10 seconds.'
    );

    // Get media URL from Twilio webhook body
    // Try multiple possible field names that Twilio might use
    const mediaUrl = fullBody.MediaUrl0 || fullBody.MediaUrl || fullBody.MediaUrl;
    const mediaContentType = fullBody.MediaContentType0 || fullBody.MediaContentType || fullBody.MediaContentType;

    logger.info('Twilio media info', { 
      mediaUrl: mediaUrl ? 'present' : 'missing',
      mediaContentType,
      messageSid,
      allFields: Object.keys(fullBody)
    });

    if (!mediaUrl) {
      logger.warn('No media URL in Twilio webhook', { 
        messageSid,
        availableFields: Object.keys(fullBody),
        bodySample: JSON.stringify(fullBody).substring(0, 500)
      });
      await sendWhatsAppMessage(from, '⚠️ We no fit access the image. Abeg try send am again.');
      return;
    }

    // Check supported format
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!supportedTypes.includes(mediaContentType)) {
      logger.warn('Unsupported image format', { mediaContentType, messageSid });
      await sendWhatsAppMessage(from,
        '⚠️ This image format no supported.\n\n' +
        'Abeg send JPG, PNG or WebP image. Screenshot dey work well.'
      );
      return;
    }

    logger.info('Downloading media from Twilio', { mediaUrl, messageSid });

    // Download and convert to base64
    const { base64, mimeType } = await downloadTwilioMedia(mediaUrl);

    logger.info('Media downloaded successfully', { mimeType, size: base64.length, messageSid });

    // Run vision + scam analysis
    logger.info('Starting vision analysis', { messageSid });
    const { extractedText, analysis } = await analyzeImageForScam(base64, mimeType);

    logger.info('Vision analysis completed', { 
      extractedTextLength: extractedText.length, 
      verdict: analysis.verdict,
      messageSid 
    });

    // Save to database
    const insertPayload = {
      user_id: null,
      message_text: extractedText,
      verdict: analysis.verdict,
      confidence_score: Math.round(analysis.confidence_score),
      scam_category: analysis.scam_category || null,
      impersonated_bank: analysis.impersonated_bank || null,
      explanation: analysis.explanation,
      language_detected: analysis.language_detected,
      red_flags: analysis.red_flags || [],
      safe_to_click: analysis.safe_to_click ?? true,
      recommended_action: analysis.recommended_action || null,
      source: 'whatsapp'
    };

    const { error: insertError } = await supabaseAdmin
      .from('scam_checks')
      .insert(insertPayload);

    if (insertError) {
      logger.error('Failed to save image scam check to database', { 
        error: insertError.message, 
        errorDetails: insertError,
        messageSid 
      });
    } else {
      logger.info('Image scam check saved to database', { messageSid });
    }

    // Format and send verdict
    const formattedVerdict = messageFormatter.formatVerdict(analysis);

    // Prepend extracted text preview
    const extractedPreview = extractedText.length > 200
      ? extractedText.substring(0, 200) + '...'
      : extractedText;

    const fullResponse =
      `📄 *Text extracted from your image:*\n_"${extractedPreview}"_\n\n` +
      formattedVerdict;

    // Split if too long
    const parts = splitLongMessage(fullResponse);
    for (const part of parts) {
      await sendWhatsAppMessage(from, part);
    }

    logger.info('Image analysis verdict sent', { messageSid, verdict: analysis.verdict });

  } catch (error) {
    logger.error('Image processing error', { 
      error: error.message, 
      stack: error.stack,
      messageSid 
    });

    let userMessage = '⚠️ We no fit analyse this image.\n\n';
    if (error.message.includes('no readable text')) {
      userMessage += 'We no see any text in the image. Abeg send a clearer screenshot.';
    } else if (error.message.includes('enough text')) {
      userMessage += 'The text in the image too small or too short to analyse. Abeg send a bigger screenshot.';
    } else {
      userMessage += 'Something went wrong. Abeg try again or type the suspicious message as text.';
    }

    await sendWhatsAppMessage(from, userMessage).catch(() => {});
  }
}

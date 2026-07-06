const twilio = require('twilio');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Twilio client singleton
 * Initialized once and reused across all requests
 */
let twilioClient = null;

/**
 * Initialize Twilio client singleton
 * @returns {Object} Twilio client instance
 */
function initTwilioClient() {
  if (!twilioClient) {
    twilioClient = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
    logger.info('Twilio client initialized');
  }
  return twilioClient;
}

/**
 * Validate Twilio request signature middleware
 * Ensures the request is genuinely from Twilio
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validateTwilioSignature(req, res, next) {
  // Skip validation in development for easier testing with curl/Postman
  if (config.NODE_ENV === 'development') {
    logger.warn('Skipping Twilio signature validation in development mode');
    return next();
  }

  const signature = req.headers['x-twilio-signature'];

  // Build the full URL - TWILIO_WEBHOOK_URL should be base URL only (no path)
  // The path comes from req.originalUrl
  const url = `${config.TWILIO_WEBHOOK_URL}${req.originalUrl}`;
  const params = req.body;

  // Log for debugging
  logger.info('Twilio signature validation', {
    hasSignature: !!signature,
    url,
    messageSid: req.body.MessageSid
  });

  // Use Twilio's validateRequest method
  const isValid = twilio.validateRequest(
    config.TWILIO_AUTH_TOKEN,
    signature,
    url,
    params
  );

  if (!isValid) {
    logger.warn('Invalid Twilio signature received', {
      signature,
      url,
      messageSid: req.body.MessageSid
    });
    return res.status(403).json({ error: 'invalid twilio signature' });
  }

  next();
}

/**
 * Send a WhatsApp message via Twilio
 *
 * @param {string} to - Recipient number (already has whatsapp: prefix)
 * @param {string} body - Message text
 * @returns {Promise<string>} Message SID
 * @throws {Error} If sending fails
 */
async function sendWhatsAppMessage(to, body) {
  const client = initTwilioClient();

  // Truncate if message exceeds WhatsApp limit (1600 chars, using 1500 for safety)
  const maxLength = 1500;
  let messageBody = body;
  if (body.length > maxLength) {
    messageBody = body.substring(0, maxLength) + '...';
    logger.warn('Message truncated to fit WhatsApp limit', {
      originalLength: body.length,
      truncatedLength: messageBody.length
    });
  }

  try {
    const message = await client.messages.create({
      from: `whatsapp:${config.TWILIO_WHATSAPP_NUMBER}`,
      to: to,
      body: messageBody
    });

    logger.info('WhatsApp message sent successfully', {
      messageSid: message.sid,
      to: to
    });

    return message.sid;
  } catch (error) {
    logger.error('Failed to send WhatsApp message', {
      error: error.message,
      to: to
    });
    throw error;
  }
}

/**
 * Split a long message into parts
 * Splits at the last newline before maxLength to keep sentences intact
 *
 * @param {string} text - Full message text
 * @param {number} maxLength - Maximum length per part (default: 1500)
 * @returns {string[]} Array of message parts
 */
function splitLongMessage(text, maxLength = 1500) {
  if (text.length <= maxLength) {
    return [text];
  }

  const parts = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      parts.push(remaining);
      break;
    }

    // Find the last newline before maxLength
    const chunk = remaining.substring(0, maxLength);
    const lastNewlineIndex = chunk.lastIndexOf('\n');

    if (lastNewlineIndex > 0) {
      parts.push(remaining.substring(0, lastNewlineIndex));
      remaining = remaining.substring(lastNewlineIndex + 1);
    } else {
      // No newline found, force split at maxLength
      parts.push(remaining.substring(0, maxLength));
      remaining = remaining.substring(maxLength);
    }
  }

  return parts;
}

module.exports = {
  initTwilioClient,
  validateTwilioSignature,
  sendWhatsAppMessage,
  splitLongMessage
};

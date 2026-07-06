const axios = require('axios');
const { getGroqClient } = require('../config/groq');
const { analyzeMessage } = require('./scam.service');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Extracts text from an image using Groq LLaMA 4 Scout vision model
 * @param {string} imageBase64 - Base64 encoded image (no data URL prefix)
 * @param {string} mimeType - Image MIME type e.g. 'image/jpeg', 'image/png'
 * @returns {Promise<string>} Extracted text from the image
 */
async function extractTextFromImage(imageBase64, mimeType) {
  try {
    logger.info('Starting vision text extraction', { mimeType, imageSize: imageBase64.length });

    const client = getGroqClient();

    // Try LLaMA 4 Scout first, fallback to LLaMA 3.2 Vision if not available
    const model = 'meta-llama/llama-4-scout-17b-16e-instruct';

    logger.info('Using vision model', { model });

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`
              }
            },
            {
              type: 'text',
              text: `You are a text extraction assistant. Extract ALL visible text from this image exactly as it appears. 
              This is likely a screenshot of a WhatsApp message, SMS, or bank notification from Nigeria.
              Extract every word, number, and symbol you can see.
              If the image contains no readable text, respond with: NO_TEXT_FOUND
              Do not add any commentary — only output the extracted text.`
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    });

    logger.info('Vision API response received', { 
      hasChoices: !!response.choices,
      choicesCount: response.choices?.length 
    });

    const extractedText = response.choices?.[0]?.message?.content;

    if (!extractedText) {
      logger.error('No content in vision response', { response });
      throw new Error('no response from vision model');
    }

    if (extractedText.includes('NO_TEXT_FOUND')) {
      logger.warn('Vision model found no text in image');
      throw new Error('no readable text found in image');
    }

    logger.info('Text extracted from image successfully', {
      textLength: extractedText.length
    });

    return extractedText;
  } catch (error) {
    logger.error('Failed to extract text from image', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Analyses an image for scam content
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} mimeType - Image MIME type
 * @returns {Promise<{extractedText: string, analysis: object}>}
 */
async function analyzeImageForScam(imageBase64, mimeType) {
  try {
    // Extract text from image
    const extractedText = await extractTextFromImage(imageBase64, mimeType);

    // Validate extracted text
    if (extractedText.length < 10) {
      throw new Error('image does not contain enough text to analyse');
    }

    // Run scam analysis on extracted text
    const analysis = await analyzeMessage(extractedText);

    // Add source type flag
    analysis.source_type = 'image';

    logger.info('Image scam analysis completed', {
      verdict: analysis.verdict,
      confidence: analysis.confidence_score
    });

    return {
      extractedText,
      analysis
    };
  } catch (error) {
    logger.error('Failed to analyze image for scam', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Downloads media from Twilio and returns as base64
 * @param {string} mediaUrl - Twilio media URL from webhook
 * @returns {Promise<{base64: string, mimeType: string}>}
 */
async function downloadTwilioMedia(mediaUrl) {
  try {
    const response = await axios.get(mediaUrl, {
      auth: {
        username: config.TWILIO_ACCOUNT_SID,
        password: config.TWILIO_AUTH_TOKEN
      },
      responseType: 'arraybuffer'
    });

    const base64 = Buffer.from(response.data).toString('base64');
    const mimeType = response.headers['content-type'];

    // Validate supported formats
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!supportedTypes.includes(mimeType)) {
      throw new Error('unsupported image format. please send JPG, PNG or WebP');
    }

    logger.info('Twilio media downloaded successfully', {
      mimeType,
      size: base64.length
    });

    return { base64, mimeType };
  } catch (error) {
    logger.error('Failed to download Twilio media', {
      error: error.message,
      mediaUrl
    });
    throw error;
  }
}

module.exports = {
  extractTextFromImage,
  analyzeImageForScam,
  downloadTwilioMedia
};

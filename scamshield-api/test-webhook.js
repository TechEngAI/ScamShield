/**
 * Test script for WhatsApp webhook with proper Twilio signature
 * Run this after setting your environment variables
 */

const crypto = require('crypto');
const axios = require('axios');

// Load environment variables
require('dotenv').config();

const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const WEBHOOK_URL = process.env.TWILIO_WEBHOOK_URL || 'http://localhost:3001/api/whatsapp/webhook';

// Test data
const testData = {
  Body: 'Test message for scam detection',
  From: 'whatsapp:+1234567890',
  MessageSid: 'test_message_123',
  NumMedia: '0'
};

/**
 * Generate Twilio signature
 * @param {string} url - The webhook URL
 * @param {Object} params - The form data
 * @param {string} authToken - Your Twilio auth token
 * @returns {string} The signature
 */
function generateTwilioSignature(url, params, authToken) {
  // Twilio expects the parameters to be sorted alphabetically
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('');

  const data = url + sortedParams;
  return crypto
    .createHmac('sha1', authToken)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64');
}

async function testWebhook() {
  try {
    console.log('Testing WhatsApp webhook...');
    console.log('URL:', WEBHOOK_URL);
    console.log('Test data:', testData);

    // Generate signature
    const signature = generateTwilioSignature(WEBHOOK_URL, testData, TWILIO_AUTH_TOKEN);
    console.log('Generated signature:', signature);

    // Send request with signature
    const response = await axios.post(WEBHOOK_URL, new URLSearchParams(testData), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': signature
      }
    });

    console.log('✅ Webhook test successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);

  } catch (error) {
    console.error('❌ Webhook test failed!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testWebhook();

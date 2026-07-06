/*
 * LOCAL DEVELOPMENT SETUP:
 * 1. Install ngrok: npm install -g ngrok
 * 2. Start your backend: npm run dev
 * 3. In a new terminal: ngrok http 3001
 * 4. Copy the https URL ngrok gives you (e.g. https://abc123.ngrok.io)
 * 5. Go to Twilio Console > Messaging > Try it out > Send a WhatsApp message
 * 6. Set webhook URL to: https://abc123.ngrok.io/api/whatsapp/webhook
 * 7. Join the sandbox by sending the join phrase to the Twilio WhatsApp number
 * 8. Send any suspicious message to the sandbox number to test
 */

const express = require('express');
const whatsappController = require('../controllers/whatsapp.controller');
const { validateTwilioSignature } = require('../services/whatsapp.service');

const router = express.Router();

/**
 * POST /api/whatsapp/webhook
 * Twilio WhatsApp webhook endpoint
 * Receives incoming WhatsApp messages and responds with scam analysis
 *
 * Twilio sends form-encoded data (application/x-www-form-urlencoded), not JSON
 * Fields: Body, From, To, MessageSid, NumMedia
 */
router.post(
  '/webhook',
  express.urlencoded({ extended: false }),
  validateTwilioSignature,
  whatsappController.handleIncoming
);

module.exports = router;

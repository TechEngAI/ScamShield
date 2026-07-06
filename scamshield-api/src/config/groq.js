'use strict';

const Groq = require('groq-sdk');
const logger = require('../utils/logger');

let groqClient = null;

/**
 * Returns the singleton Groq client instance.
 * Initializes it on first call.
 * @returns {Groq} Groq client instance
 */
const getGroqClient = () => {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    logger.info('Groq client initialized successfully');
  }
  return groqClient;
};

module.exports = { getGroqClient };

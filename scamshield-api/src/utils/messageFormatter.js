/**
 * Format scam analysis result into WhatsApp-friendly message
 *
 * @param {Object} result - Scam analysis result from scam.service.js
 * @param {string} result.verdict - 'scam', 'suspicious', or 'safe'
 * @param {number} result.confidence_score - Confidence percentage (0-100)
 * @param {string} result.impersonated_bank - Bank name if impersonated (optional)
 * @param {string} result.language_detected - 'pidgin' or 'english'
 * @param {string} result.explanation - Analysis explanation
 * @param {string[]} result.red_flags - Array of red flag strings
 * @param {string} result.recommended_action - Recommended action text
 * @returns {string} Formatted WhatsApp message
 */
function formatVerdict(result) {
  const { verdict, confidence_score, impersonated_bank, language_detected, explanation, red_flags, recommended_action } = result;

  // Verdict header section
  let message = '';

  if (verdict === 'scam') {
    message += '🚨 *SCAM DETECTED!*\n';
    message += '━━━━━━━━━━━━━━━━━━━\n';
    message += 'This message na scam! Do NOT click any link or share any information.\n\n';
  } else if (verdict === 'suspicious') {
    message += '⚠️ *SUSPICIOUS MESSAGE*\n';
    message += '━━━━━━━━━━━━━━━━━━━\n';
    message += 'This message get some red flags. Treat am with caution.\n\n';
  } else {
    message += '✅ *LOOKS SAFE*\n';
    message += '━━━━━━━━━━━━━━━━━━━\n';
    message += 'We no detect any obvious scam patterns in this message.\n\n';
  }

  // Stats section
  message += '📊 *Confidence:* ' + Math.round(confidence_score) + '%\n';

  if (impersonated_bank) {
    message += '🏦 *Bank targeted:* ' + impersonated_bank + '\n';
  }

  message += '🔤 *Language:* ' + (language_detected === 'pidgin' ? 'Pidgin' : 'English') + '\n\n';

  // Analysis section
  message += '━━━━━━━━━━━━━━━━━━━\n';
  message += '📝 *Analysis:*\n';
  message += explanation + '\n\n';

  // Red flags section
  message += '━━━━━━━━━━━━━━━━━━━\n';
  message += '🚩 *Red flags found:*\n';

  if (red_flags && red_flags.length > 0) {
    red_flags.forEach((flag) => {
      message += '• ' + flag + '\n';
    });
  } else {
    message += 'No specific red flags identified.\n';
  }

  message += '\n';

  // Recommended action section
  message += '━━━━━━━━━━━━━━━━━━━\n';
  message += '✅ *What to do:*\n';
  message += recommended_action + '\n\n';

  // Footer
  message += '━━━━━━━━━━━━━━━━━━━\n';
  message += '_Powered by ScamShield NG — protecting Nigerians from fraud_';

  return message;
}

module.exports = {
  formatVerdict
};

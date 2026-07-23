/**
 * Detect the dominant language style of a user message.
 *
 * @param {string} text
 * @returns {'english' | 'pidgin' | 'mixed'}
 */
function detectLanguage(text) {
  const normalized = String(text || '').toLowerCase();
  const pidginMatches = PIDGIN_INDICATORS.reduce((count, phrase) => {
    return normalized.includes(phrase) ? count + 1 : count;
  }, 0);

  const hasEnglishStructure = /\b(please|account|verify|customer|message|bank|contact|remain|confirm|urgent|password|link|thank)\b/i.test(text);

  if (pidginMatches >= 3) {
    return 'pidgin';
  }

  if (pidginMatches >= 1 && pidginMatches <= 2 && hasEnglishStructure) {
    return 'mixed';
  }

  return 'english';
}

const PIDGIN_INDICATORS = [
  'na',
  'dey',
  'oga',
  'abeg',
  'wetin',
  'wahala',
  'sabi',
  'chop',
  'wey',
  'una',
  'dem',
  'sef',
  'sha',
  'nau',
  'no be',
  'e don',
  'how far',
  'e go',
  'make you',
  'I no',
  'pikin',
  'gist',
  'japa',
  'hustle',
  'abi',
  'comot',
  'enter',
  'carry go',
  'follow',
  'do am',
  'chook eye',
  'waka',
  'kolo',
  'tori',
  'yarn',
  'sharp sharp',
  'gbera',
  'ogbon',
  'omo',
  'kalakuta',
  'galamsey',
  'wahala dey',
  'e don happen',
  'no dulling',
  'oya now',
  'e go better',
  'as e dey go',
  'nothing do you',
  'God when',
  'e be like',
  'how e take',
  'werey',
  'mumu',
  'lailai',
  'gbam',
  'correct',
  'packaging',
  'razz',
  'ajebutter',
];

module.exports = detectLanguage;
module.exports.PIDGIN_INDICATORS = PIDGIN_INDICATORS;

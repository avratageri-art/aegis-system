const {GoogleGenAI} = require('@google/genai');
const ai = new GoogleGenAI({apiKey: 'AIzaSyCkzo_b7OFZNDNVfJMxsyLd-caQPPIP-GA'});

ai.models.generateContent({
  model: 'gemini-2.0-flash',
  contents: 'Say hello in one word'
}).then(r => {
  console.log('SUCCESS:', r.text);
}).catch(e => {
  console.log('ERROR:', e.message);
});

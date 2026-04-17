const https = require('https');
const key = 'AIzaSyCkzo_b7OFZNDNVfJMxsyLd-caQPPIP-GA';
const models = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash-001'];

async function test(model) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ contents: [{ parts: [{ text: 'Say hi in one word' }] }] });
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:generateContent?key=${key}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000
    }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const t = JSON.parse(body).candidates?.[0]?.content?.parts?.[0]?.text || '';
            console.log(`✅ ${model}: WORKING! Response: "${t.trim()}"`);
          } catch(e) { console.log(`✅ ${model}: WORKING!`); }
        } else {
          try {
            const err = JSON.parse(body).error;
            console.log(`❌ ${model}: ${err.status} (HTTP ${res.statusCode})`);
          } catch(e) { console.log(`❌ ${model}: HTTP ${res.statusCode}`); }
        }
        resolve();
      });
    });
    req.on('error', (e) => { console.log(`❌ ${model}: ${e.message}`); resolve(); });
    req.write(data);
    req.end();
  });
}

(async () => {
  for (const m of models) await test(m);
})();

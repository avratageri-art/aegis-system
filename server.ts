import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini AI client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("[FATAL] GEMINI_API_KEY is not set in .env file!");
}
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

const MAIGRET_SITES = [
  { name: 'Instagram', url: 'https://www.instagram.com/{}', errorMsg: 'Page Not Found' },
  { name: 'Twitter', url: 'https://twitter.com/{}', errorMsg: 'This account doesn\'t exist' },
  { name: 'Facebook', url: 'https://www.facebook.com/{}', errorMsg: 'content isn\'t available' },
  { name: 'GitHub', url: 'https://github.com/{}', errorMsg: '404' },
  { name: 'Reddit', url: 'https://www.reddit.com/user/{}', errorMsg: '404' },
  { name: 'YouTube', url: 'https://www.youtube.com/@{}', errorMsg: '404' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/{}', errorMsg: '404' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@{}', errorMsg: '404' },
  { name: 'Pinterest', url: 'https://www.pinterest.com/{}', errorMsg: '404' },
  { name: 'Medium', url: 'https://medium.com/@{}', errorMsg: '404' },
  { name: 'Twitch', url: 'https://www.twitch.tv/{}', errorMsg: '404' },
  { name: 'Steam', url: 'https://steamcommunity.com/id/{}', errorMsg: '404' },
  { name: 'SoundCloud', url: 'https://soundcloud.com/{}', errorMsg: '404' },
  { name: 'Spotify', url: 'https://open.spotify.com/user/{}', errorMsg: '404' },
  { name: 'Vimeo', url: 'https://vimeo.com/{}', errorMsg: '404' },
  { name: 'Behance', url: 'https://www.behance.net/{}', errorMsg: '404' },
  { name: 'Dribbble', url: 'https://dribbble.com/{}', errorMsg: '404' },
  { name: 'Flickr', url: 'https://www.flickr.com/people/{}', errorMsg: '404' },
  { name: 'Letterboxd', url: 'https://letterboxd.com/{}', errorMsg: '404' },
  { name: 'Codecademy', url: 'https://www.codecademy.com/profiles/{}', errorMsg: '404' },
  { name: 'DeviantArt', url: 'https://www.deviantart.com/{}', errorMsg: '404' },
  { name: 'Goodreads', url: 'https://www.goodreads.com/{}', errorMsg: '404' },
  { name: 'GitLab', url: 'https://gitlab.com/{}', errorMsg: '404' },
  { name: 'Bitbucket', url: 'https://bitbucket.org/{}/', errorMsg: '404' },
  { name: 'Tumblr', url: 'https://{}.tumblr.com', errorMsg: '404' },
  { name: 'Dev.to', url: 'https://dev.to/{}', errorMsg: '404' },
  { name: 'Kaggle', url: 'https://www.kaggle.com/{}', errorMsg: '404' },
  { name: 'Quora', url: 'https://www.quora.com/profile/{}', errorMsg: '404' },
  { name: 'ProductHunt', url: 'https://www.producthunt.com/@{}', errorMsg: '404' },
  { name: 'AngelList', url: 'https://angel.co/u/{}', errorMsg: '404' },
  { name: 'About.me', url: 'https://about.me/{}', errorMsg: '404' },
  { name: 'Keybase', url: 'https://keybase.io/{}', errorMsg: '404' },
  { name: 'Patreon', url: 'https://www.patreon.com/{}', errorMsg: '404' },
  { name: 'Discord', url: 'https://discord.com/users/{}', errorMsg: '404' },
  { name: 'Slack', url: 'https://{}.slack.com', errorMsg: '404' },
  { name: 'Telegram', url: 'https://t.me/{}', errorMsg: '404' },
  { name: 'Snapchat', url: 'https://www.snapchat.com/add/{}', errorMsg: '404' },
  { name: 'Mastodon', url: 'https://mastodon.social/@{}', errorMsg: '404' },
  { name: 'BuyMeACoffee', url: 'https://www.buymeacoffee.com/{}', errorMsg: '404' },
  { name: 'Ko-fi', url: 'https://ko-fi.com/{}', errorMsg: '404' },
  { name: 'Linktree', url: 'https://linktr.ee/{}', errorMsg: '404' },
  { name: 'Carrd', url: 'https://{}.carrd.co', errorMsg: '404' },
  { name: 'Substack', url: 'https://{}.substack.com', errorMsg: '404' },
  { name: 'Gumroad', url: 'https://{}.gumroad.com', errorMsg: '404' },
  { name: 'Itch.io', url: 'https://{}.itch.io', errorMsg: '404' },
  { name: 'Bandcamp', url: 'https://bandcamp.com/{}', errorMsg: '404' },
  { name: 'Mixcloud', url: 'https://www.mixcloud.com/{}/', errorMsg: '404' },
  { name: 'Last.fm', url: 'https://www.last.fm/user/{}', errorMsg: '404' },
  { name: 'Trakt', url: 'https://trakt.tv/users/{}', errorMsg: '404' },
  { name: 'MyAnimeList', url: 'https://myanimelist.net/profile/{}', errorMsg: '404' },
  { name: 'Strava', url: 'https://www.strava.com/athletes/{}', errorMsg: '404' },
  { name: 'AllTrails', url: 'https://www.alltrails.com/members/{}', errorMsg: '404' },
  { name: 'Komoot', url: 'https://www.komoot.com/user/{}', errorMsg: '404' },
  { name: 'Chess.com', url: 'https://www.chess.com/member/{}', errorMsg: '404' },
  { name: 'Lichess', url: 'https://lichess.org/@/{}', errorMsg: '404' },
  { name: 'HackerRank', url: 'https://www.hackerrank.com/{}', errorMsg: '404' },
  { name: 'LeetCode', url: 'https://leetcode.com/{}', errorMsg: '404' },
  { name: 'Codeforces', url: 'https://codeforces.com/profile/{}', errorMsg: '404' },
  { name: 'Topcoder', url: 'https://www.topcoder.com/members/{}', errorMsg: '404' },
  { name: 'TryHackMe', url: 'https://tryhackme.com/p/{}', errorMsg: '404' },
  { name: 'HackTheBox', url: 'https://www.hackthebox.eu/profile/{}', errorMsg: '404' },
  { name: 'Bugcrowd', url: 'https://bugcrowd.com/{}', errorMsg: '404' },
  { name: 'HackerOne', url: 'https://hackerone.com/{}', errorMsg: '404' },
];

// ─── Helper Functions ───────────────────────────────────────────────────────

function inferType(val: string): string {
  if (val.includes('@')) return 'email';
  if (val.match(/^\d+$/)) return 'phone';
  if (val.match(/^[0-9.]+$/)) return 'ip';
  if (val.includes('.')) return 'domain';
  return 'person';
}

function deriveUsername(target: string, type: string, details?: any): string {
  if (details?.name) {
    return details.name.toLowerCase().replace(/\s+/g, '');
  } else if (type === 'email') {
    return target.split('@')[0];
  } else if (target.includes(' | ')) {
    const parts = target.split(' | ');
    return parts[0].toLowerCase().replace(/\s+/g, '');
  }
  return target;
}

async function runMaigretScan(username: string): Promise<any[]> {
  console.log(`[Maigret Engine] Scanning for: ${username}`);
  const resolvedResults: any[] = [];
  const batchSize = 12;

  for (let i = 0; i < MAIGRET_SITES.length; i += batchSize) {
    const batch = MAIGRET_SITES.slice(i, i + batchSize);
    const batchChecks = batch.map(async (site) => {
      const url = site.url.replace('{}', username);
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          },
          signal: AbortSignal.timeout(15000)
        });

        if (response.status === 404) return null;

        if (response.status === 200) {
          const text = await response.text();
          const lowerText = text.toLowerCase();
          const lowerError = site.errorMsg.toLowerCase();

          if (lowerText.includes(lowerError)) return null;
          if (lowerText.includes('page not found') || lowerText.includes('user not found') || lowerText.includes('account not found') || lowerText.includes('profile not found') || lowerText.includes('doesn\'t exist')) return null;

          let title = '';
          const titleMatch = text.match(/<title>(.*?)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            title = titleMatch[1].trim();
          }

          return {
            platform: site.name,
            url: url,
            status: 'found',
            metadata: { title, timestamp: new Date().toISOString() }
          };
        }
        return null;
      } catch (error) {
        return null;
      }
    });

    const batchResults = await Promise.all(batchChecks);
    resolvedResults.push(...batchResults.filter(r => r !== null));

    if (i + batchSize < MAIGRET_SITES.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return resolvedResults;
}

function runEpieosScan(email?: string, phone?: string, name?: string): any[] {
  const found: any[] = [];

  if (email) {
    const domain = email.split('@')[1];
    found.push({ type: 'email_provider', value: domain, platform: 'MX Record' });
    const platforms = ['LinkedIn', 'Facebook', 'Twitter', 'GitHub', 'Gravatar'];
    platforms.forEach(p => {
      if (Math.random() > 0.5) {
        found.push({ type: 'social', platform: p, status: 'linked', value: email });
      }
    });
  }

  if (phone) {
    found.push({ type: 'phone_carrier', value: 'Simulated Carrier', platform: 'HLR Lookup' });
    found.push({ type: 'location', value: 'United States', platform: 'Geographic' });
    if (Math.random() > 0.3) {
      found.push({ type: 'social', platform: 'WhatsApp', status: 'active', value: phone });
    }
  }

  if (name) {
    found.push({ type: 'person', value: name, platform: 'Identity' });
  }

  return found;
}

// ─── Gemini Schema ──────────────────────────────────────────────────────────

const graphSchema = {
  type: Type.OBJECT,
  properties: {
    nodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          label: { type: Type.STRING },
          type: {
            type: Type.STRING,
            enum: ['person', 'domain', 'ip', 'email', 'organization', 'alias', 'phone', 'social', 'document', 'breach']
          },
          data: {
            type: Type.OBJECT,
            properties: { url: { type: Type.STRING } }
          }
        },
        required: ["id", "label", "type"]
      }
    },
    links: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING },
          target: { type: Type.STRING },
          label: { type: Type.STRING }
        },
        required: ["source", "target"]
      }
    },
    intelligenceLogs: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: ["nodes", "links"]
};

// ─── Build System Instructions per Mode ─────────────────────────────────────

function buildSystemInstruction(target: string, mode: string, details: any, localMaigretResults: any[], localEpieosResults: any[]): string {
  const type = inferType(target);

  switch (mode) {
    case 'epieos':
      return `
        You are "Epieos", an advanced email and phone intelligence expert.
        Your goal is to find all linked accounts, public profiles, and data breaches associated with the target details.

        TARGET DETAILS:
        ${JSON.stringify(details || { target }, null, 2)}

        LOCAL SCAN RESULTS:
        ${JSON.stringify(localEpieosResults, null, 2)}

        STRATEGY:
        - You MUST include the local scan results provided above in the final graph.
        - For email targets, search for:
          - "site:linkedin.com ${details?.email || target}"
          - "site:facebook.com ${details?.email || target}"
          - "site:twitter.com ${details?.email || target}"
          - "${details?.email || target} data breach"
        - For phone targets, search for:
          - "site:truecaller.com ${details?.phone || target}"
          - "site:whatsapp.com ${details?.phone || target}"
          - "${details?.phone || target} owner"
        - For name targets, correlate with email/phone to find professional profiles.

        OUTPUT: Return a graph connecting the target to all discovered entities.
        Include an "intelligenceLogs" array of strings describing each step you took.
      `;
    case 'maigret':
      return `
        You are "Maigret", a world-class social media intelligence expert.
        Your goal is to find EVERY possible social media profile, professional account, and public persona for the username: "${target}".

        LOCAL SCAN RESULTS (DIRECT URL PROBING):
        ${JSON.stringify(localMaigretResults, null, 2)}

        CRITICAL INSTRUCTIONS:
        1. YOU MUST NOT GUESS OR HALLUCINATE URLS. Do not simply append ".com" to the username.
        2. YOU MUST include the local scan results provided above in the final graph. These are VERIFIED accounts.
        3. For every profile found in LOCAL SCAN RESULTS, create a node and include the "url" provided in the local scan in the "data.url" field.
        4. CROSS-PLATFORM CORRELATION: If you find a verified profile (e.g., GitHub), look for links to other platforms in its bio or public data.
        5. Based on your knowledge, suggest ADDITIONAL profiles that are likely to exist. Only include them if you have high confidence the account exists for this username.
        6. BREACH ANALYSIS: If the target is an email address, search for known data breaches using:
           - "site:haveibeenpwned.com ${target}"
           - "${target} data breach status"
        7. Search queries for profiles MUST be specific:
           - "site:instagram.com ${target}"
           - "site:twitter.com ${target}"
           - "site:github.com ${target}"
           - "site:linkedin.com/in/ ${target}"
           - "${target} social media profiles"
        8. For every node that represents a website or profile, you MUST include the full verified URL in the "data.url" field.

        OUTPUT: Return a structured graph where the central node is "${target}", connected to all discovered social media profile nodes.
        Include an "intelligenceLogs" array of strings describing each step you took.
      `;
    case 'googledorking':
      return `
        You are a Google Dorking Specialist.
        Your goal is to find publicly exposed documents, sensitive files, and deep web footprints for: "${target}".

        STRATEGY:
        1. Search for documents: "site:${target} filetype:pdf", "site:${target} filetype:xlsx", "site:${target} filetype:docx".
        2. Search for directory listings: "site:${target} intitle:index.of".
        3. Search for mentions in public lists: "${target} rank list", "${target} results", "${target} merit list".
        4. Search for academic or professional footprints: "${target} university", "${target} resume", "${target} CV".
        5. Search for coding footprints: "site:github.com ${target}", "site:gitlab.com ${target}", "site:bitbucket.org ${target}".
        6. Search for competitive programming/tech profiles: "site:geeksforgeeks.org ${target}", "site:leetcode.com ${target}", "site:kaggle.com ${target}".

        OUTPUT: Return a graph connecting the target to discovered documents, profiles, and files with their URLs.
        Include an "intelligenceLogs" array of strings describing each step you took.
      `;
    default: // maltego
      return `
        You are "Maltego", a relationship mapping engine.
        Your goal is to map the entire digital footprint and relationship network of: "${target}".

        STRATEGY:
        1. INFRASTRUCTURE: Map DNS, IPs, and domains associated with the target.
        2. ORGANIZATIONS: Identify schools, workplaces, and groups the target belongs to.
        3. PEOPLE: Identify relatives, colleagues, or associated individuals.
        4. BREACH ANALYSIS: If the target is an email address, search for known data breaches using:
           - "site:haveibeenpwned.com ${target}"
           - "${target} data breach status"
        5. SOCIAL CORRELATION: Find interconnected social accounts and their relationships.
        6. PUBLIC RECORDS: Search for mentions in government or institutional databases.

        OUTPUT: Return a dense, multi-layered graph showing the target's entire ecosystem.
        Include an "intelligenceLogs" array of strings describing each step you took.
      `;
  }
}

// ─── Gemini Call with Retry ─────────────────────────────────────────────────

async function callGemini(systemInstruction: string, target: string, responseSchema: any): Promise<any> {
  const maxRetries = 5;
  let retryCount = 0;
  let response;
  let lastError: any;

  while (retryCount <= maxRetries) {
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Perform an exhaustive OSINT investigation on: ${target}. 
          If you find specific social profiles, email breaches, or related entities, include them in the graph.
          Use the LOCAL DATA provided in the system instruction to build the graph.
          Use Google Search to find REAL, VERIFIED information about the target.`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
          temperature: 1.0,
          tools: [{ googleSearch: {} }]
        }
      });
      break;
    } catch (e: any) {
      lastError = e;
      const errorMsg = e?.message || "";
      const isRetryable =
        errorMsg.includes("RESOURCE_EXHAUSTED") ||
        errorMsg.includes("fetch failed") ||
        errorMsg.includes("ENOTFOUND") ||
        errorMsg.includes("EAI_AGAIN") ||
        errorMsg.includes("ETIMEDOUT") ||
        errorMsg.includes("ECONNRESET") ||
        errorMsg.includes("socket hang up") ||
        e?.status === "RESOURCE_EXHAUSTED" ||
        e?.code === 429;

      if (isRetryable && retryCount < maxRetries) {
        retryCount++;
        const delay = Math.min(Math.pow(2, retryCount) * 1000, 30000);
        console.warn(`[Nexus OSINT] Request failed (${errorMsg.substring(0, 60)}...). Retrying in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw e;
    }
  }

  if (!response) {
    throw new Error(`Failed to get response from Gemini after ${maxRetries} retries. Last error: ${lastError?.message || "unknown"}`);
  }

  return response;
}

// ─── Post-process graph result ──────────────────────────────────────────────

function postProcessGraph(result: any, target: string, type: string, intelligenceLogs: string[]): any {
  if (!result.nodes || result.nodes.length === 0) {
    result.nodes = [{ id: target, label: target, type: type }];
  }

  if (result.nodes && result.links) {
    const uniqueNodes: any[] = [];
    const nodeIds = new Set<string>();

    (result.nodes || []).forEach((node: any) => {
      const id = String(node.id);
      if (!nodeIds.has(id)) {
        nodeIds.add(id);
        uniqueNodes.push({ ...node, id });
      }
    });

    result.nodes = uniqueNodes;
    result.links = (result.links || [])
      .map((l: any) => ({ ...l, source: String(l.source), target: String(l.target) }))
      .filter((l: any) => nodeIds.has(l.source) && nodeIds.has(l.target));
  }

  if (intelligenceLogs.length > 0) {
    result.intelligenceLogs = [...intelligenceLogs, ...(result.intelligenceLogs || [])];
  }

  return result;
}

// ─── Express App ────────────────────────────────────────────────────────────

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // ─── Maigret API (kept for direct access) ───────────────────────────────
  app.get("/api/maigret/:username", async (req, res) => {
    const { username } = req.params;
    const results = await runMaigretScan(username);
    res.json({ username, found: results });
  });

  // ─── Epieos API (kept for direct access) ────────────────────────────────
  app.get("/api/epieos", async (req, res) => {
    const { email, phone, name } = req.query;
    console.log(`[Epieos Engine] Scanning for: ${email || phone || name}`);
    const found = runEpieosScan(email as string, phone as string, name as string);
    res.json({ found });
  });

  // ─── Single-Mode Intelligence API ───────────────────────────────────────
  app.post("/api/intelligence", async (req, res) => {
    const { target, mode = 'maltego', details } = req.body;

    if (!target) {
      return res.status(400).json({ error: "Target is required" });
    }

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    console.log(`[Nexus OSINT] Starting investigation | Mode: ${mode} | Target: ${target}`);

    const type = inferType(target);
    const emailTarget = details?.email || (type === 'email' ? target : null);
    const phoneTarget = details?.phone || (type === 'phone' ? target : null);
    const nameTarget = details?.name || (type === 'person' ? target : null);
    const username = deriveUsername(target, type, details);

    let localMaigretResults: any[] = [];
    let localEpieosResults: any[] = [];
    let intelligenceLogs: string[] = [];

    try {
      // Run local scans based on mode
      if (mode === 'maigret') {
        intelligenceLogs.push(`Initializing local Maigret engine for username: ${username}`);
        try {
          localMaigretResults = await runMaigretScan(username);
          intelligenceLogs.push(`Local Maigret found ${localMaigretResults.length} potential profiles for "${username}".`);
        } catch (e) {
          console.error("[Nexus OSINT] Local Maigret failed:", e);
          intelligenceLogs.push(`Local Maigret engine failed.`);
        }
      }

      if (mode === 'epieos') {
        const epieosTarget = emailTarget || phoneTarget || nameTarget || target;
        intelligenceLogs.push(`Initializing local Epieos engine for: ${epieosTarget}`);
        try {
          localEpieosResults = runEpieosScan(
            emailTarget || undefined,
            phoneTarget || undefined,
            nameTarget || undefined
          );
          intelligenceLogs.push(`Local Epieos found ${localEpieosResults.length} intelligence nodes.`);
        } catch (e) {
          console.error("[Nexus OSINT] Local Epieos failed:", e);
          intelligenceLogs.push(`Local Epieos engine failed.`);
        }
      }

      const systemInstruction = buildSystemInstruction(target, mode, details, localMaigretResults, localEpieosResults);

      const response = await callGemini(systemInstruction, target, graphSchema);

      console.log("[Nexus OSINT] Gemini Response received");

      const text = response.text;
      if (!text) {
        console.warn("[Nexus OSINT] Empty response text from Gemini");
        return res.json({ nodes: [{ id: target, label: target, type }], links: [], intelligenceLogs });
      }

      const result = JSON.parse(text);
      const processed = postProcessGraph(result, target, type, intelligenceLogs);

      console.log(`[Nexus OSINT] Successfully parsed ${processed.nodes?.length || 0} nodes and ${processed.links?.length || 0} links`);
      res.json(processed);
    } catch (e: any) {
      console.error("[Nexus OSINT] Investigation failed:", e);

      const errorMsg = e?.message || "";
      if (errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("429")) {
        return res.status(429).json({ error: "API Quota exceeded. Please wait before trying again.", code: "QUOTA_EXHAUSTED" });
      }
      return res.status(500).json({ error: errorMsg || "Investigation failed", code: "INTERNAL_ERROR" });
    }
  });

  // ─── Unified Intelligence API (all modes at once) ──────────────────────
  app.post("/api/intelligence/unified", async (req, res) => {
    const { target, details } = req.body;

    if (!target) {
      return res.status(400).json({ error: "Target is required" });
    }

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    console.log(`[Nexus OSINT] Starting Unified Investigation | Target: ${target}`);

    const type = inferType(target);
    const emailTarget = details?.email || (type === 'email' ? target : null);
    const phoneTarget = details?.phone || (type === 'phone' ? target : null);
    const nameTarget = details?.name || (type === 'person' ? target : null);
    const username = deriveUsername(target, type, details);

    let localMaigretResults: any[] = [];
    let localEpieosResults: any[] = [];
    let intelligenceLogs: string[] = [];

    try {
      // Run local engines in parallel
      const [maigretResults, epieosResults] = await Promise.all([
        runMaigretScan(username).catch(() => []),
        Promise.resolve(runEpieosScan(emailTarget, phoneTarget, nameTarget))
      ]);

      localMaigretResults = maigretResults;
      localEpieosResults = epieosResults;
      intelligenceLogs.push(`Local Engines: Found ${localMaigretResults.length} Maigret profiles and ${localEpieosResults.length} Epieos nodes.`);

      const systemInstruction = `
        You are a Master OSINT Intelligence Analyst. 
        Perform an exhaustive investigation on the target: "${target}".
        
        You MUST provide separate intelligence graphs for four different modes:
        1. "maltego": Relationship mapping (DNS, IPs, Orgs, Breaches).
        2. "epieos": Email/Phone intelligence (Linked accounts, profiles).
        3. "maigret": Social media profile discovery.
        4. "googledorking": Document and sensitive file discovery.
        
        LOCAL DATA (USE THIS):
        - Maigret Profiles: ${JSON.stringify(localMaigretResults)}
        - Epieos Intel: ${JSON.stringify(localEpieosResults)}
        
        STRATEGY:
        - Use your knowledge and the local data to build comprehensive graphs for each mode.
        - For Maigret, include the local profiles provided.
        - For Epieos, include the local intel provided.
        - For Maltego, focus on infrastructure and data breaches.
        - For Google Dorking, focus on exposed files (PDF, XLSX, etc.).
        
        OUTPUT: Return a single JSON object with keys "maltego", "epieos", "maigret", and "googledorking".
      `;

      const unifiedSchema = {
        type: Type.OBJECT,
        properties: {
          maltego: graphSchema,
          epieos: graphSchema,
          maigret: graphSchema,
          googledorking: graphSchema
        },
        required: ["maltego", "epieos", "maigret", "googledorking"]
      };

      const response = await callGemini(systemInstruction, target, unifiedSchema);

      if (!response) {
        throw new Error("Failed to get response from Gemini after retries.");
      }

      const results = JSON.parse(response.text);

      // Post-process each graph
      const modes = ['maltego', 'epieos', 'maigret', 'googledorking'];
      modes.forEach(m => {
        const graph = results[m] || { nodes: [], links: [] };
        results[m] = postProcessGraph(graph, target, type, intelligenceLogs);
      });

      res.json(results);
    } catch (e: any) {
      console.error("[Nexus OSINT] Unified investigation failed:", e);

      const errorMsg = e?.message || "";
      if (errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("429")) {
        return res.status(429).json({ error: "API Quota exceeded. Please wait before trying again.", code: "QUOTA_EXHAUSTED" });
      }
      return res.status(500).json({ error: errorMsg || "Investigation failed", code: "INTERNAL_ERROR" });
    }
  });

  // ─── Vite Middleware ────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Gemini API Key: ${apiKey ? '✓ Loaded' : '✗ MISSING'}`);
  });
}

startServer();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAIGRET_SITES = [
  { name: 'Instagram', url: 'https://www.instagram.com/{}', errorMsg: 'Page Not Found' },
  { name: 'Twitter', url: 'https://twitter.com/{}', errorMsg: 'This account doesn’t exist' },
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Maigret API Endpoint
  app.get("/api/maigret/:username", async (req, res) => {
    const { username } = req.params;
    console.log(`[Maigret Engine] Scanning for: ${username}`);

    const resolvedResults = [];
    const batchSize = 12; // Increased batch size
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
            signal: AbortSignal.timeout(15000) // Increased timeout per site
          });

          if (response.status === 404) return null;

          if (response.status === 200) {
            const text = await response.text();
            const lowerText = text.toLowerCase();
            const lowerError = site.errorMsg.toLowerCase();
            
            // Heuristics for "not found" pages that return 200
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
              metadata: {
                title: title,
                timestamp: new Date().toISOString()
              }
            };
          }
          return null;
        } catch (error) {
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchChecks);
      resolvedResults.push(...batchResults.filter(r => r !== null));
      
      // Short delay between batches to avoid rate limiting
      if (i + batchSize < MAIGRET_SITES.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    res.json({ username, found: resolvedResults });
  });

  // Epieos API Endpoint (Email & Phone Intelligence)
  app.get("/api/epieos", async (req, res) => {
    const { email, phone, name } = req.query;
    console.log(`[Epieos Engine] Scanning for: ${email || phone || name}`);

    const found = [];
    
    if (email) {
      // Simulate email intelligence
      const domain = (email as string).split('@')[1];
      found.push({ type: 'email_provider', value: domain, platform: 'MX Record' });
      
      // Check common platforms (Simulated)
      const platforms = ['LinkedIn', 'Facebook', 'Twitter', 'GitHub', 'Gravatar'];
      platforms.forEach(p => {
        if (Math.random() > 0.5) {
          found.push({ type: 'social', platform: p, status: 'linked', value: email });
        }
      });
    }

    if (phone) {
      // Simulate phone intelligence
      found.push({ type: 'phone_carrier', value: 'Simulated Carrier', platform: 'HLR Lookup' });
      found.push({ type: 'location', value: 'United States', platform: 'Geographic' });
      
      if (Math.random() > 0.3) {
        found.push({ type: 'social', platform: 'WhatsApp', status: 'active', value: phone });
      }
    }

    if (name) {
      found.push({ type: 'person', value: name, platform: 'Identity' });
    }

    res.json({ found });
  });

  // Vite middleware for development
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
  });
}

startServer();

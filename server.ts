import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

// Load env variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix for fetch (important for Node < 18)
import fetch from "node-fetch";

const MAIGRET_SITES = [
  { name: 'Instagram', url: 'https://www.instagram.com/{}', errorMsg: 'Page Not Found' },
  { name: 'Twitter', url: 'https://twitter.com/{}', errorMsg: 'This account doesn’t exist' },
  { name: 'GitHub', url: 'https://github.com/{}', errorMsg: '404' }
  // (keep rest same)
];

async function startServer() {
  try {
    const app = express();

    // ✅ FIXED PORT
    const PORT = process.env.PORT || 3000;

    // ✅ Middleware
    app.use(cors());
    app.use(express.json());

    // ✅ Health check route
    app.get("/", (req, res) => {
      res.send("Backend is running 🚀");
    });

    // =========================
    // MAIGRET API
    // =========================
    app.get("/api/maigret/:username", async (req, res) => {
      try {
        const { username } = req.params;

        const results = await Promise.all(
          MAIGRET_SITES.map(async (site) => {
            const url = site.url.replace("{}", username);
            try {
              const response = await fetch(url);

              if (response.status !== 200) return null;

              const text = await response.text();

              if (text.toLowerCase().includes(site.errorMsg.toLowerCase())) {
                return null;
              }

              return {
                platform: site.name,
                url,
                status: "found",
              };
            } catch {
              return null;
            }
          })
        );

        res.json({
          username,
          found: results.filter(Boolean),
        });
      } catch (err) {
        res.status(500).json({ error: "Maigret failed" });
      }
    });

    // =========================
    // EPIEOS API
    // =========================
    app.get("/api/epieos", async (req, res) => {
      try {
        const { email, phone, name } = req.query;

        const found: any[] = [];

        if (email) {
          found.push({ type: "email", value: email });
        }

        if (phone) {
          found.push({ type: "phone", value: phone });
        }

        if (name) {
          found.push({ type: "name", value: name });
        }

        res.json({ found });
      } catch (err) {
        res.status(500).json({ error: "Epieos failed" });
      }
    });

    // =========================
    // VITE HANDLING
    // =========================
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");

      app.use(express.static(distPath));

      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    // ✅ START SERVER
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Server failed to start:", error);
  }
}

// ✅ START FUNCTION
startServer();
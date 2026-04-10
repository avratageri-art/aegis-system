import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/genai";

// Load env variables
dotenv.config();

// ✅ Gemini init
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix for fetch (important for Node < 18)
import fetch from "node-fetch";

const MAIGRET_SITES = [
  { name: 'Instagram', url: 'https://www.instagram.com/{}', errorMsg: 'Page Not Found' },
  { name: 'Twitter', url: 'https://twitter.com/{}', errorMsg: 'This account doesn’t exist' },
  { name: 'GitHub', url: 'https://github.com/{}', errorMsg: '404' }
];

async function startServer() {
  try {
    const app = express();

    const PORT = process.env.PORT || 3000;

    app.use(cors());
    app.use(express.json());

    // ✅ Health check
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
      } catch {
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

        if (email) found.push({ type: "email", value: email });
        if (phone) found.push({ type: "phone", value: phone });
        if (name) found.push({ type: "name", value: name });

        res.json({ found });
      } catch {
        res.status(500).json({ error: "Epieos failed" });
      }
    });

    // =========================
    // GEMINI API ✅ NEW
    // =========================
    app.post("/api/gemini", async (req, res) => {
      try {
        const { prompt } = req.body;

        const model = genAI.getGenerativeModel({
          model: "gemini-pro",
        });

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        res.json({ data: text });

      } catch (error) {
        console.error("Gemini error:", error);
        res.status(500).json({ error: "Gemini failed" });
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

    // ✅ Start server
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Server failed to start:", error);
  }
}

startServer();
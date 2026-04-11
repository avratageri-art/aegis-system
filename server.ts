import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch";

dotenv.config();

const app = express();

// ✅ SAFE PORT FIX
const PORT = Number(process.env.PORT) || 3000;

// ✅ CHECK API KEY
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing");
  process.exit(1);
}

// ✅ Gemini setup
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.use(cors());
app.use(express.json());

// =========================
// ROOT
// =========================
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// =========================
// MAIGRET API
// =========================
const MAIGRET_SITES = [
  { name: "Instagram", url: "https://www.instagram.com/{}", errorMsg: "Page Not Found" },
  { name: "Twitter", url: "https://twitter.com/{}", errorMsg: "This account doesn’t exist" },
  { name: "GitHub", url: "https://github.com/{}", errorMsg: "404" }
];

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

  } catch (error) {
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
// GEMINI API
// =========================
app.post("/api/gemini", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    res.json({ data: response.text });

  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({ error: "Gemini failed" });
  }
});

// =========================
// FALLBACK (IMPORTANT)
// =========================
app.get("*", (req, res) => {
  res.send("Backend is running 🚀");
});

// =========================
// START SERVER
// =========================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
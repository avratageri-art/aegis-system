import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { OSINTNode, OSINTLink, OSINTGraph, OSINTMode } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function gatherIntelligence(target: string, mode: OSINTMode = 'maltego', details?: any): Promise<OSINTGraph> {
  console.log(`[Nexus OSINT] Starting investigation | Mode: ${mode} | Target: ${target}`);
  
  let localMaigretResults: any[] = [];
  let localEpieosResults: any[] = [];
  let intelligenceLogs: string[] = [];

  // Infer type for graph nodes
  const inferType = (val: string): any => {
    if (val.includes('@')) return 'email';
    if (val.match(/^\d+$/)) return 'phone';
    if (val.match(/^[0-9.]+$/)) return 'ip';
    if (val.includes('.')) return 'domain';
    return 'person';
  };

  const type = inferType(target);
  
  // Extract best identifiers if details are provided
  const emailTarget = details?.email || (type === 'email' ? target : null);
  const phoneTarget = details?.phone || (type === 'phone' ? target : null);
  const nameTarget = details?.name || (type === 'person' ? target : null);
  
  // For Maigret, we need a username. Try to derive one.
  let username = target;
  if (details?.name) {
    username = details.name.toLowerCase().replace(/\s+/g, '');
  } else if (type === 'email') {
    username = target.split('@')[0];
  } else if (target.includes(' | ')) {
    const parts = target.split(' | ');
    username = parts[0].toLowerCase().replace(/\s+/g, '');
  }

  if (mode === 'maigret') {
    intelligenceLogs.push(`Initializing local Maigret engine for username: ${username}`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const response = await fetch(`/api/maigret/${encodeURIComponent(username)}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        localMaigretResults = data.found || [];
        intelligenceLogs.push(`Local Maigret found ${localMaigretResults.length} potential profiles for "${username}".`);
      }
    } catch (e) {
      console.error("[Nexus OSINT] Local Maigret failed:", e);
      intelligenceLogs.push(`Local Maigret engine failed.`);
    }
  }

  if (mode === 'epieos') {
    const epieosTarget = emailTarget || phoneTarget || nameTarget || target;
    intelligenceLogs.push(`Initializing local Epieos engine for: ${epieosTarget}`);
    try {
      const queryParams = new URLSearchParams();
      if (emailTarget) queryParams.append('email', emailTarget);
      if (phoneTarget) queryParams.append('phone', phoneTarget);
      if (nameTarget) queryParams.append('name', nameTarget);
      
      const response = await fetch(`/api/epieos?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        localEpieosResults = data.found || [];
        intelligenceLogs.push(`Local Epieos found ${localEpieosResults.length} intelligence nodes.`);
      }
    } catch (e) {
      console.error("[Nexus OSINT] Local Epieos failed:", e);
      intelligenceLogs.push(`Local Epieos engine failed, falling back to AI search.`);
    }
  }

  let systemInstruction = "";
  
  switch (mode) {
    case 'epieos':
      systemInstruction = `
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
      break;
    case 'maigret':
      systemInstruction = `
        You are "Maigret", a world-class social media intelligence expert.
        Your goal is to find EVERY possible social media profile, professional account, and public persona for the username: "${target}".
        
        LOCAL SCAN RESULTS (DIRECT URL PROBING):
        ${JSON.stringify(localMaigretResults, null, 2)}
        
        CRITICAL INSTRUCTIONS:
        1. YOU MUST NOT GUESS OR HALLUCINATE URLS. Do not simply append ".com" to the username.
        2. YOU MUST include the local scan results provided above in the final graph. These are VERIFIED accounts.
        3. For every profile found in LOCAL SCAN RESULTS, create a node and include the "url" provided in the local scan in the "data.url" field.
        4. CROSS-PLATFORM CORRELATION: If you find a verified profile (e.g., GitHub), look for links to other platforms in its bio or public data.
        5. Use the googleSearch tool to find ADDITIONAL profiles. Only include them if the search results explicitly confirm the account exists.
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
      break;
    case 'googledorking':
      systemInstruction = `
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
      break;
    default: // maltego
      systemInstruction = `
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

  try {
    const maxRetries = 3;
    let retryCount = 0;
    let response;

    while (retryCount <= maxRetries) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Perform an exhaustive OSINT investigation on: ${target}. 
            Use the googleSearch tool to find real-time data.
            If you find specific social profiles, email breaches, or related entities, include them in the graph.`,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
            tools: [{ googleSearch: {} }],
            toolConfig: { includeServerSideToolInvocations: true },
            responseMimeType: "application/json",
            responseSchema: {
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
                        properties: {
                          url: { type: Type.STRING }
                        }
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
            }
          }
        });
        break;
      } catch (e: any) {
        const isQuotaError = e?.message?.includes("RESOURCE_EXHAUSTED") || e?.status === "RESOURCE_EXHAUSTED" || e?.code === 429;
        if (isQuotaError && retryCount < maxRetries) {
          retryCount++;
          const delay = Math.pow(2, retryCount) * 1000;
          console.warn(`[Nexus OSINT] Quota exceeded. Retrying in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw e;
      }
    }

    if (!response) {
      throw new Error("Failed to get response from Gemini after retries.");
    }

    const text = response.text;
    if (!text) {
      console.warn("[Nexus OSINT] Empty response text from Gemini");
      return { nodes: [], links: [] };
    }

    const result = JSON.parse(text);
    
    // Ensure at least the target node exists
    if (!result.nodes || result.nodes.length === 0) {
      result.nodes = [{ id: target, label: target, type: type }];
    }

    // Validate graph data
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
  } catch (e: any) {
    console.error("[Nexus OSINT] Investigation failed:", e);
    throw e;
  }
}

import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface OSINTNode {
  id: string;
  label: string;
  type: 'person' | 'domain' | 'ip' | 'email' | 'organization' | 'alias' | 'phone' | 'social' | 'document';
  data?: any;
  color?: string;
}

export interface OSINTLink {
  source: string;
  target: string;
  label?: string;
}

export interface OSINTGraph {
  nodes: OSINTNode[];
  links: OSINTLink[];
  intelligenceLogs?: string[];
}

export type OSINTMode = 'maltego' | 'epieos' | 'maigret' | 'googledorking';

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

  if (mode === 'maigret') {
    intelligenceLogs.push(`Initializing local Maigret engine for: ${target}`);
    try {
      const response = await fetch(`/api/maigret/${encodeURIComponent(target)}`);
      if (response.ok) {
        const data = await response.json();
        localMaigretResults = data.found || [];
        intelligenceLogs.push(`Local Maigret found ${localMaigretResults.length} potential profiles.`);
        
        // Construct graph directly from local results, bypassing AI
        const nodes: OSINTNode[] = [
          { id: target, label: target, type: type }
        ];
        const links: OSINTLink[] = [];
        
        localMaigretResults.forEach((res: any) => {
          const nodeId = `social_${res.platform.toLowerCase()}_${target}`;
          nodes.push({
            id: nodeId,
            label: res.platform,
            type: 'social',
            data: { 
              url: res.url,
              title: res.metadata?.title,
              timestamp: res.metadata?.timestamp
            }
          });
          links.push({
            source: target,
            target: nodeId,
            label: 'profile'
          });
        });

        return { nodes, links, intelligenceLogs };
      }
    } catch (e) {
      console.error("[Nexus OSINT] Local Maigret failed:", e);
      intelligenceLogs.push(`Local Maigret engine failed.`);
      return { nodes: [{ id: target, label: target, type: type }], links: [], intelligenceLogs };
    }
  }

  if (mode === 'epieos') {
    intelligenceLogs.push(`Initializing local Epieos engine for: ${target}`);
    try {
      const queryParams = new URLSearchParams();
      if (details?.email) queryParams.append('email', details.email);
      if (details?.phone) queryParams.append('phone', details.phone);
      if (details?.name) queryParams.append('name', details.name);
      
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

  let breachResults: any[] = [];
  if (type === 'email') {
    intelligenceLogs.push(`Initializing HIBP Node for breach analysis on: ${target}`);
    try {
      // We use Google Search to find known breaches for the email
      // In a real app, we'd use HIBP API, but here we use the AI's search capability
      intelligenceLogs.push(`Scanning global breach databases for ${target}...`);
    } catch (e) {
      console.error("[Nexus OSINT] Breach check failed:", e);
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
        Your goal is to find publicly exposed documents and sensitive files.
        STRATEGY:
        - Use operators: "site:${target} filetype:pdf", "site:${target} filetype:xlsx", "intitle:index.of".
        - Look for shared Google Drive links.
        OUTPUT: Return a graph connecting the target to discovered documents with their URLs.
        Include an "intelligenceLogs" array of strings describing each step you took.
      `;
      break;
    default: // maltego
      systemInstruction = `
        You are "Maltego", a relationship mapping engine.
        Your goal is to map the entire digital footprint of ${target}.
        STRATEGY:
        - Map DNS, IPs, social media, organizations, and people.
        - BREACH ANALYSIS: If the target is an email address, you MUST search for known data breaches and "pwned" status using queries like:
           - "site:haveibeenpwned.com ${target}"
           - "${target} data breach status"
        - Find interconnected entities.
        - If breaches are found, create a node of type "breach" for each major breach discovered.
        OUTPUT: Return a dense, multi-layered graph.
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
          contents: `Perform an exhaustive OSINT investigation on: ${target}. Use the googleSearch tool to find real-time data.`,
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
        break; // Success, exit loop
      } catch (e: any) {
        const isQuotaError = e?.message?.includes("RESOURCE_EXHAUSTED") || e?.status === "RESOURCE_EXHAUSTED" || e?.code === 429;
        if (isQuotaError && retryCount < maxRetries) {
          retryCount++;
          const delay = Math.pow(2, retryCount) * 1000;
          console.warn(`[Nexus OSINT] Quota exceeded. Retrying in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw e; // Re-throw if not a quota error or max retries reached
      }
    }

    if (!response) {
      throw new Error("Failed to get response from Gemini after retries.");
    }

    console.log("[Nexus OSINT] Gemini Response received");
    
    const text = response.text;
    if (!text) {
      console.warn("[Nexus OSINT] Empty response text from Gemini");
      return { nodes: [], links: [] };
    }

    const result = JSON.parse(text);
    
    // Validate graph data to prevent "node not found" errors in ForceGraph
    if (result.nodes && result.links) {
      // Ensure unique nodes and string IDs
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
      
      // Filter links to only include those between existing nodes
      result.links = (result.links || [])
        .map((l: any) => ({ ...l, source: String(l.source), target: String(l.target) }))
        .filter((l: any) => nodeIds.has(l.source) && nodeIds.has(l.target));
    }

    if (intelligenceLogs.length > 0) {
      result.intelligenceLogs = [...intelligenceLogs, ...(result.intelligenceLogs || [])];
    }
    console.log(`[Nexus OSINT] Successfully parsed ${result.nodes?.length || 0} nodes and ${result.links?.length || 0} links`);
    return result;
  } catch (e) {
    console.error("[Nexus OSINT] Investigation failed:", e);
    throw e;
  }
}

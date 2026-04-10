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

// ✅ MAIN FUNCTION
export async function gatherIntelligence(target: string, mode: OSINTMode = 'maltego', details?: any): Promise<OSINTGraph> {

  // 👉 call your backend instead of Gemini directly
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: `Perform OSINT investigation on: ${target} using mode: ${mode}`
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Gemini response");
  }

  const data = await response.json();

  return data.data; // comes from backend
}
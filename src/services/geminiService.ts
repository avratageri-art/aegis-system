// Frontend service — calls server-side API routes instead of Gemini directly.
// The API key and all AI logic live on the server.

export interface OSINTNode {
  id: string;
  label: string;
  type: 'person' | 'domain' | 'ip' | 'email' | 'organization' | 'alias' | 'phone' | 'social' | 'document' | 'breach';
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

export async function gatherUnifiedIntelligence(target: string, details?: any): Promise<Record<OSINTMode, OSINTGraph>> {
  console.log(`[Nexus OSINT] Requesting Unified Investigation | Target: ${target}`);

  const response = await fetch('/api/intelligence/unified', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, details })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  return response.json();
}

export async function gatherIntelligence(target: string, mode: OSINTMode = 'maltego', details?: any): Promise<OSINTGraph> {
  console.log(`[Nexus OSINT] Requesting investigation | Mode: ${mode} | Target: ${target}`);

  const response = await fetch('/api/intelligence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, mode, details })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  const result = await response.json();

  console.log(`[Nexus OSINT] Received ${result.nodes?.length || 0} nodes and ${result.links?.length || 0} links`);
  return result;
}

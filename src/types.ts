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

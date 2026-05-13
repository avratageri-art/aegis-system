import React from 'react';
import { OSINTNode } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Shield, ExternalLink, Copy, Share2 } from 'lucide-react';

interface DetailsPanelProps {
  node: OSINTNode | null;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({ node }) => {
  if (!node) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6 opacity-30">
        <div className="w-16 h-16 rounded-full border border-dashed border-primary/30 flex items-center justify-center">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-primary">No Node Selected</p>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Select an entity on the neural map to view forensic data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black/40 backdrop-blur-xl">
      <div className="p-6 space-y-4 border-b border-border">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[9px] font-mono uppercase tracking-[0.2em] border-primary/30 text-primary bg-primary/5">
            {node.type}
          </Badge>
          <div className="flex gap-2">
            <button className="p-1.5 hover:bg-primary/10 rounded border border-border transition-colors">
              <Copy className="w-3 h-3 text-muted-foreground" />
            </button>
            <button className="p-1.5 hover:bg-primary/10 rounded border border-border transition-colors">
              <Share2 className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-display tracking-tight text-foreground uppercase">{node.label}</h3>
          <div className="text-[9px] font-mono text-muted-foreground break-all mt-2 opacity-60 uppercase tracking-widest">
            ID: {node.id}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-8">
          {/* Quick Actions */}
          {(node.data?.url || (typeof node.id === 'string' && (node.id.startsWith('http://') || node.id.startsWith('https://')))) && (
            <section className="space-y-4">
              <button 
                onClick={() => {
                  const url = node.data?.url || node.id;
                  const link = document.createElement('a');
                  link.href = url;
                  link.target = '_blank';
                  link.rel = 'noopener noreferrer';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="w-full flex items-center justify-center gap-3 bg-primary/20 text-primary border border-primary/50 py-4 rounded-xl font-display uppercase tracking-[0.2em] hover:bg-primary/30 transition-all glow-red shadow-lg shadow-primary/10"
              >
                <ExternalLink className="w-4 h-4" />
                {node.type === 'social' ? 'Visit Social Profile' : 'Access Intelligence Link'}
              </button>
            </section>
          )}

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-primary" />
              <h4 className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">Forensic Data</h4>
            </div>
            {node.data && Object.keys(node.data).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(node.data).map(([key, value]) => (
                  <div key={key} className="space-y-2 group">
                    <p className="text-[9px] font-mono uppercase text-muted-foreground/50 tracking-widest group-hover:text-primary/50 transition-colors">{key.replace(/_/g, ' ')}</p>
                    <div className="text-xs bg-black/40 p-3 rounded-lg border border-border/50 break-words font-mono group-hover:border-primary/20 transition-colors">
                      {typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://')) ? (
                        <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-2">
                          {value}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-foreground/80">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border border-dashed border-border rounded-lg text-center">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">No metadata artifacts found.</p>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-primary" />
              <h4 className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">External Pivots</h4>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(node.label)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-[10px] font-mono uppercase tracking-widest"
              >
                <span>Google Intelligence</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              {node.type === 'domain' && (
                <a
                  href={`https://who.is/whois/${node.label}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-[10px] font-mono uppercase tracking-widest"
                >
                  <span>WHOIS Registry</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
};

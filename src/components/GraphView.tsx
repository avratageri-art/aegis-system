import React, { useCallback, useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { OSINTGraph, OSINTNode } from '../services/geminiService';
import { ExternalLink } from 'lucide-react';

interface GraphViewProps {
  data: OSINTGraph;
  onNodeClick: (node: OSINTNode) => void;
  selectedNodeId?: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  person: '#ff4d4d', // neon red
  domain: '#00f2ff', // neon cyan
  ip: '#bc13fe', // neon purple
  email: '#ff00ff', // neon magenta
  organization: '#39ff14', // neon green
  alias: '#ff9e00', // neon orange
  phone: '#00ff9f', // neon teal
  social: '#4d4dff', // neon blue
  document: '#faff00', // neon yellow
  breach: '#ff0000', // pure neon red for danger
};

export const GraphView: React.FC<GraphViewProps> = ({ data, onNodeClick, selectedNodeId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const openUrl = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getUrl = (node: any) => {
    let url = node.data?.url || node.data?.URL || node.data?.link || node.data?.profile_url;
    if (!url && typeof node.id === 'string' && node.id.startsWith('http')) url = node.id;
    if (!url && typeof node.label === 'string' && node.label.startsWith('http')) url = node.label;
    return url;
  };

  const handleNodeClick = useCallback((node: any) => {
    const url = getUrl(node);
    if (url) {
      openUrl(url);
    }
    onNodeClick(node as OSINTNode);
  }, [onNodeClick]);

  const handleNodeRightClick = useCallback((node: any) => {
    const url = getUrl(node);
    if (url) {
      openUrl(url);
    }
  }, []);

  const selectedNode = data.nodes.find(n => n.id === selectedNodeId);
  const selectedNodeUrl = selectedNode ? getUrl(selectedNode) : null;

  return (
    <div ref={containerRef} className="w-full h-full relative graph-container overflow-hidden rounded-lg border border-border">
      <ForceGraph2D
        graphData={data}
        width={dimensions.width}
        height={dimensions.height}
        nodeLabel="label"
        nodeColor={(node: any) => TYPE_COLORS[node.type] || '#94a3b8'}
        nodeRelSize={6}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        onNodeClick={handleNodeClick}
        onNodeRightClick={handleNodeRightClick}
        onNodeDragEnd={(node: any) => {
          node.fx = node.x;
          node.fy = node.y;
        }}
        linkColor={() => 'rgba(255, 255, 255, 0.1)'}
        linkWidth={1}
        backgroundColor="rgba(0,0,0,0)"
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const type = (node.type || '').toLowerCase();
          const color = TYPE_COLORS[type] || '#94a3b8';
          const isSelected = node.id === selectedNodeId;
          const label = node.label;
          
          // Robust URL detection
          const url = getUrl(node);
          
          const fontSize = 12 / globalScale;
          const urlFontSize = 8 / globalScale;
          
          // Node circle with glow
          ctx.beginPath();
          ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI, false);
          ctx.fillStyle = isSelected ? '#ffffff' : color;
          
          if (isSelected) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = color;
          }
          ctx.fill();
          ctx.shadowBlur = 0;

          // Calculate dimensions
          ctx.font = `${fontSize}px "JetBrains Mono"`;
          const labelWidth = ctx.measureText(label).width;
          
          let totalWidth = labelWidth;
          let totalHeight = fontSize;
          
          const displayUrl = url && url.length > 40 ? url.substring(0, 37) + '...' : url;

          if (displayUrl) {
            ctx.font = `${urlFontSize}px "JetBrains Mono"`;
            const urlWidth = ctx.measureText(displayUrl).width;
            totalWidth = Math.max(labelWidth, urlWidth);
            totalHeight += urlFontSize + 4;
          }

          const bckgDimensions = [totalWidth, totalHeight].map(n => n + fontSize * 0.5);

          // Label background
          ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y + 8, bckgDimensions[0], bckgDimensions[1]);
          
          // Border for selected
          if (isSelected) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1 / globalScale;
            ctx.strokeRect(node.x - bckgDimensions[0] / 2, node.y + 8, bckgDimensions[0], bckgDimensions[1]);
          }

          // Label text
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.font = `${fontSize}px "JetBrains Mono"`;
          ctx.fillStyle = isSelected ? '#ffffff' : color;
          ctx.fillText(label, node.x, node.y + 10);

          // URL text
          if (displayUrl) {
            ctx.font = `${urlFontSize}px "JetBrains Mono"`;
            ctx.fillStyle = isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)';
            ctx.fillText(displayUrl, node.x, node.y + 10 + fontSize + 2);
          }
        }}
      />
      
      {/* Selection Overlay */}
      {selectedNodeUrl && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={() => openUrl(selectedNodeUrl)}
            className="flex items-center gap-3 bg-primary/20 text-primary border border-primary/50 px-8 py-3 rounded-xl font-display uppercase tracking-[0.2em] hover:bg-primary/30 transition-all shadow-2xl shadow-primary/40 animate-in fade-in zoom-in duration-300 glow-red"
          >
            <ExternalLink className="w-4 h-4" />
            {selectedNode?.type === 'social' ? 'Visit Social Profile' : 'Access Intelligence Link'}
          </button>
        </div>
      )}

      <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
        <div className="bg-black/40 backdrop-blur-md border border-border px-4 py-2 rounded-lg text-[9px] font-mono text-muted-foreground flex items-center gap-3 uppercase tracking-widest">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span>Neural Link Active</span>
        </div>
      </div>
      
      <div className="absolute bottom-6 left-6 flex flex-wrap gap-3 pointer-events-none max-w-md">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border text-[8px] uppercase tracking-[0.2em] font-mono text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
            <span>{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

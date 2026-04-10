import React, { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, Loader2, Globe, Mail, User, Shield, Hash, Phone, FileText, Network, Zap, SearchCode, ArrowRight, Ghost, Terminal, X as CloseIcon, Info } from 'lucide-react';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { OSINTMode } from '../services/geminiService';

interface SearchPanelProps {
  onSearch: (target: string, mode: OSINTMode, details?: any) => void;
  isLoading: boolean;
  isLanding?: boolean;
  currentMode?: OSINTMode;
  onModeChange?: (mode: OSINTMode) => void;
}

export const OSINT_TOOLS = [
  { id: 'maltego', label: 'Maltego', description: 'Relationship Mapping', icon: Network },
  { id: 'epieos', label: 'Epieos', description: 'Email & Phone Intel', icon: Zap },
  { id: 'maigret', label: 'Maigret', description: 'Advanced Profile Finder', icon: User },
  { id: 'googledorking', label: 'Google Dorking', description: 'Document Dorking', icon: FileText },
] as const;

export const SearchPanel: React.FC<SearchPanelProps> = ({ onSearch, isLoading, isLanding, currentMode, onModeChange }) => {
  const [target, setTarget] = useState('');
  const [localMode, setLocalMode] = useState<OSINTMode>('maltego');
  const [darkside, setDarkside] = useState(false);
  const [ctfMode, setCtfMode] = useState(false);
  const [targetDetails, setTargetDetails] = useState({ name: '', email: '', phone: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const mode = currentMode || localMode;
  const setMode = onModeChange || setLocalMode;

  const handleModeChange = (newMode: OSINTMode) => {
    setMode(newMode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'epieos') {
      const summary = [targetDetails.name, targetDetails.email, targetDetails.phone].filter(Boolean).join(' | ');
      if (summary) {
        onSearch(summary, mode, targetDetails);
      }
    } else if (target.trim()) {
      onSearch(target.trim(), mode);
    }
  };

  const getPlaceholder = () => {
    if (isLanding) return "EMAIL / USERNAME / HANDLE...";
    if (mode === 'maigret') return "Enter name or username...";
    if (mode === 'epieos') return "Click to enter target details...";
    if (mode === 'googledorking') return "Enter domain or keyword...";
    return "Enter target...";
  };

  if (isLanding) {
    return (
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="relative group">
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 text-primary font-mono text-xl opacity-50 group-focus-within:opacity-100 transition-opacity">
            &gt;_
          </div>
          {mode === 'epieos' ? (
            <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <Dialog.Trigger asChild>
                <button
                  type="button"
                  className="w-full h-16 bg-transparent border-none text-2xl font-mono tracking-widest text-left truncate placeholder:text-foreground/20 focus:outline-none p-0"
                >
                  {[targetDetails.name, targetDetails.email, targetDetails.phone].filter(Boolean).join(' | ') || getPlaceholder()}
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] animate-in fade-in" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-card border border-border p-8 rounded-2xl shadow-2xl z-[201] animate-in zoom-in-95 slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title className="text-xl font-display uppercase tracking-widest text-primary">Target Intelligence</Dialog.Title>
                    <Dialog.Close asChild>
                      <button className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    </Dialog.Close>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Full Name</label>
                      <Input 
                        placeholder="e.g. John Doe" 
                        value={targetDetails.name}
                        onChange={(e) => setTargetDetails(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-secondary/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Email Address</label>
                      <Input 
                        placeholder="e.g. john@example.com" 
                        value={targetDetails.email}
                        onChange={(e) => setTargetDetails(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-secondary/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Phone Number</label>
                      <Input 
                        placeholder="e.g. +1234567890" 
                        value={targetDetails.phone}
                        onChange={(e) => setTargetDetails(prev => ({ ...prev, phone: e.target.value }))}
                        className="bg-secondary/30"
                      />
                    </div>
                    <Button 
                      type="button" 
                      onClick={() => setIsDialogOpen(false)}
                      className="w-full h-12 font-bold uppercase tracking-widest mt-4"
                    >
                      Save Intelligence
                    </Button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          ) : (
            <Input
              placeholder={getPlaceholder()}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="h-16 bg-transparent border-none text-2xl font-mono tracking-widest placeholder:text-foreground/20 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
              autoFocus
            />
          )}
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-primary/50 to-transparent" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Switch checked={darkside} onCheckedChange={setDarkside} className="data-[state=checked]:bg-primary" />
              <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                <Ghost className="w-3 h-3" /> Darkside Protocol
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={ctfMode} onCheckedChange={setCtfMode} className="data-[state=checked]:bg-primary" />
              <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                <Terminal className="w-3 h-3" /> CTF Mode
              </span>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading || (mode === 'epieos' ? !Object.values(targetDetails).some(Boolean) : !target.trim())}
            className="h-12 px-8 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-display uppercase tracking-widest group"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Initialize Multi-Engine Scan <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border/50">
          {OSINT_TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => handleModeChange(tool.id as OSINTMode)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                mode === tool.id 
                  ? 'bg-primary/10 border-primary/50 text-primary' 
                  : 'bg-black/20 border-border hover:border-primary/30 text-muted-foreground'
              }`}
            >
              <tool.icon className="w-5 h-5" />
              <span className="text-[9px] font-mono uppercase tracking-widest">{tool.label}</span>
            </button>
          ))}
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Target Entity</label>
          <div className="relative">
            {mode === 'epieos' ? (
              <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <Dialog.Trigger asChild>
                  <button
                    type="button"
                    className="w-full pl-10 h-12 bg-secondary/50 border border-border rounded-md text-left text-sm font-mono truncate hover:bg-secondary/70 transition-colors"
                  >
                    {[targetDetails.name, targetDetails.email, targetDetails.phone].filter(Boolean).join(' | ') || 'Click to enter details...'}
                  </button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] animate-in fade-in" />
                  <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-card border border-border p-8 rounded-2xl shadow-2xl z-[201] animate-in zoom-in-95 slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-6">
                      <Dialog.Title className="text-xl font-display uppercase tracking-widest text-primary">Target Intelligence</Dialog.Title>
                      <Dialog.Close asChild>
                        <button className="p-2 hover:bg-secondary rounded-full transition-colors">
                          <CloseIcon className="w-4 h-4" />
                        </button>
                      </Dialog.Close>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Full Name</label>
                        <Input 
                          placeholder="e.g. John Doe" 
                          value={targetDetails.name}
                          onChange={(e) => setTargetDetails(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-secondary/30"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Email Address</label>
                        <Input 
                          placeholder="e.g. john@example.com" 
                          value={targetDetails.email}
                          onChange={(e) => setTargetDetails(prev => ({ ...prev, email: e.target.value }))}
                          className="bg-secondary/30"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Phone Number</label>
                        <Input 
                          placeholder="e.g. +1234567890" 
                          value={targetDetails.phone}
                          onChange={(e) => setTargetDetails(prev => ({ ...prev, phone: e.target.value }))}
                          className="bg-secondary/30"
                        />
                      </div>
                      <Button 
                        type="button" 
                        onClick={() => setIsDialogOpen(false)}
                        className="w-full h-12 font-bold uppercase tracking-widest mt-4"
                      >
                        Save Intelligence
                      </Button>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            ) : (
              <Input
                placeholder={getPlaceholder()}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="pl-10 h-12 bg-secondary/50 border-border focus:ring-primary"
              />
            )}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        <Separator className="bg-border/50" />

        <div className="space-y-2">
          <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Intelligence Tool</label>
          <div className="grid grid-cols-1 gap-2">
            {OSINT_TOOLS.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => handleModeChange(tool.id as OSINTMode)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                  mode === tool.id 
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' 
                    : 'bg-secondary/20 border-border hover:bg-secondary/40'
                }`}
              >
                <div className={`p-2 rounded-md ${mode === tool.id ? 'bg-primary-foreground/20' : 'bg-secondary'}`}>
                  <tool.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">{tool.label}</p>
                  <p className={`text-[9px] uppercase tracking-tight ${mode === tool.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {tool.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full h-12 font-bold uppercase tracking-widest" disabled={isLoading || (mode === 'epieos' ? !Object.values(targetDetails).some(Boolean) : !target.trim())}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Multi-Engine Scan...
            </>
          ) : (
            'Execute Investigation'
          )}
        </Button>
      </form>
    </div>
  );
};

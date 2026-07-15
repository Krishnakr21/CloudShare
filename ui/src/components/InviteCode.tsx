'use client';

import { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';

interface InviteCodeProps {
  port: number | null;
}

export default function InviteCode({ port }: InviteCodeProps) {
  const [copied, setCopied] = useState(false);
  
  if (!port) return null;
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(port.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="bg-emerald-500/5 border border-emerald-500/15 p-5 rounded-2xl space-y-4 animate-fade-in">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-emerald-200 uppercase tracking-wider">File Gateway Ready!</h3>
        <p className="text-xs text-slate-100">
          Share this numeric invite code with your peer to open a direct socket connection:
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-black/35 px-4 py-3 rounded-xl border border-white/5 font-mono text-xl text-center tracking-[0.25em] text-white shadow-inner select-all">
          {port}
        </div>
        <button
          onClick={copyToClipboard}
          className={`p-3.5 rounded-xl border transition-all duration-300 ${
            copied 
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200' 
              : 'bg-white/5 border-white/10 hover:bg-white/10 text-white hover:border-white/20'
          }`}
          aria-label="Copy invite code"
        >
          {copied ? <FiCheck className="w-5 h-5 animate-scale-up" /> : <FiCopy className="w-5 h-5" />}
        </button>
      </div>
      
      <p className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider">
        Important: Keep this browser tab open to continue hosting the file server.
      </p>
    </div>
  );
}

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, X, Copy, Check, Wifi, Globe, ExternalLink } from 'lucide-react';

export default function PhoneConnectModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Compute the network address
  // If window.location.hostname is localhost or 127.0.0.1, we suggest the local Wi-Fi IP
  const currentPort = window.location.port || '5173';
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // Default to detected Wi-Fi IP or current host
  const networkUrl = isLocal 
    ? `http://192.168.193.183:${currentPort}` 
    : window.location.origin;

  const handleCopy = () => {
    navigator.clipboard.writeText(networkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#30AFFF]/15 flex items-center justify-center text-[#006dae]">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">
                Open on Phone or Tablet
              </h3>
              <p className="text-[11px] text-slate-500">Scan QR with your mobile camera</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="p-3 bg-white rounded-2xl border-2 border-[#30AFFF]/40 shadow-xs inline-block">
            <QRCodeSVG
              value={networkUrl}
              size={180}
              level="M"
              includeMargin={true}
            />
          </div>
          <span className="text-[11px] font-semibold text-slate-500 mt-2 flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            Must be on the same Wi-Fi network
          </span>
        </div>

        {/* URL Box */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Direct Mobile URL:
          </label>
          <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="text-xs font-mono font-bold text-slate-800 truncate flex-1 pl-1">
              {networkUrl}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-[#006dae] shadow-2xs transition-colors shrink-0"
              title="Copy link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Help text */}
        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          Volunteers and participants can use their mobile cameras for in-person gate scanning and attendance allotment on the go.
        </p>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
        >
          Close
        </button>

      </div>
    </div>
  );
}

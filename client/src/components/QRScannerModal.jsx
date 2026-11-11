import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, RefreshCw, AlertCircle, CheckCircle2, QrCode } from 'lucide-react';

export default function QRScannerModal({ isOpen, onClose, onScanSuccess, title, mode = 'PARTICIPANT' }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const qrCodeId = 'reader-container';
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(qrCodeId);
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(minEdge * 0.8),
              height: Math.floor(minEdge * 0.8)
            };
          }
        },
        (decodedText) => {
          handleSuccess(decodedText);
        },
        () => {
          // Frame scan miss, normal in stream
        }
      );
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera failed to start:', err);
      setCameraError('Camera access unavailable or restricted in this browser session. You can enter the Roll Number or Team Name manually below.');
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.error('Error stopping scanner:', e);
      }
    }
    setCameraActive(false);
  };

  const handleSuccess = (text) => {
    stopCamera();
    onScanSuccess(text);
    onClose();
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleSuccess(manualCode.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-2xs animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-[#92EEFF]/30 to-[#30AFFF]/20 border-b border-slate-200 text-slate-900 shrink-0">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#006dae]" />
            <h3 className="font-black text-sm sm:text-base tracking-tight">
              {title || (mode === 'GATE_PASS' ? 'ARENIUM 27 Delegate Gate Pass Scanner' : mode === 'TEAM' ? 'Team QR Verification Scanner' : 'Participant Attendance Scanner')}
            </h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Camera Viewport */}
          <div className="relative w-full aspect-square max-w-[260px] mx-auto rounded-2xl overflow-hidden bg-slate-950 border-2 border-dashed border-[#30AFFF] flex items-center justify-center shadow-inner">
            <div id="reader-container" className="w-full h-full"></div>
            
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-900 text-white space-y-2">
                <Camera className="w-8 h-8 text-slate-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-300">
                  {cameraError ? 'Optical Camera Unavailable' : 'Activating Camera...'}
                </span>
                {cameraError && (
                  <p className="text-[10px] text-slate-400">
                    Enter the Roll Number or Team Name in the manual field below
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="text-center text-xs text-slate-500">
            Point camera at the participant's dynamic QR pass, or enter the ID below.
          </div>

          {/* Manual Input */}
          <form onSubmit={handleManualSubmit} className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              {mode === 'GATE_PASS' ? 'Manual Pass ID / USN / UTR:' : mode === 'TEAM' ? 'Manual Team Name Input:' : 'Manual Roll Number / QR Data Input:'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder={mode === 'GATE_PASS' ? 'Enter Reg ID (ARENIUM27-REG-1042) or USN...' : mode === 'TEAM' ? 'Enter Team Name...' : 'Enter Roll No (e.g. 20231CSE0001)...'}
                className="flex-1 px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#30AFFF]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 text-xs font-bold bg-[#30AFFF] text-white rounded-xl hover:bg-[#2090e0] shadow-xs active:scale-95 transition-all"
              >
                Submit
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
}

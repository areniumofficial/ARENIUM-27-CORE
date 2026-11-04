import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, RefreshCw, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function QRScannerModal({ isOpen, onClose, onScanSuccess, title, mode = 'PARTICIPANT' }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Sample presets for 1-click testing when camera is unavailable
  const SAMPLE_PRESETS = mode === 'TEAM' ? [
    { label: 'Team: CyberKnights', data: JSON.stringify({ type: 'ARENIUM_TEAM', teamName: 'CyberKnights' }) },
    { label: 'Team: QuantumForge', data: JSON.stringify({ type: 'ARENIUM_TEAM', teamName: 'QuantumForge' }) }
  ] : [
    {
      label: 'Tanmay (CSE-08, CyberKnights)',
      data: JSON.stringify({
        type: 'ARENIUM_PARTICIPANT',
        id: 'mem-1',
        name: 'Tanmay Bhattacharya',
        rollNumber: '20221CSE0552',
        section: 'CSE-08',
        batchNumber: 'Batch 2022-26',
        schoolName: 'School of Engineering',
        hodName: 'Dr. Ramesh Kumar',
        teamName: 'CyberKnights'
      })
    },
    {
      label: 'Sneha (CSE-08, CyberKnights)',
      data: JSON.stringify({
        type: 'ARENIUM_PARTICIPANT',
        id: 'mem-2',
        name: 'Sneha Kulkarni',
        rollNumber: '20221CSE0558',
        section: 'CSE-08',
        batchNumber: 'Batch 2022-26',
        schoolName: 'School of Engineering',
        hodName: 'Dr. Ramesh Kumar',
        teamName: 'CyberKnights'
      })
    },
    {
      label: 'Meera (MEC-01, QuantumForge)',
      data: JSON.stringify({
        type: 'ARENIUM_PARTICIPANT',
        id: 'mem-4',
        name: 'Meera Nambiar',
        rollNumber: '20231MEC0014',
        section: 'MEC-01',
        batchNumber: 'Batch 2023-27',
        schoolName: 'School of Engineering',
        hodName: 'Dr. Priya Sharma',
        teamName: 'QuantumForge'
      })
    }
  ];

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
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          handleSuccess(decodedText);
        },
        (errorMessage) => {
          // ignore common scan frame misses
        }
      );
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera failed to start:', err);
      setCameraError('Camera access not available or blocked in this browser. Use simulated scan below.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-[#30AFFF] to-[#92EEFF] text-slate-950">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-slate-950" />
            <h3 className="font-black text-base tracking-tight">
              {title || (mode === 'TEAM' ? 'Team QR Verification Scanner' : 'Participant Attendance Scanner')}
            </h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-black/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Camera Viewport */}
          <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-slate-900 border-2 border-dashed border-[#30AFFF] flex items-center justify-center shadow-inner">
            <div id="reader-container" className="w-full h-full"></div>
            
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-900 text-white space-y-2">
                <Camera className="w-8 h-8 text-slate-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-300">
                  {cameraError ? 'Camera Unavailable' : 'Initializing Optical Lens...'}
                </span>
                {cameraError && (
                  <p className="text-[11px] text-slate-400">
                    Use the 1-click test barcodes below to simulate QR scanning
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 1-Click Simulated QR Presets */}
          <div className="bg-[#D8FFC5]/30 border border-[#C4F7CA] p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                Simulate QR Scan (1-Click Test):
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-[#C4F7CA] px-2 py-0.5 rounded-full">
                Instant Mock
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {SAMPLE_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuccess(p.data)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-emerald-50 border border-emerald-200 text-slate-800 transition-all text-left shadow-2xs hover:scale-101"
                >
                  <span>{p.label}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </button>
              ))}
            </div>
          </div>

          {/* Manual String Input */}
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Or Paste Scanned Raw QR Data / Roll Number:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder={mode === 'TEAM' ? 'Enter Team Name (e.g. CyberKnights)' : 'Enter Roll No or JSON QR'}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#30AFFF]"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-[#30AFFF] text-white rounded-xl hover:bg-[#2090e0] shadow-xs cursor-pointer"
              >
                Scan
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
}

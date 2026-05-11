'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { processCheckin } from '../actions/registrations';
import { useToast } from '@/features/core/components/ToastContext';
import { Loader2, Camera, CameraOff, RefreshCw, CheckCircle2, XCircle, Gift } from 'lucide-react';
import type { CheckinResult } from '../types';

interface QrScannerProps {
  onCheckinSuccess?: () => void;
}

type ScanState = 'idle' | 'scanning' | 'processing' | 'success' | 'duplicate' | 'error';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function QrScanner({ onCheckinSuccess }: QrScannerProps) {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);
  const isStoppingRef = useRef(false);
  const processingRef = useRef(false);
  const lastScannedRef = useRef<string | null>(null);
  const { toast } = useToast();

  // Safe stop — awaits promise before resolving
  const safeStop = useCallback(async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
    } catch { /* ignore */ } finally {
      isStoppingRef.current = false;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    scannerRef.current = new Html5Qrcode('qr-reader');
    return () => {
      isMountedRef.current = false;
      // Await stop before destroying — prevents camera hardware lock
      safeStop();
    };
  }, [safeStop]);

  const startScanning = async () => {
    if (!scannerRef.current || isStoppingRef.current) return;
    setCameraError(null);
    setResult(null);
    setScanState('scanning');

    try {
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (processingRef.current || decodedText === lastScannedRef.current) return;
          processingRef.current = true;
          lastScannedRef.current = decodedText;
          if (isMountedRef.current) setScanState('processing');

          try {
            const res = await processCheckin(decodedText);
            if (!isMountedRef.current) return;

            setResult(res);

            if (res.success) {
              setScanState('success');
              navigator.vibrate?.([200, 100, 200]);
              onCheckinSuccess?.();
            } else if (res.alreadyCheckedIn) {
              setScanState('duplicate');
              navigator.vibrate?.([500]);
            } else {
              setScanState('error');
              toast('error', res.error || 'QR Code inválido.');
            }
          } catch {
            if (isMountedRef.current) {
              setScanState('error');
              toast('error', 'Erro ao validar QR Code.');
            }
          }

          // Resume scanning after 4s
          setTimeout(() => {
            if (!isMountedRef.current) return;
            processingRef.current = false;
            lastScannedRef.current = null;
            setScanState('scanning');
            setResult(null);
          }, 4000);
        },
        () => { /* ignore scan-not-found */ }
      );
    } catch {
      if (isMountedRef.current) {
        setCameraError('Não foi possível acessar a câmera. Verifique as permissões.');
        setScanState('idle');
      }
    }
  };

  const stopScanning = async () => {
    await safeStop();
    if (isMountedRef.current) {
      setScanState('idle');
      setResult(null);
    }
  };

  const isScanning = scanState === 'scanning' || scanState === 'processing';

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-900 border-2 border-white/5 shadow-2xl mb-6">
        {/* Processing overlay */}
        {scanState === 'processing' && (
          <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-xs font-bold text-white tracking-widest uppercase">Validando...</p>
          </div>
        )}

        {/* Success overlay */}
        {scanState === 'success' && result?.registrant && (
          <div className="absolute inset-0 z-30 bg-emerald-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-3" />
            <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-2">Check-in Confirmado!</p>
            <p className="text-white text-xl font-black text-center">{result.registrant.name}</p>
            {result.registrant.email && <p className="text-emerald-400 text-sm mt-1">{result.registrant.email}</p>}
            <div className="mt-3 flex items-center gap-2">
              {result.registrant.is_gift && (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-1 rounded-full">
                  <Gift className="w-3 h-3" /> Presente
                </span>
              )}
              <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-1 rounded-full capitalize">
                {result.registrant.payment_status}
              </span>
            </div>
          </div>
        )}

        {/* Duplicate check-in overlay */}
        {scanState === 'duplicate' && result && (
          <div className="absolute inset-0 z-30 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in">
            <XCircle className="w-14 h-14 text-red-400 mb-3" />
            <p className="text-red-300 text-xs font-bold uppercase tracking-widest mb-2">Acesso Negado</p>
            <p className="text-white text-lg font-black text-center mb-1">Ingresso Já Utilizado</p>
            {result.registrant && <p className="text-red-300 text-sm">{result.registrant.name}</p>}
            {result.firstCheckinAt && (
              <p className="text-red-400 text-xs mt-2 text-center">
                Lido em {formatDateTime(result.firstCheckinAt)}
                {result.firstCheckinBy && <><br />por <strong>{result.firstCheckinBy}</strong></>}
              </p>
            )}
          </div>
        )}

        {/* Idle state */}
        {scanState === 'idle' && !cameraError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
              <Camera className="w-10 h-10 text-blue-500" />
            </div>
            <p className="text-slate-400 text-sm font-medium">Câmera desligada</p>
          </div>
        )}

        {/* Camera error */}
        {cameraError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center bg-red-950/20">
            <CameraOff className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-red-400 text-sm font-bold">{cameraError}</p>
          </div>
        )}

        {/* Video element */}
        <div id="qr-reader" className="w-full h-full" />

        {/* Scanning guide */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-blue-500/50 rounded-3xl">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-3"
          >
            <Camera className="w-5 h-5" /> Ativar Câmera
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3"
          >
            <CameraOff className="w-5 h-5" /> Desligar Câmera
          </button>
        )}
        {cameraError && (
          <button
            onClick={startScanning}
            className="w-full bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3 h-3" /> Tentar novamente
          </button>
        )}
      </div>

      <style>{`
        #qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #qr-reader img { display: none !important; }
      `}</style>
    </div>
  );
}

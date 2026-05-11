'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { processCheckin } from '../actions/registrations';
import { useToast } from '@/features/core/components/ToastContext';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';

interface QrScannerProps {
  onCheckinSuccess?: () => void;
}

export function QrScanner({ onCheckinSuccess }: QrScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const lastScannedRef = useRef<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    return () => {
      // Cleanup Seguro para evitar Hardware Lock
      const stopScannerSafely = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
          try {
            await scannerRef.current.stop();
          } catch (e) {
            console.error("Erro na desmontagem da câmera:", e);
          }
        }
      };
      stopScannerSafely();
    };
  }, []);

  const startScanning = async () => {
    if (!scannerRef.current) return;
    setError(null);

    try {
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          if (processingRef.current || decodedText === lastScannedRef.current) return;

          processingRef.current = true;
          setIsProcessing(true);
          lastScannedRef.current = decodedText;

          try {
            const res = await processCheckin(decodedText);
            if (res.error) {
              if (navigator.vibrate) navigator.vibrate([500]); // Erro forte
              toast('error', res.error);
            } else {
              if (navigator.vibrate) navigator.vibrate([200, 100, 200]); // Sucesso feliz
              toast('success', 'Check-in realizado!');
              onCheckinSuccess?.();
            }
          } catch (err) {
            if (navigator.vibrate) navigator.vibrate([500]);
            toast('error', 'Erro ao validar QR Code.');
          } finally {
            setTimeout(() => {
              processingRef.current = false;
              setIsProcessing(false);
              lastScannedRef.current = null;
            }, 3000); // Cooldown para não disparar novamente o mesmo qr seguidamente
          }
        },
        (errorMessage) => {
          // Ignora erros normais de "QR não encontrado no frame"
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error("Erro ao iniciar câmera:", err);
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (e) {
        console.error("Erro ao desligar", e);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-900 border-2 border-white/5 shadow-2xl mb-6">
        {/* Camada de Processamento */}
        {isProcessing && (
          <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-xs font-bold text-white tracking-widest uppercase">Validando...</p>
          </div>
        )}

        {/* Placeholder / Erro */}
        {!isScanning && !error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
              <Camera className="w-10 h-10 text-blue-500" />
            </div>
            <p className="text-slate-400 text-sm font-medium">A câmera está desligada</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center bg-red-950/20">
            <CameraOff className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-red-400 text-sm font-bold">{error}</p>
          </div>
        )}

        {/* O Vídeo propriamente dito */}
        <div id="reader" className="w-full h-full" />

        {/* Overlay de Guia */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-blue-500/50 rounded-3xl">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />
            </div>
            <div className="absolute inset-0 bg-slate-950/40" style={{ clipPath: 'polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%, 50% 0%, 50% 50%, 50% 50%, 50% 50%, 50% 50%)' }} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-3"
          >
            <Camera className="w-5 h-5" />
            Ativar Câmera
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3"
          >
            <CameraOff className="w-5 h-5" />
            Desligar Câmera
          </button>
        )}

        {error && (
          <button
            onClick={startScanning}
            className="w-full bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3 h-3" />
            Tentar novamente
          </button>
        )}
      </div>

      <style>{`
        #reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
      `}</style>
    </div>
  );
}
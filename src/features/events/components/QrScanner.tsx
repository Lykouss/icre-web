'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { processCheckin } from '../actions/registrations';
import { useToast } from '@/features/core/components/ToastContext';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';

interface QrScannerProps {
  eventId: string;
  onCheckinSuccess?: () => void;
}

export function QrScanner({ eventId, onCheckinSuccess }: QrScannerProps) {
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
            const res = await processCheckin(eventId, decodedText);
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
      <div className="relative aspect-square rounded-[2rem] overflow-hidden border shadow-2xl mb-6 transition-all duration-500"
        style={{ 
          background: 'var(--admin-surface)', 
          borderColor: isScanning ? 'rgba(59, 130, 246, 0.4)' : 'var(--admin-border)',
          boxShadow: isScanning ? '0 0 40px -10px rgba(59, 130, 246, 0.3)' : '0 10px 30px -10px rgba(0,0,0,0.5)'
        }}>
        {/* Camada de Processamento */}
        {isProcessing && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center animate-in fade-in backdrop-blur-xl" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-6" />
            <p className="text-xs font-bold text-white tracking-widest uppercase bg-blue-500/20 px-4 py-1.5 rounded-full border border-blue-500/30">Validando Ingresso</p>
          </div>
        )}

        {/* Placeholder / Erro */}
        {!isScanning && !error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-center" style={{ background: 'var(--admin-surface-alt)' }}>
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 border animate-pulse" style={{ background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
              <Camera className="w-10 h-10" style={{ color: '#60a5fa' }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--admin-text-secondary)' }}>Câmera Desligada</p>
            <p className="text-xs mt-2 max-w-[200px]" style={{ color: 'var(--admin-text-muted)' }}>Ative a câmera para escanear os ingressos dos membros.</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-red-500/10 border border-red-500/20">
              <CameraOff className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-sm font-bold text-red-400 max-w-[250px] leading-relaxed">{error}</p>
          </div>
        )}

        {/* O Vídeo propriamente dito */}
        <div id="reader" className="w-full h-full" />

        {/* Overlay de Guia */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[65%] h-[65%] border-2 rounded-3xl transition-all duration-700 shadow-[0_0_20px_rgba(59,130,246,0.3)_inset]" style={{ borderColor: 'rgba(59, 130, 246, 0.4)' }}>
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-xl animate-pulse" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-xl animate-pulse" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-xl animate-pulse" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-xl animate-pulse" />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-scan" />
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', clipPath: 'polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%, 50% 0%, 50% 50%, 50% 50%, 50% 50%, 50% 50%)' }} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 px-2">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="w-full text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95"
            style={{ background: 'var(--admin-accent)' }}
          >
            <Camera className="w-5 h-5" />
            Ativar Câmera Scanner
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="w-full text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 border hover:bg-white/5 active:scale-95"
            style={{ background: 'var(--admin-surface-alt)', borderColor: 'var(--admin-border)' }}
          >
            <CameraOff className="w-5 h-5" />
            Desligar Câmera
          </button>
        )}

        {error && (
          <button
            onClick={startScanning}
            className="w-full hover:bg-white/5 text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border"
            style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-text-secondary)' }}
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
        @keyframes scan {
          0% { top: 17.5%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 82.5%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
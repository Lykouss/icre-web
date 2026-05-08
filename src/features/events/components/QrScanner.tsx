'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { processCheckin } from '../actions/registrations';
import { useToast } from '@/features/core/components/ToastContext';
import { Loader2 } from 'lucide-react';

interface QrScannerProps {
  onCheckinSuccess?: () => void;
}

export function QrScanner({ onCheckinSuccess }: QrScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);
  const lastScannedRef = useRef<string | null>(null);
  const { toast } = useToast();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Inicialização do scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 }, 
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true
      },
      /* verbose= */ false
    );

    async function onScanSuccess(decodedText: string) {
      if (processingRef.current || decodedText === lastScannedRef.current) return;
      
      processingRef.current = true;
      setIsProcessing(true);
      lastScannedRef.current = decodedText;

      try {
        const res = await processCheckin(decodedText);
        if (res.error) {
          toast('error', res.error);
        } else {
          toast('success', 'Check-in realizado com sucesso!');
          onCheckinSuccess?.();
          // Feedback tátil/sonoro (opcional no futuro)
        }
      } catch (err) {
        toast('error', 'Falha ao processar QR Code.');
      } finally {
        // Aguarda 3 segundos antes de permitir scan do próximo QR Code
        setTimeout(() => {
          processingRef.current = false;
          setIsProcessing(false);
          lastScannedRef.current = null;
        }, 3000);
      }
    }

    scanner.render(onScanSuccess, (error) => {
      // Erros de "QR não encontrado" são comuns durante o scan, ignoramos.
    });

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Erro ao limpar scanner:", err));
      }
    };
  }, [toast, onCheckinSuccess]);

  return (
    <div className="w-full max-w-md mx-auto relative rounded-3xl overflow-hidden bg-slate-900 shadow-2xl border border-white/10">
      {isProcessing && (
        <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
            <Loader2 className="w-6 h-6 text-blue-500 absolute top-5 left-5 animate-pulse" />
          </div>
          <p className="text-sm font-bold text-white tracking-wide">Validando ingresso...</p>
        </div>
      )}
      <div id="reader" className="w-full" />
      <style>{`
        #reader { border: none !important; background: #0f172a !important; }
        #reader__dashboard_section_csr span { display: none !important; }
        #reader__dashboard_section_csr button {
          background-color: #2563eb; 
          color: white; 
          padding: 12px 24px; 
          border-radius: 14px; 
          font-weight: 700; 
          font-size: 14px;
          border: none;
          margin: 20px auto;
          display: block;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
        #reader__dashboard_section_csr button:hover { background-color: #1d4ed8; transform: translateY(-1px); }
        #reader__dashboard_section_swaplink { display: none !important; }
        #reader video { border-radius: 24px; object-fit: cover !important; }
        #reader__camera_selection {
            background: #1e293b;
            color: white;
            border: 1px border-white/10;
            padding: 8px;
            border-radius: 10px;
            margin-bottom: 10px;
            font-size: 12px;
        }
      `}</style>
    </div>
  );
}

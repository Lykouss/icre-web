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
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const { toast } = useToast();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Evita múltiplas inicializações no StrictMode
    if (scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] },
      false
    );

    scannerRef.current = scanner;

    scanner.render(async (decodedText) => {
      if (isProcessing || decodedText === lastScanned) return;
      
      setLastScanned(decodedText);
      setIsProcessing(true);

      try {
        const res = await processCheckin(decodedText);
        if (res.error) {
          toast('error', res.error);
        } else {
          toast('success', 'Check-in realizado com sucesso!');
          onCheckinSuccess?.();
          // Pausa por alguns segundos antes de liberar para o próximo (para não bipar várias vezes o mesmo)
          setTimeout(() => setLastScanned(null), 5000);
        }
      } catch (err) {
        toast('error', 'Falha ao processar QR Code.');
      } finally {
        setIsProcessing(false);
      }
    }, (error) => {
      // Ignora erros de "not found" em cada frame
    });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isProcessing, lastScanned, toast, onCheckinSuccess]);

  return (
    <div className="w-full max-w-md mx-auto relative rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
      {isProcessing && (
        <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-2" />
          <p className="text-sm font-semibold text-slate-700">Validando ingresso...</p>
        </div>
      )}
      <div id="reader" className="w-full rounded-2xl border-none" />
      <style>{`
        #reader { border: none !important; }
        #reader__dashboard_section_csr span { display: none !important; }
        #reader__dashboard_section_csr button {
          background-color: #2563eb; color: white; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 14px;
        }
        #reader__dashboard_section_swaplink { display: none !important; }
        #reader video { border-radius: 16px; }
      `}</style>
    </div>
  );
}

'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { X, Download, FileText, ImageIcon, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { getAttachmentSignedUrl } from '@/features/support/actions/attachment-actions';

// ─── Types ─────────────────────────────────────────────────────────────────────

type FileType = 'image' | 'pdf' | 'other';

interface AttachmentFile {
  path: string;        // storage path, e.g. "user-id/ticket-id/filename.png"
  name: string;        // display name
  type: FileType;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function parseAttachmentPath(rawPath: string): AttachmentFile {
  const name = rawPath.split('/').pop() ?? rawPath;
  const ext  = name.split('.').pop()?.toLowerCase() ?? '';
  const type: FileType =
    ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) ? 'image' :
    ext === 'pdf' ? 'pdf' : 'other';
  return { path: rawPath, name, type };
}

// ─── Inline Attachment Button ─────────────────────────────────────────────────

interface AttachmentButtonProps {
  rawPath: string;
}

export function AttachmentButton({ rawPath }: AttachmentButtonProps) {
  const [open, setOpen] = useState(false);
  const file = parseAttachmentPath(rawPath);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-[11px] opacity-75 hover:opacity-100 transition-opacity rounded px-1.5 py-0.5 hover:bg-white/10"
      >
        {file.type === 'image' ? (
          <ImageIcon className="w-3 h-3 shrink-0" />
        ) : file.type === 'pdf' ? (
          <FileText className="w-3 h-3 shrink-0" />
        ) : (
          <FileText className="w-3 h-3 shrink-0" />
        )}
        <span className="truncate max-w-[180px]">{file.name}</span>
      </button>
      {open && <AttachmentViewer file={file} onClose={() => setOpen(false)} />}
    </>
  );
}

// ─── Attachment Viewer Modal ───────────────────────────────────────────────────

interface AttachmentViewerProps {
  file: AttachmentFile;
  onClose: () => void;
}

function AttachmentViewer({ file, onClose }: AttachmentViewerProps) {
  const [signedUrl, setSignedUrl]   = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // Fetch signed URL on mount
  useEffect(() => {
    setLoading(true);
    setError(null);
    getAttachmentSignedUrl(file.path).then(result => {
      if (result.error || !result.data) {
        setError(result.error ?? 'Erro ao carregar o arquivo.');
      } else {
        setSignedUrl(result.data.signedUrl);
      }
      setLoading(false);
    });
  }, [file.path]);

  // ESC to close
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(13,21,38,0.98)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          maxWidth: 'min(90vw, 900px)',
          maxHeight: '88vh',
          width: '100%',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {file.type === 'image' ? (
              <ImageIcon className="w-4 h-4 text-blue-400 shrink-0" />
            ) : (
              <FileText className="w-4 h-4 text-orange-400 shrink-0" />
            )}
            <span className="text-sm font-medium text-slate-200 truncate">{file.name}</span>
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            {signedUrl && (
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-blue-500/20"
                style={{ color: '#93c5fd', border: '1px solid rgba(147,197,253,0.2)' }}
                title={file.type === 'pdf' ? 'Abrir PDF' : 'Abrir em nova aba'}
              >
                {file.type === 'pdf' ? (
                  <><ExternalLink className="w-3.5 h-3.5" /> Abrir PDF</>
                ) : (
                  <><Download className="w-3.5 h-3.5" /> Download</>
                )}
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4" style={{ minHeight: '300px' }}>
          {loading && (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm">Carregando arquivo…</span>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center gap-3 text-red-400">
              <AlertTriangle className="w-8 h-8" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {!loading && !error && signedUrl && file.type === 'image' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={signedUrl}
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
            />
          )}

          {!loading && !error && signedUrl && file.type === 'pdf' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(251,146,60,0.15)', border: '2px solid rgba(251,146,60,0.3)' }}
              >
                <FileText className="w-10 h-10 text-orange-400" />
              </div>
              <div>
                <p className="text-slate-200 font-semibold text-base">{file.name}</p>
                <p className="text-slate-500 text-sm mt-1">Clique no botão acima para abrir o PDF</p>
              </div>
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:brightness-110"
                style={{ background: 'rgba(251,146,60,0.2)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.3)' }}
              >
                <ExternalLink className="w-4 h-4" />
                Abrir PDF em nova aba
              </a>
            </div>
          )}

          {!loading && !error && signedUrl && file.type === 'other' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <FileText className="w-16 h-16 text-slate-500" />
              <p className="text-slate-400 text-sm">{file.name}</p>
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: 'rgba(37,99,235,0.2)', color: '#93c5fd', border: '1px solid rgba(37,99,235,0.3)' }}
              >
                <Download className="w-4 h-4" />
                Baixar arquivo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

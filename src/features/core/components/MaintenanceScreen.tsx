"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface MaintenanceScreenProps {
  featureName?: string;
}

export function MaintenanceScreen({ featureName = 'Este recurso' }: MaintenanceScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="max-w-md w-full shadow-2xl rounded-2xl p-10 md:p-14 text-center relative overflow-hidden"
        style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />
        
        <div className="relative">
          <div className="w-20 h-20 bg-blue-500/10 rounded-2xl mx-auto flex items-center justify-center mb-6 ring-1 ring-blue-500/20">
            <motion.svg 
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="w-10 h-10 text-blue-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </motion.svg>
          </div>

          <h2 className="text-2xl font-bold text-slate-100 mb-3 tracking-tight">
            Em Manutenção
          </h2>
          
          <p className="text-slate-400 mb-8 leading-relaxed text-sm">
            Estamos polindo o módulo <strong>{featureName}</strong> para garantir a melhor experiência possível. 
            Em breve tudo estará de volta ao normal!
          </p>

          <a 
            href="/dashboard"
            className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            Voltar ao Início
          </a>
        </div>
      </motion.div>
    </div>
  );
}

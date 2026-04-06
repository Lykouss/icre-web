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
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="max-w-md w-full bg-white dark:bg-slate-900 shadow-2xl shadow-blue-500/10 rounded-[2.5rem] p-10 md:p-14 text-center relative overflow-hidden ring-1 ring-slate-200 dark:ring-white/10"
      >
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
        
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-500/10 dark:to-amber-500/5 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-inner ring-1 ring-amber-200/50 dark:ring-amber-500/20">
            <motion.svg 
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-12 h-12 text-amber-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </motion.svg>
          </div>

          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
            {featureName} em Manutenção
          </h2>
          
          <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed text-lg">
            Estamos polindo este módulo para garantir a melhor experiência possível. 
            Em breve tudo estará de volta ao normal!
          </p>

          <a 
            href="/dashboard"
            className="group relative inline-flex items-center justify-center px-10 py-4 font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-blue-500/20 transition-all duration-300 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative flex items-center gap-2">
              <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar ao Início
            </span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}


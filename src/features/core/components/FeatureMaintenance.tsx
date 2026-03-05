import React from 'react';

interface FeatureMaintenanceProps {
  featureName: string;
}

export function FeatureMaintenance({ featureName }: FeatureMaintenanceProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-amber-100 p-6 mb-6">
        {/* Ícone simples de alerta usando SVG */}
        <svg className="w-12 h-12 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        {featureName} em Manutenção
      </h2>
      <p className="text-slate-500 max-w-md">
        Estamos trabalhando nos bastidores para melhorar esta área. 
        Em breve ela estará disponível novamente.
      </p>
    </div>
  );
}
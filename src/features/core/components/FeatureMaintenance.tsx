import React from 'react';

interface FeatureMaintenanceProps {
  featureName: string;
}

export function FeatureMaintenance({ featureName }: FeatureMaintenanceProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full p-6 mb-6" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
        {/* Ícone simples de alerta usando SVG */}
        <svg className="w-12 h-12" style={{ color: '#fbbf24' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--admin-text-primary)' }}>
        {featureName} em Manutenção
      </h2>
      <p className="max-w-md" style={{ color: 'var(--admin-text-secondary)' }}>
        Estamos trabalhando nos bastidores para melhorar esta área. 
        Em breve ela estará disponível novamente.
      </p>
    </div>
  );
}
'use client'

import React, { useTransition, useState } from 'react';
import { toggleFeatureFlag } from '@/features/core/actions/toggle-flag';

interface FlagTogglerProps {
  slug: string;
  name: string;
  description: string;
  initialStatus: boolean;
}

export function FlagToggler({ slug, name, description, initialStatus }: FlagTogglerProps) {
  const [isPending, startTransition] = useTransition();
  // Estado local para a interface mudar na velocidade da luz
  const [isToggled, setIsToggled] = useState(initialStatus);

  const handleToggle = () => {
    // 1. Muda o visual instantaneamente (Optimistic UI)
    const newStatus = !isToggled;
    setIsToggled(newStatus);

    // 2. Manda a ordem para o servidor em segundo plano
    startTransition(async () => {
      const result = await toggleFeatureFlag(slug, newStatus);
      
      if (result.error) {
        // Se der erro no banco, reverte o botão e avisa
        setIsToggled(!newStatus);
        alert(result.error);
      }
    });
  };

  return (
    // ... (O resto do visual continua igual, mas lembre-se de trocar `initialStatus` por `isToggled` nas validações de cor lá embaixo!)
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 transition-colors hover:border-blue-300">
      <div className="flex-1">
        <h3 className="font-bold text-slate-800 text-lg">{name}</h3>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
        <div className="mt-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isToggled ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
          }`}>
            {isToggled ? 'Ativado para todos' : 'Desativado (Modo Manutenção)'}
          </span>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={isToggled}
        disabled={isPending}
        onClick={handleToggle}
        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
          isToggled ? 'bg-blue-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            isToggled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
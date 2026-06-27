import React from 'react';
import type { AppRole } from '@/features/core/api/get-current-user';

export const ROLE_BADGE_CONFIG: Record<AppRole, { label: string; color: string; desc: string; icon: React.ReactNode }> = {
  SYSADMIN: {
    label: 'Administrador do Sistema',
    color: '#f59e0b',
    desc: 'Autoridade máxima. Acesso irrestrito a configurações sensíveis e infraestrutura.',
    icon: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  CHURCH_ADMIN: {
    label: 'Administrador da Igreja',
    color: '#3b82f6',
    desc: 'Gestão geral da igreja, exceto configurações do sistema e relatórios críticos.',
    icon: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 4v16m-4-10h8m-4-6a9 9 0 100 18 9 9 0 000-18z" />
      </svg>
    ),
  },
  FINANCE_ADMIN: {
    label: 'Administrador Financeiro',
    color: '#10b981',
    desc: 'Controle total sobre receitas, despesas, doações e relatórios financeiros.',
    icon: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M13 17l2.5-2.5m0 0L13 12m2.5 2.5H8" />
      </svg>
    ),
  },
  LEADER: {
    label: 'Líder',
    color: '#8b5cf6',
    desc: 'Liderança de pequenos grupos e células. Gestão de encontros e membros associados.',
    icon: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  MEMBER: {
    label: 'Membro',
    color: '#64748b',
    desc: 'Membro comum. Acesso básico ao portal público.',
    icon: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  SUPPORT_ADMIN: {
    label: 'Atendente de Suporte',
    color: '#0ea5e9',
    desc: 'Gestão de tickets, mensagens em tempo real e feedbacks dos membros.',
    icon: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 14v1m0-5V8" />
      </svg>
    ),
  },
  EVENT_ADMIN: {
    label: 'Coordenador de Eventos',
    color: '#f97316',
    desc: 'Criação e gestão de eventos, ingressos, presenças e listas.',
    icon: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 11l.7 2.15H15l-1.85 1.35.7 2.15-1.85-1.35-1.85 1.35.7-2.15L9 13.15h2.3L12 11z" />
      </svg>
    ),
  },
  MEDIA_ADMIN: {
    label: 'Gerente de Conteúdo',
    color: '#ec4899',
    desc: 'Administração de arquivos de mídia, banners e blocos do site público.',
    icon: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
  },
  MEMBER_ADMIN: {
    label: 'Gestor de Membros',
    color: '#14b8a6',
    desc: 'Cadastros, edição de perfis, acompanhamento pastoral e trilha espiritual.',
    icon: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 4v4m-2-2h4" />
      </svg>
    ),
  },
  REPORT_VIEWER: {
    label: 'Analista (Leitura)',
    color: '#94a3b8',
    desc: 'Visualização de relatórios financeiros, estatísticas de eventos e membros.',
    icon: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M10 5l4 4 4-4" />
      </svg>
    ),
  },
};

interface RoleBadgeProps {
  role: AppRole;
  variant?: 'icon' | 'chip' | 'card';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RoleBadge({ role, variant = 'chip', size = 'md', className = '' }: RoleBadgeProps) {
  const config = ROLE_BADGE_CONFIG[role] || ROLE_BADGE_CONFIG.MEMBER;
  const isDark = typeof window !== 'undefined' ? document.documentElement.classList.contains('dark') : true;

  // Tamanhos
  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };
  
  const textSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  const bgOpacity = variant === 'card' ? '0.1' : '0.15';
  
  const style = {
    backgroundColor: `${config.color}${Math.round(parseFloat(bgOpacity) * 255).toString(16).padStart(2, '0')}`,
    color: config.color,
    borderColor: `${config.color}30`,
  };

  if (variant === 'icon') {
    return (
      <div 
        className={`flex items-center justify-center shrink-0 ${iconSizes[size]} ${className}`}
        style={{ color: config.color }}
        title={config.label}
      >
        {config.icon}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div 
        className={`flex items-start gap-4 rounded-xl p-4 border transition-colors ${className}`}
        style={style}
      >
        <div className={`shrink-0 ${iconSizes.lg} mt-0.5`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-[13px] mb-1 leading-tight">{config.label}</h4>
          <p className="text-[11px] leading-relaxed opacity-80">{config.desc}</p>
        </div>
      </div>
    );
  }

  // variant === 'chip'
  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold ${textSizes[size]} ${className}`}
      style={style}
      title={config.desc}
    >
      <div className={`shrink-0 ${iconSizes[size]}`}>
        {config.icon}
      </div>
      <span className="truncate leading-none">{config.label}</span>
    </div>
  );
}

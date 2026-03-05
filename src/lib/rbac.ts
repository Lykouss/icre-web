// Usando EXATAMENTE as opções do seu ENUM no Supabase
export type SystemRole = 'SYSADMIN' | 'CHURCH_ADMIN' | 'FINANCE_ADMIN' | 'LEADER' | 'MEMBER';

// 1. Quem pode editar os dados (Geral, Espiritual, Ministérios)
export function canEditProfile(currentUserRole: SystemRole | string, targetUserRole: SystemRole | string, isSelf: boolean): boolean {
  if (isSelf) return true; // Sempre edita a si mesmo
  if (currentUserRole === 'SYSADMIN') return true; // Dono edita todos
  if (currentUserRole === 'CHURCH_ADMIN' && targetUserRole !== 'SYSADMIN') return true; // Pastor/Secretaria edita todos, menos o Dono
  return false; // FINANCE_ADMIN, LEADER e MEMBER só olham!
}

// 2. Quem pode ver e editar as Anotações Confidenciais e Logs
export function canManageConfidentialNotes(currentUserRole: SystemRole | string): boolean {
  return ['SYSADMIN', 'CHURCH_ADMIN'].includes(currentUserRole);
}
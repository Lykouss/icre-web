export type SystemRole = 'SYSADMIN' | 'CHURCH_ADMIN' | 'FINANCE_ADMIN' | 'LEADER' | 'MEMBER';

export function canEditProfile(
  currentUserRole: SystemRole | string,
  targetUserRole: SystemRole | string,
  isSelf: boolean
): boolean {
  if (isSelf) return true;
  if (currentUserRole === 'SYSADMIN') return true;
  if (currentUserRole === 'CHURCH_ADMIN' && targetUserRole !== 'SYSADMIN') return true;
  return false;
}

export function canManageConfidentialNotes(roles: SystemRole | string | (SystemRole | string)[]): boolean {
  const list = Array.isArray(roles) ? roles : [roles];
  return list.some(r => ['SYSADMIN', 'CHURCH_ADMIN'].includes(r));
}
import { AppRole } from '@/features/core/api/get-current-user';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

const ALLOWED_MEMBER_STATUSES = ['Membro', 'Visitante', 'Inativo', 'Afastado'] as const;
type MemberStatus = (typeof ALLOWED_MEMBER_STATUSES)[number];

export function isValidMemberStatus(value: string): value is MemberStatus {
  return (ALLOWED_MEMBER_STATUSES as readonly string[]).includes(value);
}

const ALLOWED_GENDERS = ['Masculino', 'Feminino'] as const;

export function isValidGender(value: string): boolean {
  return (ALLOWED_GENDERS as readonly string[]).includes(value);
}

const ALLOWED_MARITAL_STATUSES = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)'] as const;

export function isValidMaritalStatus(value: string): boolean {
  return (ALLOWED_MARITAL_STATUSES as readonly string[]).includes(value);
}

export function isValidPhone(value: string): boolean {
  // Aceita formatos brasileiros: (11) 99999-9999 ou apenas dígitos
  return /^[\d\s\(\)\-\+]{8,20}$/.test(value);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidDate(value: string): boolean {
  if (!value) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

// Roles que podem escrever dados de membros
const MEMBER_WRITE_ROLES: AppRole[] = ['SYSADMIN', 'CHURCH_ADMIN'];

export function canWriteMembers(roles: AppRole[]): boolean {
  return roles.some(r => MEMBER_WRITE_ROLES.includes(r));
}

// Roles que podem criar membros
const MEMBER_CREATE_ROLES: AppRole[] = ['SYSADMIN', 'CHURCH_ADMIN', 'LEADER'];

export function canCreateMembers(roles: AppRole[]): boolean {
  return roles.some(r => MEMBER_CREATE_ROLES.includes(r));
}
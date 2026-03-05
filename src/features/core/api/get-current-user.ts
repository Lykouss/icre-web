import { createClient } from '@/lib/supabase/server';

// Definimos os cargos possíveis exatamente como no banco de dados
export type AppRole = 'MEMBER' | 'LEADER' | 'FINANCE_ADMIN' | 'CHURCH_ADMIN' | 'SYSADMIN';

export async function getCurrentUser() {
  const supabase = await createClient();
  
  // 1. Quem é o usuário logado no sistema de Auth?
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) return null;

  // 2. Busca o perfil e os cargos dele nas nossas tabelas personalizadas
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      user_roles (
        role
      )
    `)
    .eq('id', user.id)
    .single();

 if (profileError || !profile) {
    console.error('Perfil não encontrado para o usuário:', user.id);
    return null;
  }

  // Tipagem estrita: dizemos exatamente o formato que esperamos do Supabase
  type UserRoleRecord = { role: string };

  // Nada de "any" aqui!
  const roles = (profile.user_roles as UserRoleRecord[]).map((r) => r.role as AppRole);

  return {
    id: profile.id,
    fullName: profile.full_name,
    roles,
    // Facilita a checagem rápida:
    isAdmin: roles.some(role => ['LEADER', 'FINANCE_ADMIN', 'CHURCH_ADMIN', 'SYSADMIN'].includes(role)),
    isSysAdmin: roles.includes('SYSADMIN')
  };
}
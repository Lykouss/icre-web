import { createClient } from '@/lib/supabase/server';
import { AppRole } from './get-current-user';

// Tipagem exata do usuário que vamos receber
interface UserContext {
  id: string;
  roles: AppRole[];
  isSysAdmin: boolean;
}

export async function getFeatureFlag(slug: string, user?: UserContext | null): Promise<boolean> {
  // O SYSADMIN (você) é um deus no sistema. Ele sempre vê tudo, mesmo módulos desligados!
  if (user?.isSysAdmin) return true;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('feature_flags')
    .select('is_active, allowed_roles, allowed_users')
    .eq('slug', slug)
    .single();

  if (error || !data) return false;

  // 1. Se a ferramenta já foi lançada oficialmente para todos (is_active = true)
  if (data.is_active) return true;

  // 2. Se a ferramenta está em testes, mas o usuário não está logado/passado na função, bloqueia.
  if (!user) return false;

  // 3. Verifica se o cargo do usuário está na lista VIP da ferramenta
  const hasRoleAccess = data.allowed_roles?.some((role: string) => 
    user.roles.includes(role as AppRole)
  );

  // 4. Verifica se o ID específico do usuário foi sorteado para testar
  const hasUserAccess = data.allowed_users?.includes(user.id);

  return Boolean(hasRoleAccess || hasUserAccess);
}

// Nova função utilitária para checar várias flags de uma vez (Perfeito para o Menu Lateral!)
export async function getSidebarFeatureFlags(user: UserContext) {
  const slugs = [
    'module_dashboard', 'module_finance', 'module_members', 'module_events', 
    'module_volunteers', 'module_kids', 'module_assets', 'module_portal', 'module_permissions'
  ];
  
  // Cria um objeto { 'module_finance': true, 'module_members': false, ... }
  const flags: Record<string, boolean> = {};
  
  // Promise.all roda todas as buscas no banco ao mesmo tempo (super rápido)
  await Promise.all(
    slugs.map(async (slug) => {
      flags[slug] = await getFeatureFlag(slug, user);
    })
  );
  
  return flags;
}
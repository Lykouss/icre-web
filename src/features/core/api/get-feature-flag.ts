import { createClient } from '@/lib/supabase/server';
import { AppRole } from './get-current-user';

interface UserContext {
  id: string;
  roles: AppRole[];
  isSysAdmin: boolean;
}

export async function getFeatureFlag(slug: string, user?: UserContext | null): Promise<boolean> {
  if (user?.isSysAdmin) return true;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('feature_flags')
    .select('is_active, allowed_roles, allowed_users')
    .eq('slug', slug)
    .single();

  if (error || !data) return false;
  if (data.is_active) return true;
  if (!user) return false;

  const hasRoleAccess = data.allowed_roles?.some((role: string) =>
    user.roles.includes(role as AppRole)
  );
  const hasUserAccess = data.allowed_users?.includes(user.id);

  return Boolean(hasRoleAccess || hasUserAccess);
}

export async function getSidebarFeatureFlags(user: UserContext) {
  // Slugs alinhados com os valores reais da tabela feature_flags
  const slugs = [
    'module_dashboard',
    'module_finance',
    'module_members',
    'module_events',
    'module_volunteers',
    'module_kids',
    'module_assets',
    'module_public_site',
    'module_permissions',
    'module_cells',
    'module_pastors',
  ];

  const flags: Record<string, boolean> = {};

  await Promise.all(
    slugs.map(async (slug) => {
      flags[slug] = await getFeatureFlag(slug, user);
    })
  );

  return flags;
}
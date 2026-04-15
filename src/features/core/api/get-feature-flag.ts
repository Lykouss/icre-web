import { createClient } from '@/lib/supabase/server';
import { AppRole } from './get-current-user';

interface UserContext {
  id: string;
  roles: AppRole[];
  isSysAdmin: boolean;
}

export interface FlagResult {
  slug: string;
  isActive: boolean;
  isAllowed: boolean;
  status: 'novo' | 'desenvolvimento' | 'manutencao' | 'inativo' | 'antecipado' | 'indisponivel' | 'movido' | 'normal' | null;
  maintenanceScheduledAt: string | null;
  isSysAdmin: boolean;
  /** For 'novo' status: true if the current user has already visited this module */
  userHasViewed: boolean;
}

const DEFAULT_MODULE_ROLES: Record<string, AppRole[]> = {
  'module_dashboard': ['SYSADMIN', 'CHURCH_ADMIN', 'FINANCE_ADMIN', 'LEADER'],
  'module_finance': ['SYSADMIN', 'CHURCH_ADMIN', 'FINANCE_ADMIN'],
  'module_members': ['SYSADMIN', 'CHURCH_ADMIN', 'LEADER'],
  'module_events': ['SYSADMIN', 'CHURCH_ADMIN'],
  'module_cells': ['SYSADMIN', 'CHURCH_ADMIN'],
  'module_pastors': ['SYSADMIN', 'CHURCH_ADMIN'],
  'module_leaders': ['SYSADMIN', 'CHURCH_ADMIN'],
  'module_public_site': ['SYSADMIN', 'CHURCH_ADMIN'],
  'module_permissions': ['SYSADMIN', 'CHURCH_ADMIN'],
  'module_kids': ['SYSADMIN', 'CHURCH_ADMIN'],
  'module_assets': ['SYSADMIN', 'CHURCH_ADMIN'],
  'module_volunteers': ['SYSADMIN', 'CHURCH_ADMIN'],
};

export async function getFeatureFlag(slug: string, user?: UserContext | null): Promise<FlagResult> {
  const defaultRoles = DEFAULT_MODULE_ROLES[slug] || [];
  const hasDefaultRole = Boolean(user && defaultRoles.some(r => user.roles.includes(r)));

  const defaultResult: FlagResult = {
    slug,
    isActive: true, // Fail-open for active status if DB is blocked
    isAllowed: Boolean(user?.isSysAdmin || hasDefaultRole),
    status: 'normal',
    maintenanceScheduledAt: null,
    isSysAdmin: Boolean(user?.isSysAdmin),
    userHasViewed: false,
  };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('feature_flags')
    .select('is_active, allowed_roles, allowed_users, status, maintenance_scheduled_at')
    .eq('slug', slug)
    .single();

  if (error || !data) return defaultResult;

  const dbRoles = data.allowed_roles?.length > 0 ? data.allowed_roles : defaultRoles;
  const hasRoleAccess = Boolean(
    user && dbRoles.some((role: string) => user.roles.includes(role as AppRole))
  );
  const hasUserAccess = Boolean(user && data.allowed_users?.includes(user.id));
  const isAllowed = user?.isSysAdmin || hasRoleAccess || hasUserAccess;

  let currentStatus = data.status || 'normal';

  // Proteção contra datas orfãs na DB: se a manutenção agendada já passou há mais de 24h e o status não é 'manutenção', ignoramos.
  if (data.maintenance_scheduled_at) {
    const scheduledAt = new Date(data.maintenance_scheduled_at);
    const now = new Date();
    const hoursSinceScheduled = (now.getTime() - scheduledAt.getTime()) / (1000 * 60 * 60);

    if (now >= scheduledAt && hoursSinceScheduled < 24) {
      currentStatus = 'manutencao';
    }
  }

  return {
    slug,
    isActive: data.is_active,
    isAllowed: isAllowed,
    status: currentStatus,
    maintenanceScheduledAt: data.maintenance_scheduled_at,
    isSysAdmin: Boolean(user?.isSysAdmin),
    userHasViewed: false, // populated in getSidebarFeatureFlags
  };
}

export async function getSidebarFeatureFlags(user: UserContext) {
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
    'module_leaders',
  ];

  const supabase = await createClient();

  // Fetch all flags and the user's viewed access records in parallel
  const [flagResults, viewedRes] = await Promise.all([
    Promise.all(slugs.map((slug) => getFeatureFlag(slug, user))),
    supabase
      .from('user_feature_access')
      .select('flag_slug')
      .eq('user_id', user.id),
  ]);

  const viewedSlugs = new Set((viewedRes.data ?? []).map((r: { flag_slug: string }) => r.flag_slug));

  const flags: Record<string, FlagResult> = {};
  flagResults.forEach((result) => {
    flags[result.slug] = {
      ...result,
      userHasViewed: viewedSlugs.has(result.slug),
    };
  });

  return flags;
}
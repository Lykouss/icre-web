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

export async function getFeatureFlag(slug: string, user?: UserContext | null): Promise<FlagResult> {
  const defaultResult: FlagResult = {
    slug,
    isActive: false,
    isAllowed: false,
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

  const hasRoleAccess = Boolean(
    user && data.allowed_roles?.some((role: string) => user.roles.includes(role as AppRole))
  );
  const hasUserAccess = Boolean(user && data.allowed_users?.includes(user.id));
  const isAllowed = user?.isSysAdmin || hasRoleAccess || hasUserAccess;

  return {
    slug,
    isActive: data.is_active,
    isAllowed: isAllowed,
    status: data.status || 'normal',
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
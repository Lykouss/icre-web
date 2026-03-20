'use server'

import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser }    from '@/features/core/api/get-current-user';

export interface TableStat {
  name:  string;
  label: string;
  count: number;
  icon:  string;
}

export interface BucketStat {
  name:       string;
  label:      string;
  fileCount:  number;
  usedBytes:  number;
  quotaBytes: number;
}

export interface ModuleStat {
  slug:      string;
  name:      string;
  is_active: boolean;
}

export interface RecentAuditLog {
  id:         string;
  action:     string;
  actor_name: string;
  actor_role: string;
  entity_name: string;
  created_at: string;
}

export interface DbHealthData {
  tables:     TableStat[];
  buckets:    BucketStat[];
  modules:    ModuleStat[];
  recentLogs: RecentAuditLog[];
  totalUsers: number;
  generatedAt: string;
}

const TABLE_META: { table: string; label: string; icon: string }[] = [
  { table: 'members',                label: 'Membros',         icon: 'users'    },
  { table: 'profiles',               label: 'Perfis (Auth)',   icon: 'profile'  },
  { table: 'events',                 label: 'Eventos',         icon: 'calendar' },
  { table: 'event_registrations',    label: 'Inscrições',      icon: 'ticket'   },
  { table: 'financial_transactions', label: 'Transações',      icon: 'money'    },
  { table: 'financial_closings',     label: 'Fechamentos',     icon: 'lock'     },
  { table: 'cells',                  label: 'Células',         icon: 'home'     },
  { table: 'audit_logs',             label: 'Logs de Auditoria', icon: 'log'   },
  { table: 'site_blocks',            label: 'Blocos do Site',  icon: 'layout'   },
  { table: 'site_media',             label: 'Mídias do Site',  icon: 'image'    },
  { table: 'pastors',                label: 'Pastores',        icon: 'pastor'   },
];

const BUCKET_META: { name: string; label: string; quotaMB: number }[] = [
  { name: 'avatars',       label: 'Avatares de membros', quotaMB: 500  },
  { name: 'site-images',   label: 'Mídias do site',      quotaMB: 200  },
  { name: 'pastor-photos', label: 'Fotos de pastores',   quotaMB: 100  },
];

export async function getDbHealth(): Promise<DbHealthData | { error: string }> {
  const user = await getCurrentUser();
  if (!user?.isSysAdmin) return { error: 'Acesso negado.' };

  const admin = await createAdminClient();

  // Contagem das tabelas em paralelo
  const tableCounts = await Promise.all(
    TABLE_META.map(async ({ table, label, icon }) => {
      const { count } = await admin
        .from(table)
        .select('id', { count: 'exact', head: true });
      return { name: table, label, icon, count: count ?? 0 } satisfies TableStat;
    })
  );

  // Storage — lista recursiva para capturar size real dos arquivos
  async function listBucketFiles(bucket: string, prefix = ''): Promise<number[]> {
    const { data: items } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
    if (!items) return [];

    const sizes: number[] = [];
    await Promise.all(items.map(async item => {
      if (item.id === null) {
        // é uma pasta — desce recursivamente
        const sub = await listBucketFiles(bucket, prefix ? `${prefix}/${item.name}` : item.name);
        sizes.push(...sub);
      } else {
        sizes.push(item.metadata?.size ?? 0);
      }
    }));
    return sizes;
  }

  const buckets = await Promise.all(
    BUCKET_META.map(async ({ name, label, quotaMB }) => {
      const sizes = await listBucketFiles(name);
      const usedBytes = sizes.reduce((sum, s) => sum + s, 0);
      return {
        name,
        label,
        fileCount:  sizes.length,
        usedBytes,
        quotaBytes: quotaMB * 1024 * 1024,
      } satisfies BucketStat;
    })
  );

  // Módulos (feature flags)
  const { data: flagsData } = await admin
    .from('feature_flags')
    .select('slug, name, is_active')
    .order('name');
  const modules = (flagsData ?? []) as ModuleStat[];

  // Logs recentes
  const { data: logsData } = await admin
    .from('audit_logs')
    .select('id, action, actor_name, actor_role, entity_name, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  const recentLogs = (logsData ?? []) as RecentAuditLog[];

  // Total de usuários
  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const totalUsers = Array.isArray(authData?.users) ? authData.users.length : 0;

  return {
    tables:      tableCounts,
    buckets,
    modules,
    recentLogs,
    totalUsers,
    generatedAt: new Date().toISOString(),
  };
}
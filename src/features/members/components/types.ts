export interface AdminMemberRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  address: string | null;
  cell_group: string | null;
  created_at: string;
  banned_until: string | null;
  ban_reason: string | null;
  requires_password_change: boolean;
  force_logout: boolean;
  banned_modules: string[];
  birth_date?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  roles: string[];
}

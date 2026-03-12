export type MeetingType = 'presencial' | 'online' | 'hibrido';

// ── Blocos CMS ──────────────────────────────────────────────

export interface HeroContent {
  title: string;
  subtitle: string;
  cta_label: string;
  cta_url: string;
  image_url: string;
}

export interface AboutContent {
  title: string;
  body: string;
  image_url: string;
}

export interface PastorsSectionContent {
  title: string;
  subtitle: string;
}

export interface CellsSectionContent {
  title: string;
  subtitle: string;
}

export interface EventsPreviewContent {
  title: string;
  subtitle: string;
}

export interface ContactContent {
  title: string;
  address: string;
  phone: string;
  email: string;
  maps_url: string;
  schedule: string;
}

export type SiteBlockType =
  | 'hero'
  | 'about'
  | 'mission'
  | 'events'
  | 'contact'
  | 'custom_text'
  | 'banner'
  | 'youtube'
  | 'pastors'
  | 'cells'
  | 'events_preview';

export interface SiteBlock {
  id: string;
  type: SiteBlockType;
  order_idx: number;
  content: Record<string, unknown>;
  is_active: boolean;
  updated_at: string;
}

// ── Pastores ────────────────────────────────────────────────

export interface Pastor {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
  sort_order: number;
  is_active: boolean;
}

// ── Células (visão pública) ──────────────────────────────────

export interface PublicCell {
  id: string;
  name: string;
  leader_name: string | null;
  meeting_days: string | null;
  meeting_time: string | null;
  meeting_type: MeetingType;
  neighborhood: string | null;
}
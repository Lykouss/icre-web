export type MeetingType = 'presencial' | 'online' | 'hibrido';

// ── Layout ───────────────────────────────────────────────────

export type BlockAlignment = 'left' | 'center' | 'right';
export type BlockWidth     = 'full' | 'container' | 'narrow';
export type BlockPadding   = 'compact' | 'normal' | 'spacious';

export interface BlockLayout {
  alignment?: BlockAlignment;
  width?:     BlockWidth;
  padding?:   BlockPadding;
  bg_color?:  string;
}

// ── Conteúdo dos blocos ──────────────────────────────────────

export interface HeroContent {
  title:       string;
  subtitle:    string;
  cta_label:   string;
  cta_url:     string;
  image_url:   string;
  bg_color?:   string;
  text_color?: string;
  // legado
  button_text?: string;
  button_link?: string;
}

export interface AboutContent {
  title:     string;
  body?:     string;
  text?:     string;
  image_url: string;
}

export interface MissionItem {
  icon:  string;
  title: string;
  text:  string;
}

export interface MissionContent {
  title: string;
  items: MissionItem[];
}

export interface EventsContent {
  title:    string;
  subtitle: string;
}

export interface YoutubeContent {
  title:       string;
  video_id:    string;
  channel_url: string;
}

export interface ContactContent {
  title:          string;
  subtitle?:      string;
  address:        string;
  phone:          string;
  email:          string;
  schedule?:      string;
  maps_url?:      string;
  maps_embed_url?: string;
}

export interface CustomTextContent {
  title?:      string;
  text:        string;
  bg_color?:   string;
  text_color?: string;
}

export interface BannerContent {
  image_url: string;
  link?:     string;
  alt?:      string;
}

export interface PastorsSectionContent {
  title:    string;
  subtitle: string;
}

export interface CellsSectionContent {
  title:    string;
  subtitle: string;
}

export interface EventsPreviewContent {
  title:    string;
  subtitle: string;
}

// ── Blocos CMS ───────────────────────────────────────────────

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
  id:         string;
  type:       SiteBlockType;
  order_idx:  number;
  content:    Record<string, unknown>;
  is_active:  boolean;
  updated_at: string;
}

// ── Mensagens iframe do editor ────────────────────────────────

export type EditorMessage =
  | { type: 'block-clicked'; blockId: string }
  | { type: 'preview-ready' }
  | { type: 'blocks-updated'; blocks: SiteBlock[] };

// ── Pastores ─────────────────────────────────────────────────

export interface Pastor {
  id:         string;
  name:       string;
  role:       string;
  bio:        string | null;
  photo_url:  string | null;
  sort_order: number;
  is_active:  boolean;
}

// ── Células (visão pública) ───────────────────────────────────

export interface PublicCell {
  id:           string;
  name:         string;
  leader_name:  string | null;
  meeting_days: string | null;
  meeting_time: string | null;
  meeting_type: MeetingType;
  neighborhood: string | null;
}
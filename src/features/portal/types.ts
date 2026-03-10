export type SiteBlockType =
  | 'hero'
  | 'about'
  | 'mission'
  | 'events'
  | 'contact'
  | 'custom_text'
  | 'banner'
  | 'youtube';

export type BlockAlignment = 'left' | 'center' | 'right';
export type BlockWidth     = 'full' | 'container' | 'narrow';
export type BlockPadding   = 'compact' | 'normal' | 'spacious';

export interface BlockLayout {
  alignment?: BlockAlignment;
  width?:     BlockWidth;
  padding?:   BlockPadding;
  bg_color?:  string;
}

// _layout é armazenado dentro do próprio content JSONB — sem migration
export interface SiteBlock {
  id: string;
  type: SiteBlockType;
  order_idx: number;
  is_active: boolean;
  content: unknown;
  published_content: unknown;
  created_at: string;
  updated_at: string;
}

export interface HeroContent {
  title?: string;
  subtitle?: string;
  bg_color?: string;
  text_color?: string;
  button_text?: string;
  button_link?: string;
  image_url?: string;
  _layout?: BlockLayout;
}

export interface AboutContent {
  title?: string;
  text?: string;
  image_url?: string;
  _layout?: BlockLayout;
}

export interface MissionItem {
  icon?: string;
  title?: string;
  text?: string;
}

export interface MissionContent {
  title?: string;
  items?: MissionItem[];
  _layout?: BlockLayout;
}

export interface EventsContent {
  title?: string;
  subtitle?: string;
  _layout?: BlockLayout;
}

export interface YoutubeContent {
  title?: string;
  channel_url?: string;
  video_id?: string;
  _layout?: BlockLayout;
}

export interface ContactContent {
  title?: string;
  subtitle?: string;
  address?: string;
  phone?: string;
  email?: string;
  maps_embed_url?: string;
  _layout?: BlockLayout;
}

export interface CustomTextContent {
  title?: string;
  text?: string;
  bg_color?: string;
  text_color?: string;
  _layout?: BlockLayout;
}

export interface BannerContent {
  image_url?: string;
  link?: string;
  alt?: string;
  _layout?: BlockLayout;
}

export interface EditorMessage {
  type: 'highlight-block' | 'block-clicked' | 'blocks-updated' | 'preview-ready';
  blockId?: string;
}
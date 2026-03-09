export type EventType = 'culto' | 'especial';
export type EventStatus = 'rascunho' | 'publicado' | 'encerrado' | 'cancelado';
export type ScheduleRole = 'louvor' | 'pregador' | 'recepcao' | 'tecnica';
export type RegistrationStatus = 'confirmado' | 'cancelado';
export type PaymentStatus = 'gratuito' | 'pendente' | 'pago' | 'reembolsado';
export type PaymentMethod = 'pix' | 'cartao' | 'dinheiro' | 'cortesia';

export interface ChurchEvent {
  id: string;
  title: string;
  type: EventType;
  status: EventStatus;
  description: string | null;
  date: string | null;
  time: string | null;
  location: string | null;
  banner_url: string | null;
  is_recurring: boolean;
  recurrence_day: number | null;
  capacity: number | null;
  is_public: boolean;
  publish_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface EventSchedule {
  id: string;
  event_id: string;
  role: ScheduleRole;
  member_id: string | null;
  notes: string | null;
  created_at: string;
  members?: { full_name: string } | null;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  member_id: string | null;
  name: string;
  phone: string | null;
  status: RegistrationStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  payment_amount: number | null;
  payment_ref: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface EventAttendance {
  id: string;
  event_id: string;
  member_id: string | null;
  name: string;
  checked_in_at: string;
}
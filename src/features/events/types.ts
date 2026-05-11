export type EventType = 'culto' | 'especial';
export type EventStatus = 'rascunho' | 'publicado' | 'encerrado' | 'cancelado';
export type ScheduleRole = 'louvor' | 'pregador' | 'recepcao' | 'tecnica';
export type RegistrationStatus = 'confirmado' | 'cancelado' | 'pendente_pagamento';
export type PaymentStatus = 'gratuito' | 'pendente' | 'pago' | 'reembolsado' | 'expirado' | 'cortesia';
export type PaymentMethod = 'pix' | 'cartao' | 'dinheiro' | 'cortesia' | 'gift' | 'asaas_pix' | 'asaas_boleto';

// ─── Dynamic form schema ─────────────────────────────────────────────────────

export type FormFieldType =
  | 'short_text'
  | 'long_text'
  | 'multiple_choice'
  | 'checkboxes'
  | 'dropdown';

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  options?: string[]; // for multiple_choice, checkboxes, dropdown
}

export type CustomFormSchema = FormField[];
export type CustomFormResponses = Record<string, string | string[]>;

// ─── Event ───────────────────────────────────────────────────────────────────

export interface ChurchEvent {
  id: string;
  title: string;
  type: EventType;
  status: EventStatus;
  description: string | null;
  rules?: string | null;
  date: string | null;
  time: string | null;
  location: string | null;
  banner_url: string | null;
  is_recurring: boolean;
  recurrence_day: number | null;
  recurrence_rules?: { type: 'weekly' | 'monthly'; days: number[] } | null;
  cancelled_dates?: string[] | null;
  capacity: number | null;
  is_public: boolean;
  requires_registration: boolean;
  requires_payment: boolean;
  ticket_price: number | null;
  max_per_account: number;
  max_per_ip: number;
  max_per_device: number;
  payment_methods: string[];
  publish_at: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  custom_form_schema: CustomFormSchema | null;
}

// ─── Schedule ────────────────────────────────────────────────────────────────

export interface EventSchedule {
  id: string;
  event_id: string;
  role: ScheduleRole;
  member_id: string | null;
  notes: string | null;
  created_at: string;
  members?: { full_name: string } | null;
}

// ─── Registration ────────────────────────────────────────────────────────────

export interface EventRegistration {
  id: string;
  event_id: string;
  member_id: string | null;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  status: RegistrationStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  payment_amount: number | null;
  amount_paid: number | null;
  payment_ref: string | null;
  asaas_payment_id: string | null;
  asaas_invoice_url: string | null;
  paid_at: string | null;
  receipt_url: string | null;
  ticket_signature: string | null;
  ip_address: string | null;
  device_id: string | null;
  checkin_status: boolean;
  checkin_time: string | null;
  checkin_by: string | null;
  is_gift: boolean;
  gifted_by: string | null;
  custom_form_responses: CustomFormResponses | null;
  created_at: string;
}

// ─── Attendance ──────────────────────────────────────────────────────────────

export interface EventAttendance {
  id: string;
  event_id: string;
  member_id: string | null;
  name: string;
  checked_in_at: string;
}

// ─── Asaas ───────────────────────────────────────────────────────────────────

export interface AsaasPaymentInfo {
  paymentId: string;
  invoiceUrl: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  pixExpirationDate?: string;
  boletoUrl?: string;
  status: string;
  value: number;
  dueDate: string;
}

// ─── Checkin result (for QR scanner) ─────────────────────────────────────────

export interface CheckinResult {
  success: boolean;
  error?: string;
  alreadyCheckedIn?: boolean;
  firstCheckinAt?: string;
  firstCheckinBy?: string;
  registrant?: {
    name: string;
    email: string | null;
    payment_status: PaymentStatus;
    is_gift: boolean;
  };
}
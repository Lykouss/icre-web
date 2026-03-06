export type TransactionType = 'entrada' | 'saida';
export type TransactionStatus = 'pendente' | 'pago' | 'cancelado';

export interface TransactionCategory {
  id: string;
  name: string;
  type: TransactionType;
}

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  category: string;
  description: string | null;
  amount: number;
  status: TransactionStatus | null;
  member_id: string | null;
  date: string;
  created_by: string | null;
  created_at: string;
  receipt_url: string | null;
  tags: string[] | null;
  payment_id: string | null;
  members: { full_name: string } | null;
  profiles: { full_name: string } | null;
}

export interface FinancialClosing {
  id: string;
  month: number;
  year: number;
  closed_at: string;
  closed_by: string | null;
  balance_at_closing: number | null;
  profiles: { full_name: string } | null;
}

export interface FinancialRecurring {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: TransactionType;
  day_of_month: number;
  active: boolean | null;
  created_at: string;
  created_by: string | null;
}

export interface FinanceLog {
  id: string;
  action: string;
  actor_id: string | null;
  actor_name: string;
  actor_role: string;
  entity_name: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface MonthSummary {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  isClosed: boolean;
  closing?: FinancialClosing;
}
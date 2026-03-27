// src/lib/asaas.ts

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

if (!ASAAS_API_KEY) {
  console.warn("ASAAS_API_KEY não está definida nas variáveis de ambiente. Pagamentos não funcionarão.");
}

// Interfaces Estritas (Sem 'any')
export interface AsaasCustomer {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
}

export interface AsaasPaymentPayload {
  customer: string; // ID do Customer no Asaas
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string; // ID do evento ou inscrição no Supabase
  postalService?: boolean;
}

export interface AsaasPaymentResponse {
  id: string;
  invoiceUrl: string; // Link para o cliente pagar
  bankSlipUrl?: string; // Link direto pro boleto (se aplicável)
  pixTransaction?: string; // Payload do PIX copia e cola (vem em outra requisição geralmente)
  value: number;
  netValue: number;
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'REFUND_IN_PROGRESS' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS';
  dueDate: string;
}

export interface AsaasPixQrCodeResponse {
  encodedImage: string; // Base64 da imagem do QR Code
  payload: string; // PIX Copia e Cola
  expirationDate: string;
}

/**
 * Função utilitária para fazer requisições à API do Asaas
 */
async function fetchAsaas<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${ASAAS_API_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'access_token': ASAAS_API_KEY || '',
    ...(options?.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Erro na API do Asaas (${response.status}): ${errorBody}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Cria um novo cliente (Customer) no Asaas.
 * Necessário antes de gerar qualquer cobrança.
 */
export async function createAsaasCustomer(customerData: AsaasCustomer): Promise<{ id: string }> {
  return fetchAsaas<{ id: string }>('/customers', {
    method: 'POST',
    body: JSON.stringify(customerData)
  });
}

/**
 * Cria uma nova cobrança (Payment) no Asaas.
 */
export async function createAsaasPayment(paymentData: AsaasPaymentPayload): Promise<AsaasPaymentResponse> {
  return fetchAsaas<AsaasPaymentResponse>('/payments', {
    method: 'POST',
    body: JSON.stringify(paymentData)
  });
}

/**
 * Se a cobrança for PIX, recupera o QR Code e o Copia-e-Cola.
 */
export async function getAsaasPixQrCode(paymentId: string): Promise<AsaasPixQrCodeResponse> {
  return fetchAsaas<AsaasPixQrCodeResponse>(`/payments/${paymentId}/pixQrCode`, {
    method: 'GET'
  });
}
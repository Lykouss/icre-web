'use server'

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_TIMEOUT_MS = 10_000; // 10 seconds

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface AsaasCustomerPayload {
  name: string;
  email?: string;
  phone?: string;
  cpfCnpj?: string;
  externalReference?: string;
}

interface AsaasPaymentPayload {
  customer: string;
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  value: number;
  dueDate: string;
  description: string;
  externalReference?: string;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone: string;
  };
}

interface AsaasCustomerResponse {
  id: string;
  name: string;
  cpfCnpj?: string;
  email?: string;
}

interface AsaasPaymentResponse {
  id: string;
  invoiceUrl: string;
  bankSlipUrl?: string;
  value: number;
  netValue: number;
  status: string;
  dueDate: string;
}

interface AsaasPixQrCodeResponse {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

// ─── Core fetch with AbortController timeout ─────────────────────────────────

async function fetchAsaas<T>(endpoint: string, options?: RequestInit): Promise<T> {
  if (!ASAAS_API_KEY) throw new Error('ASAAS_API_KEY não configurada.');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ASAAS_TIMEOUT_MS);

  try {
    const res = await fetch(`${ASAAS_API_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY,
        ...(options?.headers ?? {}),
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Asaas API error (${res.status}): ${body}`);
    }

    return res.json() as Promise<T>;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('Asaas API timeout: a requisição demorou mais de 10 segundos.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Customer: CPF-first lookup ──────────────────────────────────────────────

export async function createOrFindAsaasCustomer(
  name: string,
  email?: string,
  phone?: string,
  cpfCnpj?: string
): Promise<string> {
  let customerId: string | null = null;

  // 1. Primary lookup by CPF/CNPJ (prevents duplicate CPF rejection by Asaas)
  if (cpfCnpj) {
    try {
      const byCpf = await fetchAsaas<{ data: AsaasCustomerResponse[] }>(
        `/customers?cpfCnpj=${encodeURIComponent(cpfCnpj)}`
      );
      if (byCpf.data.length > 0) {
        customerId = byCpf.data[0].id;
      }
    } catch {
      // CPF search failed — proceed to email fallback
    }
  }

  // 2. Fallback: lookup by email
  if (!customerId && email) {
    try {
      const byEmail = await fetchAsaas<{ data: AsaasCustomerResponse[] }>(
        `/customers?email=${encodeURIComponent(email)}`
      );
      if (byEmail.data.length > 0) {
        customerId = byEmail.data[0].id;
      }
    } catch {
      // Email search failed — will create new
    }
  }

  const payload: AsaasCustomerPayload = {
    name,
    email,
    phone,
    cpfCnpj,
  };

  if (customerId) {
    // Update existing customer to ensure CPF is recorded
    await fetchAsaas<AsaasCustomerResponse>(`/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return customerId;
  }

  // Create new customer
  const customer = await fetchAsaas<AsaasCustomerResponse>('/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return customer.id;
}

// ─── Payments ────────────────────────────────────────────────────────────────

export async function createAsaasPixPayment(
  customerId: string,
  value: number,
  description: string,
  registrationId: string
): Promise<AsaasPaymentResponse> {
  const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const payload: AsaasPaymentPayload = {
    customer: customerId,
    billingType: 'PIX',
    value,
    dueDate,
    description,
    externalReference: registrationId,
  };

  return fetchAsaas<AsaasPaymentResponse>('/payments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createAsaasBoletoPayment(
  customerId: string,
  value: number,
  description: string,
  registrationId: string
): Promise<AsaasPaymentResponse> {
  const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const payload: AsaasPaymentPayload = {
    customer: customerId,
    billingType: 'BOLETO',
    value,
    dueDate,
    description,
    externalReference: registrationId,
  };

  return fetchAsaas<AsaasPaymentResponse>('/payments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getAsaasPixQrCode(
  paymentId: string
): Promise<AsaasPixQrCodeResponse> {
  return fetchAsaas<AsaasPixQrCodeResponse>(`/payments/${paymentId}/pixQrCode`);
}

export async function getAsaasPaymentStatus(paymentId: string): Promise<string> {
  const payment = await fetchAsaas<{ status: string }>(`/payments/${paymentId}`);
  return payment.status;
}
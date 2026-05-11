'use server'

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

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
}

interface AsaasCustomerResponse {
  id: string;
  name: string;
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

async function fetchAsaas<T>(endpoint: string, options?: RequestInit): Promise<T> {
  if (!ASAAS_API_KEY) throw new Error('ASAAS_API_KEY não configurada.');

  // Prevenção de travamento do servidor por instabilidade da API externa
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos max

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

    return await res.json() as T;
  } catch (error) {
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function createOrFindAsaasCustomer(
  name: string,
  email?: string,
  phone?: string,
  cpfCnpj?: string
): Promise<string> {
  let customerId: string | null = null;

  // Busca primária obrigatória por CPF/CNPJ para evitar bloqueio do Asaas
  if (cpfCnpj) {
    try {
      const cleanCpf = cpfCnpj.replace(/\D/g, '');
      const existingCpf = await fetchAsaas<{ data: AsaasCustomerResponse[] }>(
        `/customers?cpfCnpj=${cleanCpf}`
      );
      if (existingCpf.data && existingCpf.data.length > 0) {
        customerId = existingCpf.data[0].id;
      }
    } catch (e) {
      // Ignora erro de busca para permitir fallback ou criação
    }
  }

  // Fallback para e-mail apenas se o CPF não encontrou nada
  if (!customerId && email) {
    try {
      const existingEmail = await fetchAsaas<{ data: AsaasCustomerResponse[] }>(
        `/customers?email=${encodeURIComponent(email)}`
      );
      if (existingEmail.data && existingEmail.data.length > 0) {
        customerId = existingEmail.data[0].id;
      }
    } catch (e) {
      // Ignora erro de busca
    }
  }

  const payload: AsaasCustomerPayload = { name, email, phone, cpfCnpj };

  if (customerId) {
    // Atualizar cliente existente
    await fetchAsaas<AsaasCustomerResponse>(`/customers/${customerId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return customerId;
  }

  // Criar novo cliente
  const customer = await fetchAsaas<AsaasCustomerResponse>('/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return customer.id;
}

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
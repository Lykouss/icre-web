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
      // Lança o erro para que a Action do frontend saiba que o pagamento falhou
      throw new Error(`Asaas API error (${res.status}): ${body}`);
    }

    return res.json() as Promise<T>;
  } finally {
    // Garante que o timeout será removido da memória do servidor Vercel/Node sempre
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

  if (cpfCnpj) {
    try {
      const cleanCpf = cpfCnpj.replace(/\D/g, '');
      const existingCpf = await fetchAsaas<{ data: AsaasCustomerResponse[] }>(
        `/customers?cpfCnpj=${cleanCpf}`
      );
      if (existingCpf.data && existingCpf.data.length > 0) {
        customerId = existingCpf.data[0].id;
      }
    } catch (error) {
      console.warn('Busca por CPF falhou, caindo para fallback ou criacao:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  if (!customerId && email) {
    try {
      const existingEmail = await fetchAsaas<{ data: AsaasCustomerResponse[] }>(
        `/customers?email=${encodeURIComponent(email)}`
      );
      if (existingEmail.data && existingEmail.data.length > 0) {
        customerId = existingEmail.data[0].id;
      }
    } catch (error) {
      console.warn('Busca por e-mail falhou, caindo para criacao:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  const payload: AsaasCustomerPayload = { name, email, phone, cpfCnpj };

  if (customerId) {
    // Método PUT corretamente restaurado para atualização de clientes na API v3
    await fetchAsaas<AsaasCustomerResponse>(`/customers/${customerId}`, {
      method: 'PUT',
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

interface AsaasBoletoDetailResponse {
  id: string;
  status: string;
  value: number;
  dueDate: string;
  bankSlipUrl?: string;
  identificationField?: string; // Código de barras
  nossoNumero?: string;
}

export async function getAsaasBoletoDetails(
  paymentId: string
): Promise<AsaasBoletoDetailResponse> {
  return fetchAsaas<AsaasBoletoDetailResponse>(`/payments/${paymentId}`);
}
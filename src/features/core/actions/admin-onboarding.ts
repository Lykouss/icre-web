'use server'

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { isValidPhone, isValidDate } from '@/lib/action-validators';

function sanitize(value: string): string {
  return value.trim().replace(/[<>]/g, '');
}

function isValidCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  if (rem !== parseInt(d[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  return rem === parseInt(d[10]);
}

function isValidCEP(cep: string): boolean {
  return /^\d{5}-?\d{3}$/.test(cep.trim());
}

function isAdult(birthDate: string): boolean {
  const age = Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );
  return age >= 18;
}

// Avança o onboarding_step de forma segura, verificando o step atual
export async function advanceOnboardingStep(
  fromStep: string,
  toStep: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autorizado.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_step')
    .eq('id', user.id)
    .single();

  if (profile?.onboarding_step !== fromStep) {
    return { error: 'Etapa inválida.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_step: toStep })
    .eq('id', user.id);

  if (error) {
    console.error('[onboarding] Erro ao avançar step:', error.message);
    return { error: 'Falha ao avançar etapa.' };
  }

  return {};
}

export async function submitAdminProfile(
  formData: FormData
): Promise<{ error?: string; field?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autorizado.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_step')
    .eq('id', user.id)
    .single();

  if (profile?.onboarding_step !== 'fill_admin_profile') {
    return { error: 'Acesso negado.' };
  }

  const fullName     = sanitize((formData.get('fullName')     as string) ?? '');
  const cpf          = sanitize((formData.get('cpf')          as string) ?? '');
  const birthDate    = sanitize((formData.get('birthDate')    as string) ?? '');
  const phone        = sanitize((formData.get('phone')        as string) ?? '');
  const churchRole   = sanitize((formData.get('churchRole')   as string) ?? '');
  const address      = sanitize((formData.get('address')      as string) ?? '');
  const number       = sanitize((formData.get('number')       as string) ?? '');
  const neighborhood = sanitize((formData.get('neighborhood') as string) ?? '');
  const city         = sanitize((formData.get('city')         as string) ?? '');
  const state        = sanitize((formData.get('state')        as string) ?? '');
  const cep          = sanitize((formData.get('cep')          as string) ?? '');

  const nameParts = fullName.trim().split(/\s+/);
  if (!fullName || nameParts.length < 2 || fullName.length < 5)
    return { error: 'Informe o nome completo (mínimo nome e sobrenome).', field: 'fullName' };
  if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(fullName))
    return { error: 'Nome contém caracteres inválidos.', field: 'fullName' };

  const cpfDigits = cpf.replace(/\D/g, '');
  if (!isValidCPF(cpfDigits))
    return { error: 'CPF inválido.', field: 'cpf' };

  if (!birthDate || !isValidDate(birthDate))
    return { error: 'Data de nascimento inválida.', field: 'birthDate' };
  if (!isAdult(birthDate))
    return { error: 'É necessário ter pelo menos 18 anos para ser administrador.', field: 'birthDate' };

  if (!phone || !isValidPhone(phone))
    return { error: 'Número de telefone inválido.', field: 'phone' };

  if (!churchRole || churchRole.length < 3)
    return { error: 'Informe sua função na igreja.', field: 'churchRole' };

  if (!address || address.length < 5)
    return { error: 'Informe o logradouro.', field: 'address' };
  if (!number)
    return { error: 'Informe o número.', field: 'number' };
  if (!neighborhood || neighborhood.length < 3)
    return { error: 'Informe o bairro.', field: 'neighborhood' };
  if (!city || city.length < 2)
    return { error: 'Informe a cidade.', field: 'city' };
  if (!state || state.length !== 2)
    return { error: 'Informe o estado (UF).', field: 'state' };
  if (!isValidCEP(cep))
    return { error: 'CEP inválido. Use o formato 00000-000.', field: 'cep' };

  const admin = await createAdminClient();
  const { data: existingCpf } = await admin
    .from('profiles')
    .select('id')
    .eq('cpf', cpfDigits)
    .neq('id', user.id)
    .maybeSingle();

  if (existingCpf) return { error: 'Este CPF já está cadastrado no sistema.', field: 'cpf' };

  const fullAddress = `${address}, ${number}, ${neighborhood}, ${city}/${state.toUpperCase()} — CEP ${cep}`;

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name:                  fullName,
      cpf:                        cpfDigits,
      birth_date:                 birthDate,
      phone:                      phone.replace(/\D/g, ''),
      church_role:                churchRole,
      address:                    fullAddress,
      admin_profile_completed_at: new Date().toISOString(),
      onboarding_step:            'done', // agora avança para foto
    })
    .eq('id', user.id);

  if (error) {
    console.error('[admin-onboarding] Erro ao salvar perfil:', error.message);
    return { error: 'Falha ao salvar. Tente novamente.' };
  }

  redirect('/admin-onboarding/foto');
}
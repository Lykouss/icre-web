'use server'

import { createClient } from '@/lib/supabase/server';
import { isValidPhone } from '@/lib/action-validators';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendContactMessage(formData: FormData) {
  const name    = (formData.get('name')    as string)?.trim();
  const phone   = (formData.get('phone')   as string)?.trim();
  const email   = (formData.get('email')   as string)?.trim();
  const message = (formData.get('message') as string)?.trim();

  if (!name || name.length < 3)              return { error: 'Nome precisa ter ao menos 3 caracteres.' };
  if (!message || message.length < 10)       return { error: 'Mensagem muito curta.' };
  if (phone && !isValidPhone(phone))         return { error: 'Telefone inválido.' };
  if (email && !isValidEmail(email))         return { error: 'E-mail inválido.' };
  if (!phone && !email)                      return { error: 'Informe pelo menos telefone ou e-mail para retorno.' };

  const supabase = await createClient();

  const { error } = await supabase.from('contact_messages').insert({
    name,
    phone:   phone   || null,
    email:   email   || null,
    message,
  });

  if (error) {
    console.error('Erro ao salvar mensagem de contato:', error.message);
    return { error: 'Falha ao enviar a mensagem. Tente novamente.' };
  }

  return { success: true };
}
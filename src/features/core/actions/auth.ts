'use server'

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { isValidEmail, isValidPhone, isValidDate } from '@/lib/action-validators';
import { verifyTurnstileToken } from '@/lib/turnstile';

const MAX_REGISTER_ATTEMPTS = 5;
const WINDOW_MINUTES = 60;

interface RegisterResult {
  error?: string;
  field?: string;
}

function sanitize(value: string): string {
  return value.trim().replace(/[<>]/g, '');
}

async function checkAndRecordRateLimit(identifier: string, action: string, maxAttempts: number, windowMinutes: number): Promise<boolean> {
  const admin = await createAdminClient();
  const { data, error } = await admin.rpc('rpc_check_and_record_rate_limit', {
    p_identifier: identifier.toLowerCase(),
    p_action: action,
    p_max_attempts: maxAttempts,
    p_window_minutes: windowMinutes
  });
  if (error) {
    console.error(`[RateLimit] RPC Error for ${action}:`, error.message);
    return false; // Fail secure
  }
  return !!data;
}

export async function registerUser(formData: FormData): Promise<RegisterResult> {
  const turnstileToken = (formData.get('turnstile_token') as string)?.trim();
  const isHuman = await verifyTurnstileToken(turnstileToken);
  if (!isHuman) {
    return { error: 'Falha na verificação de segurança. Tente novamente.' };
  }

  const fullName    = sanitize((formData.get('fullName')    as string) ?? '');
  const email       = sanitize((formData.get('email')       as string) ?? '').toLowerCase();
  const phone       = sanitize((formData.get('phone')       as string) ?? '');
  const address     = sanitize((formData.get('address')     as string) ?? '');
  const birthDate   = sanitize((formData.get('birthDate')   as string) ?? '');
  const password    = (formData.get('password')    as string) ?? '';
  const confirmPass = (formData.get('confirmPass') as string) ?? '';
  const termsAccepted = formData.get('termsAccepted') === 'true';

  // ── Validações ────────────────────────────────────────────────
  if (!fullName || fullName.length < 3 || fullName.length > 100) {
    return { error: 'Nome deve ter entre 3 e 100 caracteres.', field: 'fullName' };
  }
  if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(fullName)) {
    return { error: 'Nome contém caracteres inválidos.', field: 'fullName' };
  }
  if (!isValidEmail(email)) {
    return { error: 'E-mail inválido.', field: 'email' };
  }
  if (phone && !isValidPhone(phone)) {
    return { error: 'Telefone inválido.', field: 'phone' };
  }
  if (!birthDate || !isValidDate(birthDate)) {
    return { error: 'Data de nascimento inválida.', field: 'birthDate' };
  }
  const age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  if (age < 13) {
    return { error: 'É necessário ter pelo menos 13 anos para criar uma conta.', field: 'birthDate' };
  }
  if (age > 120) {
    return { error: 'Data de nascimento inválida.', field: 'birthDate' };
  }
  if (address && address.length > 300) {
    return { error: 'Endereço muito longo.', field: 'address' };
  }
  if (password.length < 8 || password.length > 72) {
    return { error: 'A senha deve ter entre 8 e 72 caracteres.', field: 'password' };
  }
  if (!/[A-Z]/.test(password)) {
    return { error: 'A senha deve conter ao menos uma letra maiúscula.', field: 'password' };
  }
  if (!/[0-9]/.test(password)) {
    return { error: 'A senha deve conter ao menos um número.', field: 'password' };
  }
  if (password !== confirmPass) {
    return { error: 'As senhas não coincidem.', field: 'confirmPass' };
  }
  if (!termsAccepted) {
    return { error: 'Você precisa aceitar os Termos e Condições.', field: 'terms' };
  }

  // ── Rate Limiting ─────────────────────────────────────────────
  const allowed = await checkAndRecordRateLimit(email, 'register', MAX_REGISTER_ATTEMPTS, WINDOW_MINUTES);
  if (!allowed) {
    return { error: 'Muitas tentativas de cadastro. Aguarde 1 hora e tente novamente.' };
  }

  const admin = await createAdminClient();

  // ── Checagem de Manutenção ────────────────────────────────────
  const { data: maintenance } = await admin
    .from('site_maintenance')
    .select('is_portal_maintenance, block_signups, block_logins')
    .eq('id', 1)
    .single();

  if (maintenance && (maintenance.is_portal_maintenance || maintenance.block_signups || maintenance.block_logins)) {
    return { error: 'Novos cadastros estão temporariamente suspensos.' };
  }

  // ── Verifica e-mail duplicado de forma determinística ─────────
  const { data: authUser } = await admin
    .schema('auth')
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (authUser) {
    return { error: 'Este e-mail já está cadastrado.', field: 'email' };
  }

  // ── Cria usuário via adminClient (email_confirm=true para forçar login s/ verificação)
  const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

 if (createError) {
    if (createError.code === 'email_exists') {
      return { error: 'Este e-mail já está cadastrado.', field: 'email' };
    }
    console.error('[register] Erro ao criar usuário:', createError.message);
    return { error: 'Erro ao criar conta. Tente novamente.' };
  }

  if (!createdUser.user) {
    return { error: 'Erro inesperado ao criar conta.' };
  }

  const userId = createdUser.user.id;

  // ── Atualiza profile via adminClient (bypassa RLS) ───────────
  // O trigger handle_new_user já criou o profile.
  // Aqui preenchemos todos os dados do cadastro público.
  const { error: profileError } = await admin
    .from('profiles')
    .update({
      full_name:         fullName,
      phone:             phone || null,
      address:           address || null,
      birth_date:        birthDate || null,
      terms_accepted_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) {
    console.error('[register] Erro ao atualizar profile:', profileError.message);
    // O trigger on_profile_complete_create_member só dispara no UPDATE,
    // então tentamos criar a ficha de membro diretamente aqui como fallback.
    await admin.from('members').insert({
      user_id:    userId,
      full_name:  fullName,
      phone:      phone || null,
      address:    address || null,
      birth_date: birthDate || null,
      status:     'Visitante',
    }).then(({ error: mError }) => {
      if (mError) console.error('[register] Fallback member insert falhou:', mError.message);
    });
  }

  // ── Login automático ──────────────────────────────────────────
  const supabase = await createClient();
  const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

  if (loginError) {
    console.error('[register] Erro no login automático:', loginError.message);
    redirect('/login');
  }

  redirect('/cadastro/sucesso');
}

// ── Login ─────────────────────────────────────────────────────────

const MAX_LOGIN_ATTEMPTS = 10;
const LOGIN_WINDOW_MINUTES = 15;

interface LoginResult {
  error?: string;
}

// checkLoginRateLimit replaced by global checkAndRecordRateLimit

export async function loginUser(
  prevState: LoginResult | null,
  formData: FormData
): Promise<LoginResult> {
  const turnstileToken = (formData.get('turnstile_token') as string)?.trim();
  const isHuman = await verifyTurnstileToken(turnstileToken);
  if (!isHuman) {
    return { error: 'Falha na verificação de segurança. Tente novamente.' };
  }

  const email    = sanitize((formData.get('email')    as string) ?? '').toLowerCase();
  const password = (formData.get('password') as string) ?? '';

  if (!isValidEmail(email) || !password) {
    return { error: 'E-mail ou senha inválidos.' };
  }

  const allowed = await checkAndRecordRateLimit(email, 'login', MAX_LOGIN_ATTEMPTS, LOGIN_WINDOW_MINUTES);
  if (!allowed) {
    return { error: `Muitas tentativas. Aguarde ${LOGIN_WINDOW_MINUTES} minutos.` };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: 'E-mail ou senha incorretos.' };
  }

  // ── Checagem de Manutenção ────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const admin = await createAdminClient();
    const { data: maintenance } = await admin
      .from('site_maintenance')
      .select('is_portal_maintenance, block_logins')
      .eq('id', 1)
      .single();

    if (maintenance && (maintenance.is_portal_maintenance || maintenance.block_logins)) {
      const { data: roles } = await admin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      const isSysAdmin = roles?.some((r: any) => r.role === 'SYSADMIN' || r.role === 'CHURCH_ADMIN');
      if (!isSysAdmin) {
        await supabase.auth.signOut();
        return { error: 'O site está em manutenção. Logins estão temporariamente suspensos.' };
      }
    }
  }

  redirect('/');
}

// ── Reset de senha ─────────────────────────────────────────────

export async function requestPasswordReset(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const turnstileToken = (formData.get('turnstile_token') as string)?.trim();
  const isHuman = await verifyTurnstileToken(turnstileToken);
  if (!isHuman) {
    return { error: 'Falha na verificação de segurança. Tente novamente.' };
  }

  const email = sanitize((formData.get('email') as string) ?? '').toLowerCase();

  if (!isValidEmail(email)) {
    return { error: 'E-mail inválido.' };
  }

  const allowed = await checkAndRecordRateLimit(email, 'reset_password', 3, 60);
  if (!allowed) {
    return { error: 'Muitas solicitações. Aguarde 1 hora.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/nova-senha`,
  });

  if (error) {
    console.error('[reset] Erro no reset de senha:', error.message);
  }

  return { success: true };
}

// ── Aceitar termos de admin ────────────────────────────────────

export async function acceptAdminTerms(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autorizado.' };

  const { error } = await supabase
    .from('profiles')
    .update({
      admin_terms_accepted_at: new Date().toISOString(),
      onboarding_step: 'create_pin',
    })
    .eq('id', user.id);

  if (error) {
    console.error('[admin] Erro ao aceitar termos:', error.message);
    return { error: 'Falha ao salvar. Tente novamente.' };
  }

  redirect('/criar-pin');
}

// ── Finalizar onboarding (após criar PIN) ─────────────────────

export async function completeAdminOnboarding(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autorizado.' };

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_step: 'done' })
    .eq('id', user.id);

  if (error) {
    console.error('[admin] Erro ao finalizar onboarding:', error.message);
    return { error: 'Falha ao finalizar. Tente novamente.' };
  }

  redirect('/dashboard');
}

export async function saveAdminPin(pin: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autorizado.' };

  if (!/^\d{4}$/.test(pin)) return { error: 'PIN inválido.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_step')
    .eq('id', user.id)
    .single();

  if (profile?.onboarding_step !== 'create_pin') {
    return { error: 'Etapa inválida.' };
  }

  const bcrypt = await import('bcryptjs');
  const hash = await bcrypt.hash(pin, 12);

  const { error } = await supabase
    .from('profiles')
    .update({ security_pin_hash: hash })
    .eq('id', user.id);

  if (error) {
    console.error('Erro ao salvar PIN:', error.message);
    return { error: 'Falha ao salvar o PIN. Tente novamente.' };
  }

  return {};
}

export async function verifyAdminPin(pin: string): Promise<{ error?: string }> {
  if (!/^\d{4}$/.test(pin)) return { error: 'PIN inválido.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Sessão expirada. Faça login novamente.' };

  const allowed = await checkAndRecordRateLimit(user.id, 'verify_admin_pin', 5, 15);
  if (!allowed) {
    return { error: 'Muitas tentativas falhas. O acesso por PIN foi bloqueado temporariamente por 15 minutos.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('security_pin_hash')
    .eq('id', user.id)
    .single();

  if (!profile?.security_pin_hash) return { error: 'PIN não configurado.' };

  const bcrypt = await import('bcryptjs');
  const isCorrect = await bcrypt.compare(pin, profile.security_pin_hash);

  if (!isCorrect) return { error: 'PIN incorreto.' };

  return {};
}
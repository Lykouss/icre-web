'use server'

export async function verifyTurnstileToken(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error('TURNSTILE_SECRET_KEY is not defined in environment variables.');
    // Fail securely
    return false;
  }

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
    });

    const data = await res.json();
    return data.success === true;
  } catch (error) {
    console.error('Error verifying turnstile token:', error);
    return false;
  }
}

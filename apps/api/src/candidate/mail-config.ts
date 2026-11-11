export function mailProvider(): 'mailpit' | 'brevo' {
  const provider = process.env.MAIL_PROVIDER ?? 'mailpit';
  if (provider !== 'mailpit' && provider !== 'brevo') throw new Error('Proveedor de correo inválido.');
  return provider;
}

export const fictitiousEmail = (email: string) => /^[^\s@]+@(?:[^\s@.]+\.)*example\.test$/.test(email);
export function realEmail(email: string) {
  const [local, domain] = email.split('@');
  return email.length <= 254 && local?.length <= 64 && !local.startsWith('.') && !local.endsWith('.') && !local.includes('..') &&
    /^[^\s@<>(),;:"\\]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(email) &&
    !/(?:^|\.)(?:test|invalid|localhost)$/i.test(domain ?? '');
}

export function validateMailConfiguration() {
  if (mailProvider() !== 'brevo') return;
  const key = process.env.BREVO_API_KEY;
  const sender = process.env.MAIL_FROM_EMAIL;
  if (!key || /\s/.test(key) || !sender || !realEmail(sender)) {
    throw new Error('Configuración de correo incompleta o inválida.');
  }
}

export function mailDelivery(recipient?: string): 'mailpit' | 'email' {
  return mailProvider() === 'brevo' && (!recipient || !fictitiousEmail(recipient)) ? 'email' : 'mailpit';
}

// The local-only Mailpit API captures test messages without external delivery.
export async function sendLocalCode(recipient: string, code: string) {
  const port = Number(process.env.MAILPIT_HTTP_PORT ?? 8026);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Mailpit local no configurado.');
  const response = await fetch(`http://127.0.0.1:${port}/api/v1/send`, {
    method: 'POST', signal: AbortSignal.timeout(5000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ From: { Email: 'screeningroom@example.test', Name: 'Screeningroom' },
      To: [{ Email: recipient }], Subject: 'Tu código de acceso a Screeningroom',
      Text: `Tu código de acceso es ${code}. Vence en 10 minutos.\nSi no lo solicitaste, ignorá este mensaje.` }),
  });
  if (!response.ok) throw new Error('Mailpit local rechazó el mensaje.');
}

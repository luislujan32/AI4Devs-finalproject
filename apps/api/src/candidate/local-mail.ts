// The local-only Mailpit API captures test messages without external delivery.
async function sendLocalMessage(recipient: string, subject: string, text: string, html?: string) {
  const port = Number(process.env.MAILPIT_HTTP_PORT ?? 8026);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Mailpit local no configurado.');
  const response = await fetch(`http://127.0.0.1:${port}/api/v1/send`, {
    method: 'POST', signal: AbortSignal.timeout(5000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ From: { Email: 'screeningroom@example.test', Name: 'Screeningroom' },
      To: [{ Email: recipient }], Subject: subject, Text: text, ...(html ? { HTML: html } : {}) }),
  });
  if (!response.ok) throw new Error('Mailpit local rechazó el mensaje.');
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]!);

export async function sendLocalInvitation(recipient: string, candidateName: string | undefined, title: string, link: string, expiresAt: Date) {
  const greeting = candidateName ? `Hola, ${candidateName}:` : 'Hola:';
  const deadline = `${new Intl.DateTimeFormat('es-AR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Argentina/Buenos_Aires' }).format(expiresAt)} (hora de Argentina)`;
  const subject = `Invitación para responder preguntas de «${title}» — Screeningroom`;
  const intro = `Te invitaron a responder unas preguntas para «${title}». Podés hacerlo hasta el ${deadline}.`;
  const recovery = 'Este enlace personal abre el cuestionario una sola vez y no pide código. Si querés continuar después, volvé a la invitación y verificá tu correo con un código. No compartas el enlace.';
  const text = `${greeting}\n\n${intro}\n\nResponder preguntas: ${link}\n\n${recovery}\n\nSi el botón no funciona, copiá el enlace anterior en tu navegador. Si no esperabas esta invitación, podés ignorar el mensaje.`;
  const html = `<div style="margin:0;padding:24px 12px;background:#f5f3ed;font-family:Arial,sans-serif;color:#172f2b"><div style="max-width:560px;margin:auto;padding:24px;border:1px solid #dce0d4;border-radius:14px;background:#fffdf8"><div style="font-weight:700;font-size:20px">Screeningroom</div><p style="margin:28px 0 8px;font-size:12px;font-weight:700;letter-spacing:.12em;color:#345c49">INVITACIÓN</p><h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:30px;font-weight:400;line-height:1.2">${escapeHtml(title)}</h1><p style="line-height:1.6">${escapeHtml(greeting)} ${escapeHtml(intro)}</p><p style="margin:28px 0"><a href="${escapeHtml(link)}" style="display:inline-block;padding:13px 20px;border-radius:8px;background:#172f2b;color:#fff;text-decoration:none;font-weight:700">Responder preguntas</a></p><p style="line-height:1.6">${escapeHtml(recovery)}</p><p style="font-size:13px;color:#53645b">Si el botón no funciona, copiá este enlace en tu navegador:</p><p style="font-size:13px;overflow-wrap:anywhere;word-break:break-word"><a href="${escapeHtml(link)}" style="color:#14634b">${escapeHtml(link)}</a></p><p style="margin-top:28px;padding-top:18px;border-top:1px solid #dce0d4;color:#53645b;font-size:13px;line-height:1.5">Si no esperabas esta invitación, podés ignorar el mensaje.</p></div></div>`;
  await sendLocalMessage(recipient, subject, text, html);
}

export async function sendLocalCode(recipient: string, code: string) {
  await sendLocalMessage(recipient, 'Tu código de acceso a Screeningroom',
    `Tu código de acceso es ${code}. Vence en 10 minutos.\nSi no lo solicitaste, ignorá este mensaje.`);
}

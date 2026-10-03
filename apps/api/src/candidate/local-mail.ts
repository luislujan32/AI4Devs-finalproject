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

export async function sendLocalInvitation(recipient: string, candidateName: string | undefined, title: string, link: string) {
  const greeting = candidateName ? `Hola, ${candidateName}:` : 'Hola:';
  const subject = `Te invitaron a responder ${title} en Screeningroom`;
  const text = `${greeting}\n\nTe invitamos a responder el screening «${title}».\n\nAbrí tu enlace personal: ${link}\n\nEl enlace vence en 7 días y abre tu invitación sin pedir un código. Solo se puede usar una vez; después podés continuar en este navegador o verificar tu correo con un código. No lo compartas.\n\nSi no esperabas esta invitación, podés ignorar el mensaje.`;
  const html = `<div style="margin:0;padding:32px 18px;background:#f7f5ef;font-family:Arial,sans-serif;color:#172f2b"><div style="max-width:560px;margin:auto;padding:32px;border:1px solid #dce0d4;border-radius:14px;background:#fffdf8"><div style="font-weight:700;font-size:20px">Screeningroom</div><p style="margin:28px 0 10px;font-size:14px;color:#4e6b5a">INVITACIÓN</p><h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:30px;font-weight:400">${escapeHtml(title)}</h1><p style="line-height:1.6">${escapeHtml(greeting)} Te invitamos a responder unas preguntas para este puesto.</p><p style="margin:28px 0"><a href="${escapeHtml(link)}" style="display:inline-block;padding:13px 20px;border-radius:8px;background:#172f2b;color:#fff;text-decoration:none;font-weight:700">Abrir mi invitación</a></p><p style="line-height:1.6">El enlace vence en 7 días, abre tu invitación sin código y solo se puede usar una vez. No lo compartas.</p><p style="margin-top:28px;padding-top:18px;border-top:1px solid #dce0d4;color:#53645b;font-size:13px;line-height:1.5">Si no esperabas esta invitación, podés ignorar el mensaje.</p></div></div>`;
  await sendLocalMessage(recipient, subject, text, html);
}

export async function sendLocalCode(recipient: string, code: string) {
  await sendLocalMessage(recipient, 'Tu código de acceso a Screeningroom',
    `Tu código de acceso es ${code}. Vence en 10 minutos.\nSi no lo solicitaste, ignorá este mensaje.`);
}

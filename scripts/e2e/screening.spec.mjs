import { spawn } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { expect, test } from '@playwright/test';
import mongoose from 'mongoose';
import { provisionRecruiter } from '../../apps/api/dist/auth/provision.js';

const mongoUri = 'mongodb://127.0.0.1:27018';
const mailpit = 'http://127.0.0.1:8026';

for (const provider of ['mailpit', 'brevo']) test(`${provider}: publicar, invitar, retomar, enviar y decidir en navegador`, async ({ page, browser }) => {
  const id = randomUUID().replaceAll('-', '');
  const database = `screeningroom_demo_e2e_${id}`;
  const recruiterEmail = `recruiter-${id}@example.test`;
  const candidateEmail = `candidate-${id}@example.test`;
  const password = randomBytes(24).toString('base64url');
  const title = 'Soporte técnico · prueba E2E';
  const question = '¿Trabajaste con control de versiones?';
  const reason = 'Revisar experiencia equivalente en entrevista.';
  let api, connection, candidateContext;

  async function mailFor(subject) {
    let message;
    await expect.poll(async () => {
      const response = await fetch(`${mailpit}/api/v1/messages?limit=100`, { signal: AbortSignal.timeout(2000) });
      if (!response.ok) return false;
      const { messages } = await response.json();
      const item = messages?.find((entry) => entry.Subject.startsWith(subject) &&
        entry.To?.some(({ Address }) => Address === candidateEmail));
      if (!item) return false;
      const detail = await fetch(`${mailpit}/api/v1/message/${item.ID}`, { signal: AbortSignal.timeout(2000) });
      if (!detail.ok) return false;
      message = await detail.json();
      return true;
    }, { message: `Mailpit recibió: ${subject}` }).toBe(true);
    return message.Text;
  }

  try {
    await test.step('Preparar una API compilada y una base ficticia aislada', async () => {
      const probe = createServer().listen(0, '127.0.0.1');
      await once(probe, 'listening');
      const port = probe.address().port;
      await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
      const origin = `http://127.0.0.1:${port}`;
      const uri = `${mongoUri}/${database}`;
      connection = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 3000 }).asPromise();
      await provisionRecruiter(connection, recruiterEmail, 'Recruiter de prueba', password);
      api = spawn(process.execPath, ['apps/api/dist/main.js'], {
        env: { ...process.env, NODE_ENV: 'test', SCREENINGROOM_PUBLIC_DEMO: '0', API_PORT: String(port), PUBLIC_ORIGIN: origin,
          MONGODB_URI: uri, MAILPIT_HTTP_PORT: '8026', SESSION_SECRET: randomBytes(32).toString('base64url'),
          MAIL_PROVIDER: provider, BREVO_API_KEY: 'fixture-key-with-no-real-access', MAIL_FROM_EMAIL: 'sender@example.org' },
        stdio: 'ignore',
      });
      await expect.poll(async () => {
        if (api.exitCode !== null) throw new Error('La API de prueba terminó antes de iniciar.');
        try { return (await fetch(`${origin}/api/health/ready`, { signal: AbortSignal.timeout(1000) })).status; }
        catch { return 0; }
      }, { message: 'La API confirma conexión real con MongoDB' }).toBe(200);
      await page.goto(origin);
    });

    await test.step('Crear y publicar un screening con un excluyente', async () => {
      await page.getByLabel('Correo electrónico').fill(recruiterEmail);
      await page.getByLabel('Contraseña').fill(password);
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await page.getByRole('button', { name: 'Crear screening' }).click();
      await page.getByLabel('Título del screening').fill(title);
      await page.getByLabel('Área', { exact: true }).fill('Tecnología');
      await page.getByRole('button', { name: 'Continuar a preguntas' }).click();
      await page.getByRole('button', { name: /Agregar pregunta/ }).click();
      await page.getByRole('button', { name: 'Sí / No', exact: true }).click();
      await page.getByLabel('Criterio', { exact: true }).fill('Control de versiones');
      await page.getByLabel('Pregunta que verá el candidato').fill(question);
      await page.getByRole('checkbox', { name: 'Respuesta requerida' }).check();
      await page.getByRole('checkbox', { name: 'Incluir en el puntaje' }).check();
      await page.getByLabel('Peso (1–5)').fill('3');
      await page.getByLabel('Valor de Sí (0–100)').fill('100');
      await page.getByLabel('Valor de No (0–100)').fill('0');
      await page.getByRole('checkbox', { name: 'Requisito excluyente' }).check();
      await page.getByRole('checkbox', { name: 'Sí cumple requisito' }).check();
      await page.getByRole('button', { name: 'Revisar publicación' }).click();
      await page.getByLabel('Umbral del puesto (0–100)').fill('70');
      await page.getByRole('checkbox', { name: /Revisé preguntas/ }).check();
      await page.getByRole('button', { name: 'Publicar screening' }).click();
      await expect(page.getByText('Publicado · v1 activa')).toBeVisible();
    });

    await test.step('Invitar y abrir el correo en otro contexto de navegador', async () => {
      await page.getByRole('button', { name: 'Postulantes', exact: true }).click();
      await page.getByRole('button', { name: 'Invitar postulante' }).click();
      await expect(page.getByLabel('Correo electrónico')).toHaveAttribute('placeholder', provider === 'brevo' ? 'nombre@correo.com' : 'persona@example.test');
      await page.getByLabel('Correo electrónico').fill(candidateEmail);
      await page.getByLabel('Nombre (opcional)').fill('Alex Demo');
      await page.getByRole('button', { name: 'Enviar invitación' }).click();
      await expect(page.getByText(`Invitación enviada a ${candidateEmail}.`)).toBeVisible();
      const email = await mailFor('Invitación para responder');
      const link = email?.match(/Responder preguntas: (https?:\/\/\S+)/)?.[1];
      if (!link || new URL(link).origin !== new URL(page.url()).origin) throw new Error('Correo sin enlace de la API de prueba.');
      candidateContext = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
      const candidate = await candidateContext.newPage();
      await candidate.goto(link);
      await expect(candidate.getByRole('heading', { name: question, exact: true })).toBeVisible();
      await expect.poll(() => new URL(candidate.url()).hash.includes('&access=')).toBe(false);

      await test.step('Guardar, cerrar acceso y recuperar el mismo avance con código', async () => {
        await candidate.getByRole('radio', { name: 'No', exact: true }).check();
        await candidate.getByRole('button', { name: 'Guardar avance' }).click();
        await expect(candidate.getByText('Respuestas guardadas en el servidor')).toBeVisible();
        await candidate.getByRole('button', { name: 'Cerrar acceso' }).click();
        await candidate.getByRole('button', { name: 'Enviar código de acceso' }).click();
        const message = await mailFor('Tu código de acceso');
        const code = message?.match(/\b\d{6}\b/)?.[0];
        if (!code) throw new Error('Correo sin código de acceso.');
        await candidate.getByLabel('Código de seis dígitos').fill(code);
        await candidate.getByRole('button', { name: 'Continuar', exact: true }).click();
        await expect(candidate.getByRole('radio', { name: 'No', exact: true })).toBeChecked();
      });
      await candidate.getByRole('button', { name: 'Revisar respuestas' }).click();
      const submit = candidate.getByRole('button', { name: 'Enviar respuestas', exact: true });
      await expect(submit).toBeDisabled();
      await candidate.getByRole('checkbox', { name: /Revisé mis respuestas/ }).check();
      await submit.click();
      await expect(candidate.getByRole('heading', { name: 'Respuestas enviadas' })).toBeVisible();
      await candidate.reload();
      await expect(candidate.getByRole('heading', { name: 'Respuestas enviadas' })).toBeVisible();
      await expect(candidate.getByRole('button', { name: 'Guardar avance' })).toHaveCount(0);
      expect(await candidate.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });

    await test.step('Consultar el informe, guardar una decisión y cerrar el screening', async () => {
      await page.reload();
      await page.getByRole('button', { name: 'Ver informe de Alex Demo' }).click();
      await expect(page.getByText('No cumple los criterios', { exact: true })).toBeVisible();
      await expect(page.locator('.report-summary').getByText('0 / 100', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Registrar decisión' }).click();
      await page.getByLabel('Decisión interna').selectOption('continue');
      await page.getByLabel('Motivo (obligatorio)').fill(reason);
      await page.getByRole('button', { name: 'Registrar decisión' }).click();
      await expect(page.getByText(reason)).toBeVisible();
      await page.getByRole('button', { name: /Volver a postulantes/ }).click();
      await page.getByText('Acciones del SC', { exact: true }).click();
      await page.getByRole('button', { name: 'Cerrar SC', exact: true }).click();
      await page.getByRole('button', { name: 'Confirmar cierre' }).click();
      await expect(page.getByText('Cerrado', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Invitar postulante' })).toHaveCount(0);
      await page.getByRole('button', { name: 'Ver informe de Alex Demo' }).click();
      await expect(page.getByText(reason)).toBeVisible();
      await expect(page.getByText('No cumple los criterios', { exact: true })).toBeVisible();
    });
  } finally {
    try { await candidateContext?.close(); }
    finally {
      try {
        if (api && api.exitCode === null && api.signalCode === null) {
          const stopped = once(api, 'exit');
          api.kill('SIGTERM');
          const timer = setTimeout(() => api.kill('SIGKILL'), 4000);
          try { await stopped; } finally { clearTimeout(timer); }
        }
      } finally {
        if (connection) {
          try {
            if (connection.name !== database) throw new Error('Base inesperada; no se limpió.');
            await connection.dropDatabase();
          } finally { await connection.close(); }
        }
      }
    }
  }
});

import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Cria o transport uma única vez.
// Em produção usa SendGrid SMTP; em dev/test usa Ethereal (preview no console).
function createTransport() {
  if (env.NODE_ENV === 'test') {
    // Silencioso em testes — não envia nada
    return nodemailer.createTransport({ jsonTransport: true });
  }

  if (env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: env.SENDGRID_API_KEY,
      },
    });
  }

  // Dev sem SendGrid: loga o email no console (não envia)
  logger.warn('SENDGRID_API_KEY não configurada — emails serão logados no console');
  return nodemailer.createTransport({ jsonTransport: true });
}

const transport = createTransport();

// ─────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────

async function send(to: string, subject: string, html: string): Promise<void> {
  try {
    const info = await transport.sendMail({
      from: `"Errário" <${env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });

    if (env.NODE_ENV === 'development' || !env.SENDGRID_API_KEY) {
      logger.info('Email (dev/sem SendGrid):', { to, subject, preview: JSON.stringify(info) });
    }
  } catch (err) {
    // Falha de email nunca derruba a requisição principal
    logger.error('Falha ao enviar email', { to, subject, err });
  }
}

function baseLayout(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Errário</title>
    </head>
    <body style="margin:0;padding:0;background:#0f0f1a;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0"
              style="background:#1a1a2e;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
              <!-- Header -->
              <tr>
                <td style="background:#4f46e5;padding:32px;text-align:center;">
                  <p style="margin:0;color:#fff;font-size:28px;font-weight:bold;letter-spacing:-0.5px;">
                    📒 Errário
                  </p>
                  <p style="margin:8px 0 0;color:#c7d2fe;font-size:14px;">
                    Transforme seus erros em aprendizado
                  </p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px 32px;color:#e5e7eb;font-size:15px;line-height:1.7;">
                  ${content}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:24px 32px;border-top:1px solid #16213e;text-align:center;">
                  <p style="margin:0;color:#6b7280;font-size:12px;">
                    © ${new Date().getFullYear()} Errário · errario.app
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ─────────────────────────────────────────────
// Emails públicos
// ─────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const firstName = name.split(' ')[0];

  const html = baseLayout(`
    <h2 style="margin:0 0 16px;color:#fff;font-size:22px;">
      Olá, ${firstName}! Bem-vindo ao Errário 🎉
    </h2>
    <p style="margin:0 0 16px;">
      Sua conta foi criada com sucesso. Agora você tem tudo o que precisa para
      transformar seus erros de estudo em aprendizado real.
    </p>
    <p style="margin:0 0 8px;color:#a5b4fc;font-weight:bold;">O que você pode fazer agora:</p>
    <ul style="margin:0 0 24px;padding-left:20px;">
      <li style="margin-bottom:8px;">📝 Registrar seu primeiro erro</li>
      <li style="margin-bottom:8px;">📅 Organizar revisões no Planner semanal</li>
      <li style="margin-bottom:8px;">📊 Acompanhar sua evolução por matéria</li>
    </ul>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#4f46e5;border-radius:10px;padding:14px 28px;">
          <a href="https://errario.app" style="color:#fff;text-decoration:none;font-weight:bold;font-size:15px;">
            Abrir o Errário →
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#9ca3af;font-size:13px;">
      Se não criou esta conta, ignore este email.
    </p>
  `);

  await send(to, 'Bem-vindo ao Errário! 📒', html);
}

export async function sendEmailVerification(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const firstName = name.split(' ')[0];
  const verifyUrl = `${env.API_URL}/api/v1/auth/verify-email?token=${token}`;

  const html = baseLayout(`
    <h2 style="margin:0 0 16px;color:#fff;font-size:22px;">
      Confirme seu email, ${firstName}
    </h2>
    <p style="margin:0 0 24px;">
      Clique no botão abaixo para verificar seu endereço de email.
      O link expira em <strong style="color:#a5b4fc;">24 horas</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#4f46e5;border-radius:10px;padding:14px 28px;">
          <a href="${verifyUrl}" style="color:#fff;text-decoration:none;font-weight:bold;font-size:15px;">
            Verificar email →
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#9ca3af;font-size:13px;">
      Ou copie e cole este link no navegador:<br>
      <span style="color:#818cf8;">${verifyUrl}</span>
    </p>
  `);

  await send(to, 'Verifique seu email — Errário', html);
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const firstName = name.split(' ')[0];
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  const html = baseLayout(`
    <h2 style="margin:0 0 16px;color:#fff;font-size:22px;">
      Redefinir senha, ${firstName}
    </h2>
    <p style="margin:0 0 24px;">
      Recebemos uma solicitação para redefinir sua senha.
      O link expira em <strong style="color:#a5b4fc;">1 hora</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#4f46e5;border-radius:10px;padding:14px 28px;">
          <a href="${resetUrl}" style="color:#fff;text-decoration:none;font-weight:bold;font-size:15px;">
            Redefinir senha →
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#9ca3af;font-size:13px;">
      Se você não solicitou isso, ignore este email — sua senha permanece inalterada.
    </p>
  `);

  await send(to, 'Redefinição de senha — Errário', html);
}

import { prisma } from '../config/database';
import { emailSequenceQueue, type EmailSequenceJob } from './queues';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import nodemailer from 'nodemailer';

// Emails de onboarding sequenciais (D0, D2, D7)
// Enfileirados logo após o registro pelo authService via scheduleOnboardingSequence()

function getTransport() {
  if (env.NODE_ENV === 'test') return nodemailer.createTransport({ jsonTransport: true });

  if (env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: { user: 'apikey', pass: env.SENDGRID_API_KEY },
    });
  }

  return nodemailer.createTransport({ jsonTransport: true });
}

const transport = getTransport();

// Templates por número de email
const TEMPLATES: Record<
  EmailSequenceJob['emailNumber'],
  { subject: string; html: (name: string) => string }
> = {
  1: {
    subject: 'Dica para começar bem no Errário 💡',
    html: (name) => `
      <p>Oi, ${name.split(' ')[0]}!</p>
      <p>Você já registrou seu primeiro erro? Errar é o passo 1 — o <strong>segredo está em documentar</strong>.</p>
      <p>Abra o app agora, crie sua primeira nota e adicione a matéria e as tags. Em 2 minutos você já tem seu diário de erros funcionando.</p>
      <p><strong>Dica:</strong> Use o campo "O que aprendi" para escrever o conceito correto logo após o erro — isso acelera a fixação em 3x.</p>
      <p>Até logo!<br>Equipe Errário</p>
    `,
  },
  2: {
    subject: 'Como o Planner semanal pode salvar sua nota 📅',
    html: (name) => `
      <p>Oi, ${name.split(' ')[0]}!</p>
      <p>Sabia que revisar um conteúdo 3 vezes em intervalos crescentes aumenta a retenção em 70%?</p>
      <p>O <strong>Planner semanal</strong> do Errário Pro faz isso automaticamente — ele distribui suas revisões ao longo da semana para que você não precise lembrar de revisar.</p>
      <p>Se ainda não conhece o Pro, <a href="https://errario.app/upgrade">veja os planos aqui</a>. Os primeiros 7 dias são grátis.</p>
      <p>Bons estudos!<br>Equipe Errário</p>
    `,
  },
  3: {
    subject: 'Você está no caminho certo 🎯',
    html: (name) => `
      <p>Oi, ${name.split(' ')[0]}!</p>
      <p>Faz uma semana que você está usando o Errário. Estudantes que chegam à semana 2 têm <strong>4x mais chance</strong> de manter o hábito de registro.</p>
      <p>Você está no caminho certo. Continue documentando seus erros — cada nota é um tijolo na sua base de conhecimento.</p>
      <p>Qualquer dúvida, responda este email. A gente lê tudo.</p>
      <p>Abraços,<br>Equipe Errário</p>
    `,
  },
};

emailSequenceQueue.process(async (job) => {
  const { userId, email, name, emailNumber } = job.data;

  // Verifica se o usuário ainda existe e não cancelou o onboarding
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    logger.info('Email sequence: usuário não existe mais, pulando', { userId });
    return;
  }

  // Impede duplicata (idempotência via EmailLog)
  const alreadySent = await prisma.emailLog.findFirst({
    where: { userId, sequenceId: 'onboarding', emailNumber },
  });
  if (alreadySent) {
    logger.info('Email sequence: já enviado, pulando', { userId, emailNumber });
    return;
  }

  const template = TEMPLATES[emailNumber];

  try {
    await transport.sendMail({
      from: `"Errário" <${env.EMAIL_FROM}>`,
      to: email,
      subject: template.subject,
      html: template.html(name),
    });

    await prisma.emailLog.create({
      data: { userId, emailType: 'onboarding_sequence', sequenceId: 'onboarding', emailNumber },
    });

    logger.info('Email sequence enviado', { userId, emailNumber });
  } catch (err) {
    logger.error('Falha ao enviar email sequence', { userId, emailNumber, err });
    throw err; // Permite retry pelo Bull
  }
});

emailSequenceQueue.on('failed', (job, err) => {
  logger.error('Email sequence job falhou definitivamente', { jobId: job.id, data: job.data, err });
});

// ─────────────────────────────────────────────
// Agenda a sequência completa para um novo usuário
// ─────────────────────────────────────────────

export async function scheduleOnboardingSequence(
  userId: string,
  email: string,
  name: string
): Promise<void> {
  const delays = {
    1: 0,                         // D0: imediato (boas-vindas já foi pelo emailService)
    2: 2 * 24 * 60 * 60 * 1000,  // D2: 48 horas
    3: 7 * 24 * 60 * 60 * 1000,  // D7: 7 dias
  };

  for (const [num, delay] of Object.entries(delays) as [string, number][]) {
    const emailNumber = parseInt(num) as EmailSequenceJob['emailNumber'];
    if (emailNumber === 1) continue; // D0 já é o welcome email do emailService

    await emailSequenceQueue.add(
      { userId, email, name, emailNumber },
      { delay, jobId: `onboarding:${userId}:d${emailNumber === 2 ? 2 : 7}` }
    );
  }
}

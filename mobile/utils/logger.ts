// Logger simples para o mobile — apenas console em dev, silencioso em prod
const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  info: (msg: string, data?: unknown) => {
    if (isDev) console.info(`[INFO] ${msg}`, data ?? '');
  },
  warn: (msg: string, data?: unknown) => {
    if (isDev) console.warn(`[WARN] ${msg}`, data ?? '');
  },
  error: (msg: string, data?: unknown) => {
    console.error(`[ERROR] ${msg}`, data ?? '');
  },
};

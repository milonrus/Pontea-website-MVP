const hasText = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0;

type PublicEnvName =
  | 'NEXT_PUBLIC_APP_URL'
  | 'NEXT_PUBLIC_CALENDLY_URL'
  | 'NEXT_PUBLIC_SUPPORT_TELEGRAM_URL'
  | 'NEXT_PUBLIC_RUB_PAYMENT_URL_FOUNDATION'
  | 'NEXT_PUBLIC_RUB_PAYMENT_URL_ADVANCED'
  | 'NEXT_PUBLIC_RUB_PAYMENT_URL_FOUNDATION_INSTALLMENT'
  | 'NEXT_PUBLIC_RUB_PAYMENT_URL_ADVANCED_INSTALLMENT';

const PUBLIC_ENV: Record<PublicEnvName, string | undefined> = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_CALENDLY_URL: process.env.NEXT_PUBLIC_CALENDLY_URL,
  NEXT_PUBLIC_SUPPORT_TELEGRAM_URL: process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM_URL,
  NEXT_PUBLIC_RUB_PAYMENT_URL_FOUNDATION: process.env.NEXT_PUBLIC_RUB_PAYMENT_URL_FOUNDATION,
  NEXT_PUBLIC_RUB_PAYMENT_URL_ADVANCED: process.env.NEXT_PUBLIC_RUB_PAYMENT_URL_ADVANCED,
  NEXT_PUBLIC_RUB_PAYMENT_URL_FOUNDATION_INSTALLMENT: process.env.NEXT_PUBLIC_RUB_PAYMENT_URL_FOUNDATION_INSTALLMENT,
  NEXT_PUBLIC_RUB_PAYMENT_URL_ADVANCED_INSTALLMENT: process.env.NEXT_PUBLIC_RUB_PAYMENT_URL_ADVANCED_INSTALLMENT,
};

export function getRequiredPublicEnv(name: PublicEnvName): string {
  const value = PUBLIC_ENV[name];

  if (!hasText(value)) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getOptionalPublicEnv(name: PublicEnvName): string | undefined {
  const value = PUBLIC_ENV[name];
  return hasText(value) ? value : undefined;
}

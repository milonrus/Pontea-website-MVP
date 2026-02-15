export const E164_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

export function normalizePhoneToE164(raw: string): string | null {
  const trimmed = raw.trim();

  if (!trimmed) {
    return null;
  }

  const compact = trimmed.replace(/[\s().-]/g, '');
  if (!compact) {
    return null;
  }

  let candidate = compact;

  if (candidate.startsWith('00')) {
    candidate = `+${candidate.slice(2)}`;
  }

  if (candidate.startsWith('+')) {
    const digits = candidate.slice(1).replace(/\D/g, '');

    if (!digits) {
      return null;
    }

    const international = `+${digits}`;
    return E164_PHONE_REGEX.test(international) ? international : null;
  }

  const digits = candidate.replace(/\D/g, '');
  let normalized: string | null = null;

  if (digits.length === 11 && digits.startsWith('8')) {
    normalized = `+7${digits.slice(1)}`;
  } else if (digits.length === 11 && digits.startsWith('7')) {
    normalized = `+${digits}`;
  } else if (digits.length === 10) {
    normalized = `+7${digits}`;
  }

  if (!normalized) {
    return null;
  }

  return E164_PHONE_REGEX.test(normalized) ? normalized : null;
}

export function getPhoneE164Error(raw: string): string {
  const trimmed = raw.trim();

  if (!trimmed) {
    return '';
  }

  return normalizePhoneToE164(trimmed)
    ? ''
    : 'Введите номер телефона в международном формате (E.164).';
}

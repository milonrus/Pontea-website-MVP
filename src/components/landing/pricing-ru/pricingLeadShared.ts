import { PricingLocale } from './types';

export interface LeadFormState {
  firstName: string;
  fullName: string;
  email: string;
  phone: string;
  contractCountry: string;
  contractCity: string;
  contractPostalCode: string;
  contractAddress: string;
  consentOffer: boolean;
  consentPersonalData: boolean;
}

export interface LeadFormValidationResult {
  errors: Record<string, string>;
  normalizedPhone: string | null;
  parsedFullName: {
    firstName: string;
    lastName: string;
  } | null;
}

export type LeadTextField =
  | 'firstName'
  | 'fullName'
  | 'email'
  | 'phone'
  | 'contractCountry'
  | 'contractCity'
  | 'contractPostalCode'
  | 'contractAddress';

export const DEFAULT_LEAD_FORM: LeadFormState = {
  firstName: '',
  fullName: '',
  email: '',
  phone: '',
  contractCountry: '',
  contractCity: '',
  contractPostalCode: '',
  contractAddress: '',
  consentOffer: false,
  consentPersonalData: false,
};

const E164_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LATIN_TEXT_TOKEN_REGEX = /^[A-Za-z][A-Za-z'.-]*$/;
const LATIN_ADDRESS_REGEX = /^[A-Za-z0-9\s,.'#/-]+$/;
const POSTAL_CODE_REGEX = /^[A-Za-z0-9][A-Za-z0-9\s-]{0,15}$/;
const HAS_LATIN_LETTER_REGEX = /[A-Za-z]/;

export const PRICING_MODAL_TEXT = {
  en: {
    mentorshipPoints: [
      'Define admission goals',
      'Discuss the study plan',
      'Show how the school works',
      'Answer all your questions',
    ],
    modalTitleCurrency: 'Choose payment method',
    modalTitleLeadFormMentorship: 'Application for Individual plan',
    modalTitleLeadFormEur: 'Pay in EUR',
    modalTitleSuccess: 'Application sent',
    errors: {
      firstName: 'Enter name (minimum 2 characters).',
      fullName: 'Enter first and last name (at least two words).',
      fullNameLatin: 'First and last name must be in Latin letters.',
      email: 'Enter a valid email.',
      phone: 'Enter phone number in international format.',
      countryLatin: 'Enter country in Latin letters.',
      cityLatin: 'Enter city in Latin letters.',
      postalCodeLatin: 'Enter postal code in Latin letters and numbers (for example, 20121 or SW1A 1AA).',
      addressLatin: 'Enter address in Latin letters.',
      countryRequired: 'Enter country.',
      cityRequired: 'Enter city.',
      postalCodeRequired: 'Enter postal code.',
      addressRequired: 'Enter address.',
      consentPersonalData: 'Consent to personal data processing is required.',
      consentOffer: 'To continue, accept the public offer terms.',
      submitFailed: 'Failed to submit application. Please try again.',
      submitNetworkFailed: 'Network error. Check your connection and try again.',
      retryFailed: 'Failed to resend the application. Please try again.',
      retryNetworkFailed: 'Network error during retry.',
      paymentLinkUnavailable: 'Payment link is temporarily unavailable. Please try later.',
      installmentLinkUnavailable: 'Installment payment link is temporarily unavailable. Please try later.',
    },
    unsupportedPlan: 'This payment format is available only for Starter, Core, and Individual plans.',
    proceedToCheckout: 'Continue to checkout',
    proceedToPayment: 'Proceed to payment',
    paymentOptionRubFullTitle: 'Pay with RU card',
    paymentOptionRubFullSubtitle: 'One-time payment in RUB',
    paymentOptionInstallmentTitle: 'Installment payment',
    paymentOptionInstallmentSubtitle: 'Monthly payment',
    paymentOptionEurTitle: 'Foreign bank card (EUR)',
    paymentOptionEurSubtitle: 'Bank transfer by invoice in EUR',
    fromLabel: 'from',
    installmentAmountPrefix: 'x',
    accessNotePrefix: 'Access for 6 months. Plan',
    acceptOfferPrefix: 'I accept the',
    acceptOfferLink: 'public offer terms',
    mentorshipHeading: 'Personal preparation format',
    fillDetails: 'Fill in your details',
    labelName: 'Name',
    placeholderName: 'Your name',
    labelPhone: 'Phone',
    placeholderPhone: '+39 333 123 45 67',
    consentPersonalDataPrefix: 'I consent to processing of',
    consentPersonalDataLink: 'personal data',
    mentorshipSubmitIdle: 'Book consultation',
    mentorshipSubmitLoading: 'Saving...',
    mentorshipLegalPrefix: 'By clicking “Book consultation”, you confirm that you have read the',
    privacyPolicyLink: 'Privacy Policy',
    contactTelegram: 'Or contact us via Telegram',
    writeButton: 'Write',
    invoicePageTitle: 'Pay in EUR. Bank transfer.',
    invoicePageTitlePrepayment: 'EUR prepayment. Bank transfer.',
    eurTariffPrefix: 'Plan',
    eurTariffInfo: 'We will send a contract and invoice with bank transfer details to our company account.',
    eurTariffInfoPrepayment: 'We will send an invoice for the EUR deposit. The remaining balance is paid later after confirming the final plan.',
    promoLabel: 'Promo code',
    promoPlaceholder: 'Enter promo code',
    promoApply: 'Apply',
    promoRemove: 'Remove',
    promoApplied: 'Promo code applied',
    promoInvalid: 'Promo code is invalid',
    summarySelectedPlan: 'Selected plan',
    summaryPrepaymentLabel: 'Prepayment',
    summaryBasePrice: 'Base price',
    summaryDiscount: 'Discount',
    summaryTotal: 'Total',
    labelFullName: 'First and last name',
    contractHeading: 'For contract details',
    labelCountry: 'Country',
    labelCity: 'City',
    labelPostalCode: 'Postal code',
    labelAddress: 'Address',
    consentShortPrefix: 'I agree to processing of',
    submitApplication: 'Submit application',
    submitLegalPrefix: 'By clicking “Submit application”, you confirm that you have read the',
    successTitle: 'Thank you, your application was received',
    successDescription: 'We will contact you within one business day to confirm the next steps.',
    orderNumber: 'Order number:',
    close: 'Close',
    back: 'Back',
    support: 'Contact support',
    retry: 'Retry sending',
  },
  ru: {
    mentorshipPoints: [
      'Определим цели поступления',
      'Обсудим план обучения',
      'Покажем, как устроена школа',
      'Ответим на все вопросы',
    ],
    modalTitleCurrency: 'Выберите способ оплаты',
    modalTitleLeadFormMentorship: 'Заявка на тариф «Индивидуальный»',
    modalTitleLeadFormEur: 'Оплата в евро',
    modalTitleSuccess: 'Заявка отправлена',
    errors: {
      firstName: 'Введите имя (минимум 2 символа).',
      fullName: 'Введите имя и фамилию (минимум два слова).',
      fullNameLatin: 'Имя и фамилия должны быть латиницей.',
      email: 'Введите корректный email.',
      phone: 'Введите номер телефона в международном формате.',
      countryLatin: 'Укажите страну латиницей.',
      cityLatin: 'Укажите город латиницей.',
      postalCodeLatin: 'Укажите индекс латиницей и цифрами (например, 20121 или SW1A 1AA).',
      addressLatin: 'Укажите адрес латиницей.',
      countryRequired: 'Укажите страну.',
      cityRequired: 'Укажите город.',
      postalCodeRequired: 'Укажите почтовый индекс.',
      addressRequired: 'Укажите адрес.',
      consentPersonalData: 'Нужно согласие на обработку персональных данных.',
      consentOffer: 'Чтобы продолжить, примите условия публичной оферты.',
      submitFailed: 'Не удалось отправить заявку. Попробуйте ещё раз.',
      submitNetworkFailed: 'Ошибка сети. Проверьте соединение и повторите отправку.',
      retryFailed: 'Не удалось повторно отправить заявку. Попробуйте ещё раз.',
      retryNetworkFailed: 'Ошибка сети при повторной отправке.',
      paymentLinkUnavailable: 'Ссылка на оплату временно недоступна. Попробуйте позже.',
      installmentLinkUnavailable: 'Ссылка на оплату в рассрочку временно недоступна. Попробуйте позже.',
    },
    unsupportedPlan: 'Оплата в этом формате доступна только для тарифов Стартовый, Основной и Индивидуальный.',
    proceedToCheckout: 'Перейти к оформлению',
    proceedToPayment: 'Перейти к оплате',
    paymentOptionRubFullTitle: 'Оплата картой РФ',
    paymentOptionRubFullSubtitle: 'Один платеж в рублях',
    paymentOptionInstallmentTitle: 'Оплата частями',
    paymentOptionInstallmentSubtitle: 'Ежемесячный платёж',
    paymentOptionEurTitle: 'Карты зарубежного банка (EUR)',
    paymentOptionEurSubtitle: 'Перевод по реквизитам в евро',
    fromLabel: 'от',
    installmentAmountPrefix: 'х',
    accessNotePrefix: 'Доступ на 6 месяцев. Тариф',
    acceptOfferPrefix: 'Принимаю условия',
    acceptOfferLink: 'публичной оферты',
    mentorshipHeading: 'Персональный формат подготовки',
    fillDetails: 'Заполните данные',
    labelName: 'Имя',
    placeholderName: 'Ваше имя',
    labelPhone: 'Телефон',
    placeholderPhone: '+7 999 123 45 67',
    consentPersonalDataPrefix: 'Даю согласие на обработку',
    consentPersonalDataLink: 'персональных данных',
    mentorshipSubmitIdle: 'Записаться на консультацию',
    mentorshipSubmitLoading: 'Сохраняем...',
    mentorshipLegalPrefix: 'Нажимая «Записаться на консультацию», вы подтверждаете ознакомление с',
    privacyPolicyLink: 'Политикой обработки персональных данных',
    contactTelegram: 'Или свяжитесь с нами в Telegram',
    writeButton: 'Написать',
    invoicePageTitle: 'Оплата в евро. Банковский перевод.',
    invoicePageTitlePrepayment: 'Предоплата в евро. Банковский перевод.',
    eurTariffPrefix: 'Тариф',
    eurTariffInfo: 'Мы отправим договор и инвойс с реквизитами для банковского перевода на счет нашей компании.',
    eurTariffInfoPrepayment: 'Мы отправим инвойс на предоплату в EUR. Остаток вы оплатите позже после подтверждения финального тарифа.',
    promoLabel: 'Промокод',
    promoPlaceholder: 'Введите промокод',
    promoApply: 'Применить',
    promoRemove: 'Удалить',
    promoApplied: 'Промокод применен',
    promoInvalid: 'Промокод недействителен',
    summarySelectedPlan: 'Выбранный тариф',
    summaryPrepaymentLabel: 'Предоплата',
    summaryBasePrice: 'Базовая цена',
    summaryDiscount: 'Скидка',
    summaryTotal: 'Итого',
    labelFullName: 'Имя и фамилия',
    contractHeading: 'Адрес для выставления счета',
    labelCountry: 'Страна',
    labelCity: 'Город',
    labelPostalCode: 'Индекс',
    labelAddress: 'Адрес',
    consentShortPrefix: 'Согласен на обработку',
    submitApplication: 'Отправить заявку',
    submitLegalPrefix: 'Нажимая «Отправить заявку», вы подтверждаете ознакомление с',
    successTitle: 'Спасибо, заявка получена',
    successDescription: 'Свяжемся с вами в течение рабочего дня, чтобы согласовать следующие шаги.',
    orderNumber: 'Номер заказа:',
    close: 'Закрыть',
    back: 'Назад',
    support: 'Написать в поддержку',
    retry: 'Повторить отправку',
  },
} as const;

export type EurPlanId = 'foundation' | 'advanced' | 'mentorship';

export const isEurPlanId = (value: string | null): value is EurPlanId =>
  value === 'foundation' || value === 'advanced' || value === 'mentorship';

export const normalizeWhitespace = (value: string) => value.trim().replace(/\s+/g, ' ');

export const parseOrderNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;

const isLatinTextValue = (value: string): boolean => {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return false;
  }

  return normalized.split(' ').every((token) => LATIN_TEXT_TOKEN_REGEX.test(token));
};

export const parseFullName = (value: string): { firstName: string; lastName: string } | null => {
  const normalized = normalizeWhitespace(value);

  if (!normalized) {
    return null;
  }

  const parts = normalized.split(' ');

  if (parts.length < 2) {
    return null;
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
};

export const normalizePhoneToE164 = (rawPhone: string): string | null => {
  const trimmed = rawPhone.trim();

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

    const internationalNumber = `+${digits}`;
    return E164_PHONE_REGEX.test(internationalNumber) ? internationalNumber : null;
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
};

export const getTextFieldFormatError = (
  field: LeadTextField,
  rawValue: string,
  locale: PricingLocale
): string => {
  const t = PRICING_MODAL_TEXT[locale];
  const normalized = normalizeWhitespace(rawValue);
  if (!normalized) {
    return '';
  }

  if (field === 'firstName') {
    if (normalized.length < 2) {
      return t.errors.firstName;
    }
    return '';
  }

  if (field === 'fullName') {
    if (!parseFullName(normalized)) {
      return t.errors.fullName;
    }
    return isLatinTextValue(normalized) ? '' : t.errors.fullNameLatin;
  }

  if (field === 'email') {
    return EMAIL_REGEX.test(normalized) ? '' : t.errors.email;
  }

  if (field === 'phone') {
    return normalizePhoneToE164(rawValue) ? '' : t.errors.phone;
  }

  if (field === 'contractCountry') {
    return isLatinTextValue(normalized) ? '' : t.errors.countryLatin;
  }

  if (field === 'contractCity') {
    return isLatinTextValue(normalized) ? '' : t.errors.cityLatin;
  }

  if (field === 'contractPostalCode') {
    return POSTAL_CODE_REGEX.test(normalized)
      ? ''
      : t.errors.postalCodeLatin;
  }

  if (
    !LATIN_ADDRESS_REGEX.test(normalized) ||
    !HAS_LATIN_LETTER_REGEX.test(normalized)
  ) {
    return t.errors.addressLatin;
  }

  return '';
};

export const validateEurLeadForm = (
  leadForm: LeadFormState,
  locale: PricingLocale
): LeadFormValidationResult => {
  const t = PRICING_MODAL_TEXT[locale];
  const nextErrors: Record<string, string> = {};
  const normalizedPhone = normalizePhoneToE164(leadForm.phone);
  const normalizedFullName = normalizeWhitespace(leadForm.fullName);
  const normalizedCountry = normalizeWhitespace(leadForm.contractCountry);
  const normalizedCity = normalizeWhitespace(leadForm.contractCity);
  const normalizedPostalCode = normalizeWhitespace(leadForm.contractPostalCode);
  const normalizedAddress = normalizeWhitespace(leadForm.contractAddress);
  const parsedFullName = parseFullName(normalizedFullName);

  if (!parsedFullName) {
    nextErrors.fullName = t.errors.fullName;
  } else if (!isLatinTextValue(normalizedFullName)) {
    nextErrors.fullName = t.errors.fullNameLatin;
  }

  if (!EMAIL_REGEX.test(leadForm.email.trim())) {
    nextErrors.email = t.errors.email;
  }

  if (!normalizedPhone) {
    nextErrors.phone = t.errors.phone;
  }

  if (!normalizedCountry) {
    nextErrors.contractCountry = t.errors.countryRequired;
  } else if (!isLatinTextValue(normalizedCountry)) {
    nextErrors.contractCountry = t.errors.countryLatin;
  }

  if (!normalizedCity) {
    nextErrors.contractCity = t.errors.cityRequired;
  } else if (!isLatinTextValue(normalizedCity)) {
    nextErrors.contractCity = t.errors.cityLatin;
  }

  if (!normalizedPostalCode) {
    nextErrors.contractPostalCode = t.errors.postalCodeRequired;
  } else if (!POSTAL_CODE_REGEX.test(normalizedPostalCode)) {
    nextErrors.contractPostalCode = t.errors.postalCodeLatin;
  }

  if (!normalizedAddress) {
    nextErrors.contractAddress = t.errors.addressRequired;
  } else if (
    !LATIN_ADDRESS_REGEX.test(normalizedAddress) ||
    !HAS_LATIN_LETTER_REGEX.test(normalizedAddress)
  ) {
    nextErrors.contractAddress = t.errors.addressLatin;
  }

  if (!leadForm.consentPersonalData) {
    nextErrors.consentPersonalData = t.errors.consentPersonalData;
  }

  if (!leadForm.consentOffer) {
    nextErrors.consentOffer = t.errors.consentOffer;
  }

  return {
    errors: nextErrors,
    normalizedPhone,
    parsedFullName,
  };
};

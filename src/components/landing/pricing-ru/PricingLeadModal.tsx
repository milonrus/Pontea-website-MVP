"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  CheckCircle2,
  CircleAlert,
  ArrowRight,
  User,
  Phone,
} from 'lucide-react';
import Button from '@/components/shared/Button';
import Modal from '@/components/shared/Modal';
import { getOptionalPublicEnv, getRequiredPublicEnv } from '@/lib/env/public';
import { getPricingPrimaryCtaLabel } from './data';
import { PricingLocale, RuPricingPlan } from './types';

type ModalStep = 'currency' | 'lead_form' | 'success';
type PaymentOptionId = 'rub_full' | 'rub_installment' | 'eur';

interface PricingLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: RuPricingPlan | null;
  locale?: PricingLocale;
}

interface LeadFormState {
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

interface LeadFormValidationResult {
  errors: Record<string, string>;
  normalizedPhone: string | null;
  parsedFullName: {
    firstName: string;
    lastName: string;
  } | null;
}

type LeadTextField =
  | 'firstName'
  | 'fullName'
  | 'email'
  | 'phone'
  | 'contractCountry'
  | 'contractCity'
  | 'contractPostalCode'
  | 'contractAddress';

const DEFAULT_LEAD_FORM: LeadFormState = {
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

const RUB_PAYMENT_URL_BY_PLAN: Record<'foundation' | 'advanced', string> = {
  foundation: getRequiredPublicEnv('NEXT_PUBLIC_RUB_PAYMENT_URL_FOUNDATION'),
  advanced: getRequiredPublicEnv('NEXT_PUBLIC_RUB_PAYMENT_URL_ADVANCED'),
};
const SUPPORT_TELEGRAM_URL = getRequiredPublicEnv('NEXT_PUBLIC_SUPPORT_TELEGRAM_URL');

const RUB_INSTALLMENT_PAYMENT_URL_BY_PLAN: Record<'foundation' | 'advanced', string | undefined> = {
  foundation: getOptionalPublicEnv('NEXT_PUBLIC_RUB_PAYMENT_URL_FOUNDATION_INSTALLMENT'),
  advanced: getOptionalPublicEnv('NEXT_PUBLIC_RUB_PAYMENT_URL_ADVANCED_INSTALLMENT'),
};

const RUB_FULL_PRICE_BY_PLAN: Record<'foundation' | 'advanced', number> = {
  foundation: 82_000,
  advanced: 137_000,
};

const RUB_INSTALLMENT_TOTAL_BY_PLAN: Record<'foundation' | 'advanced', number> = {
  foundation: 89_000,
  advanced: 149_000,
};

const INSTALLMENT_MONTHS = 6;

const formatRubAmount = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;

const eurFieldClassName =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[15px] leading-5 text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/20';

const eurLabelClassName = 'block text-xs font-semibold uppercase tracking-wide text-slate-500';

const errorClassName = 'mt-1 text-xs font-medium text-red-600';
const mentorshipLabelClassName = 'text-[11px] font-semibold text-gray-500 uppercase tracking-wide';
const mentorshipFieldClassName =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/20';
const mentorshipErrorClassName = 'mt-1 text-xs text-red-500';

const PRICING_MODAL_TEXT = {
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
    unsupportedPlan: 'This payment format is available only for Starter and Core plans.',
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
    eurTariffPrefix: 'Plan',
    eurTariffInfo: 'We will send a contract and invoice with bank transfer details to our company account.',
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
    unsupportedPlan: 'Оплата в этом формате доступна только для тарифов Стартовый и Основной.',
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
    eurTariffPrefix: 'Тариф',
    eurTariffInfo: 'Мы отправим договор и инвойс с реквизитами для банковского перевода на счет нашей компании.',
    labelFullName: 'Имя и фамилия',
    contractHeading: 'Для оформления договора',
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

const normalizeWhitespace = (value: string) => value.trim().replace(/\s+/g, ' ');
const parseOrderNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;

const isLatinTextValue = (value: string): boolean => {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return false;
  }

  return normalized.split(' ').every((token) => LATIN_TEXT_TOKEN_REGEX.test(token));
};

const parseFullName = (value: string): { firstName: string; lastName: string } | null => {
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

const normalizePhoneToE164 = (rawPhone: string): string | null => {
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

const getTextFieldFormatError = (
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

const PricingLeadModal: React.FC<PricingLeadModalProps> = ({
  isOpen,
  onClose,
  plan,
  locale = 'ru',
}) => {
  const [step, setStep] = useState<ModalStep>('currency');
  const [leadForm, setLeadForm] = useState<LeadFormState>(DEFAULT_LEAD_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [retryLeadId, setRetryLeadId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<PaymentOptionId | null>(null);
  const t = PRICING_MODAL_TEXT[locale];
  const localePrefix = locale === 'en' ? '' : '/ru';
  const localeHome = locale === 'en' ? '/' : '/ru/';

  const isMentorship = plan?.id === 'mentorship';

  const ctaLabel = useMemo(() => {
    if (!plan) {
      return '';
    }

    return getPricingPrimaryCtaLabel(locale, plan.id);
  }, [plan, locale]);

  useEffect(() => {
    if (!isOpen || !plan) {
      return;
    }

    setStep(plan.id === 'mentorship' ? 'lead_form' : 'currency');
    setLeadForm(DEFAULT_LEAD_FORM);
    setErrors({});
    setApiError(null);
    setRetryLeadId(null);
    setOrderNumber(null);
    setIsSubmitting(false);
    setIsRetrying(false);
    setSelectedPaymentOption(null);
  }, [isOpen, plan?.id]);

  if (!plan) {
    return null;
  }

  const modalTitleByStep: Record<ModalStep, string> = {
    currency: t.modalTitleCurrency,
    lead_form: isMentorship ? t.modalTitleLeadFormMentorship : t.modalTitleLeadFormEur,
    success: t.modalTitleSuccess,
  };

  const getTrackingContext = () => {
    if (typeof window === 'undefined') {
      return {
        pagePath: localeHome,
        referrer: undefined as string | undefined,
        utmSource: undefined as string | undefined,
        utmMedium: undefined as string | undefined,
        utmCampaign: undefined as string | undefined,
        utmTerm: undefined as string | undefined,
        utmContent: undefined as string | undefined,
      };
    }

    const params = new URLSearchParams(window.location.search);

    return {
      pagePath: window.location.pathname,
      referrer: document.referrer || undefined,
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
      utmTerm: params.get('utm_term') || undefined,
      utmContent: params.get('utm_content') || undefined,
    };
  };

  const closeWithReset = () => {
    setErrors({});
    setApiError(null);
    setRetryLeadId(null);
    setOrderNumber(null);
    onClose();
  };

  const setConsentValidationState = (
    field: 'consentPersonalData' | 'consentOffer',
    isChecked: boolean
  ) => {
    const messageByField: Record<'consentPersonalData' | 'consentOffer', string> = {
      consentPersonalData: t.errors.consentPersonalData,
      consentOffer: t.errors.consentOffer,
    };

    setErrors((prev) => {
      const next = { ...prev };
      if (isChecked) {
        delete next[field];
      } else {
        next[field] = messageByField[field];
      }
      return next;
    });
  };

  const handleTextFieldBlur = (field: LeadTextField, value: string) => {
    const formatError = getTextFieldFormatError(field, value, locale);
    setErrors((prev) => {
      const next = { ...prev };
      if (formatError) {
        next[field] = formatError;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const validateLeadForm = (): LeadFormValidationResult => {
    const nextErrors: Record<string, string> = {};
    const normalizedPhone = normalizePhoneToE164(leadForm.phone);
    const normalizedFirstName = normalizeWhitespace(leadForm.firstName);
    const normalizedFullName = normalizeWhitespace(leadForm.fullName);
    const normalizedCountry = normalizeWhitespace(leadForm.contractCountry);
    const normalizedCity = normalizeWhitespace(leadForm.contractCity);
    const normalizedPostalCode = normalizeWhitespace(leadForm.contractPostalCode);
    const normalizedAddress = normalizeWhitespace(leadForm.contractAddress);

    if (isMentorship) {
      if (!normalizedFirstName || normalizedFirstName.length < 2) {
        nextErrors.firstName = t.errors.firstName;
      }

      if (!normalizedPhone) {
        nextErrors.phone = t.errors.phone;
      }

      if (!leadForm.consentPersonalData) {
        nextErrors.consentPersonalData = t.errors.consentPersonalData;
      }

      return {
        errors: nextErrors,
        normalizedPhone,
        parsedFullName: null,
      };
    }

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

  const submitLeadApplication = async (event: React.FormEvent) => {
    event.preventDefault();
    setApiError(null);
    setRetryLeadId(null);
    setOrderNumber(null);

    const validation = validateLeadForm();
    setErrors(validation.errors);

    if (Object.keys(validation.errors).length > 0 || !validation.normalizedPhone) {
      return;
    }

    const tracking = getTrackingContext();

    const leadType = isMentorship ? 'mentorship_application' : 'eur_application';
    const currency = isMentorship ? null : 'EUR';
    const firstName = isMentorship
      ? leadForm.firstName.trim()
      : validation.parsedFullName?.firstName || '';
    const lastName = isMentorship
      ? undefined
      : validation.parsedFullName?.lastName || '';

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/pricing-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadType,
          planId: plan.id,
          currency,
          firstName,
          lastName,
          email: isMentorship ? undefined : leadForm.email.trim(),
          phone: validation.normalizedPhone,
          payerType: isMentorship ? undefined : 'individual',
          messengerType: undefined,
          messengerHandle: undefined,
          comment: undefined,
          contractCountry: isMentorship ? undefined : leadForm.contractCountry.trim(),
          contractCity: isMentorship ? undefined : leadForm.contractCity.trim(),
          contractPostalCode: isMentorship ? undefined : leadForm.contractPostalCode.trim(),
          contractAddress: isMentorship ? undefined : leadForm.contractAddress.trim(),
          consentOffer: isMentorship ? false : leadForm.consentOffer,
          consentPersonalData: leadForm.consentPersonalData,
          consentMarketing: false,
          ctaLabel,
          ...tracking,
        }),
      });

      const data = await response.json().catch(() => null);
      const nextOrderNumber = parseOrderNumber(data?.orderNumber);
      if (nextOrderNumber !== null) {
        setOrderNumber(nextOrderNumber);
      }

      if (!response.ok) {
        setApiError(data?.error || t.errors.submitFailed);
        setRetryLeadId(typeof data?.leadId === 'string' ? data.leadId : null);
        return;
      }

      setStep('success');
      setRetryLeadId(null);
      setErrors({});
    } catch (error) {
      console.error('Lead submit failed:', error);
      setApiError(t.errors.submitNetworkFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const retryWebhook = async () => {
    if (!retryLeadId) {
      return;
    }

    setApiError(null);
    setIsRetrying(true);

    try {
      const response = await fetch('/api/pricing-leads/retry-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: retryLeadId,
        }),
      });

      const data = await response.json().catch(() => null);
      const nextOrderNumber = parseOrderNumber(data?.orderNumber);
      if (nextOrderNumber !== null) {
        setOrderNumber(nextOrderNumber);
      }

      if (!response.ok) {
        setApiError(data?.error || t.errors.retryFailed);
        return;
      }

      setStep('success');
      setRetryLeadId(null);
    } catch (error) {
      console.error('Webhook retry failed:', error);
      setApiError(t.errors.retryNetworkFailed);
    } finally {
      setIsRetrying(false);
    }
  };

  const ensureOfferConsent = () => {
    if (leadForm.consentOffer) {
      setErrors((prev) => {
        if (!prev.consentOffer) {
          return prev;
        }

        const rest = { ...prev };
        delete rest.consentOffer;
        return rest;
      });
      return true;
    }

    setErrors((prev) => ({
      ...prev,
      consentOffer: t.errors.consentOffer,
    }));
    return false;
  };

  const renderCurrencyStep = () => {
    if (plan.id !== 'foundation' && plan.id !== 'advanced') {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {t.unsupportedPlan}
        </div>
      );
    }

    const rubFullPrice = RUB_FULL_PRICE_BY_PLAN[plan.id];
    const rubInstallmentTotal = RUB_INSTALLMENT_TOTAL_BY_PLAN[plan.id];
    const rubInstallmentMonthly = Math.round(
      rubInstallmentTotal / INSTALLMENT_MONTHS
    );

    const hasSelectedPaymentOption = selectedPaymentOption !== null;
    const shouldShowOfferConsent =
      hasSelectedPaymentOption && selectedPaymentOption !== 'eur';
    const actionButtonLabel =
      selectedPaymentOption === 'eur' ? t.proceedToCheckout : t.proceedToPayment;

    const clearOfferConsentError = () => {
      setErrors((prev) => {
        if (!prev.consentOffer) {
          return prev;
        }

        const rest = { ...prev };
        delete rest.consentOffer;
        return rest;
      });
    };

    const handleConfirmPaymentMethod = () => {
      setApiError(null);

      if (!selectedPaymentOption) {
        return;
      }

      if (selectedPaymentOption !== 'eur' && !ensureOfferConsent()) {
        return;
      }

      if (selectedPaymentOption === 'rub_full') {
        const paymentUrl = RUB_PAYMENT_URL_BY_PLAN[plan.id];

        if (!paymentUrl) {
          setApiError(t.errors.paymentLinkUnavailable);
          return;
        }

        window.location.assign(paymentUrl);
        return;
      }

      if (selectedPaymentOption === 'rub_installment') {
        const paymentUrl = RUB_INSTALLMENT_PAYMENT_URL_BY_PLAN[plan.id];

        if (!paymentUrl) {
          setApiError(t.errors.installmentLinkUnavailable);
          return;
        }

        window.location.assign(paymentUrl);
        return;
      }

      setStep('lead_form');
      setErrors({});
    };

    type PaymentOption = {
      id: PaymentOptionId;
      amount: string;
      title: string;
      subtitle?: string;
      amountHint?: string;
    };

    const formatEurAmount = (value: number) =>
      new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'ru-RU', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);

    const paymentOptionsById: Record<PaymentOptionId, PaymentOption> = {
      rub_full: {
        id: 'rub_full',
        amount: formatRubAmount(rubFullPrice),
        title: t.paymentOptionRubFullTitle,
        subtitle: t.paymentOptionRubFullSubtitle,
      },
      rub_installment: {
        id: 'rub_installment',
        amount: `${t.fromLabel} ${formatRubAmount(rubInstallmentMonthly)}`,
        amountHint: `${t.installmentAmountPrefix} ${INSTALLMENT_MONTHS} = ${formatRubAmount(rubInstallmentTotal)}`,
        title: t.paymentOptionInstallmentTitle,
        subtitle: t.paymentOptionInstallmentSubtitle,
      },
      eur: {
        id: 'eur',
        amount: `€${formatEurAmount(plan.price)}`,
        title: t.paymentOptionEurTitle,
        subtitle: t.paymentOptionEurSubtitle,
      },
    };

    const paymentOptionOrder: PaymentOptionId[] = locale === 'en'
      ? ['eur', 'rub_full', 'rub_installment']
      : ['rub_full', 'rub_installment', 'eur'];

    const paymentOptions: PaymentOption[] = paymentOptionOrder.map(
      (id) => paymentOptionsById[id]
    );

    const accessNote = `${t.accessNotePrefix} ${plan.name}.`;

    const submitCurrencyStep = (event: React.FormEvent) => {
      event.preventDefault();
      handleConfirmPaymentMethod();
    };

    return (
      <form onSubmit={submitCurrencyStep} className="space-y-3">
        <p className="text-base font-semibold leading-snug text-primary sm:text-lg">
          {accessNote}
        </p>

        <div className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {paymentOptions.map((option) => {
            const isSelected = selectedPaymentOption === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setSelectedPaymentOption(option.id);
                  setApiError(null);
                  clearOfferConsentError();
                }}
                className={`w-full px-3.5 py-3 text-left transition-colors sm:px-4 sm:py-3.5 ${
                  isSelected ? 'bg-gray-50' : 'bg-white hover:bg-gray-50/70'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      isSelected ? 'border-gray-900' : 'border-gray-300'
                    }`}
                  >
                    {isSelected ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-gray-900" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-base font-medium text-gray-900 sm:text-lg">{option.title}</div>
                        {option.subtitle ? (
                          <p className="mt-1 text-sm text-gray-500">{option.subtitle}</p>
                        ) : null}
                      </div>

                      <div className="text-left sm:self-center sm:text-right">
                        <div className="text-2xl font-medium leading-none text-gray-900 tabular-nums">
                          {option.amount}
                        </div>
                        {option.amountHint ? (
                          <div className="mt-1 text-xs text-gray-500">
                            {option.amountHint}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                </div>
              </button>
            );
          })}
        </div>

        <div className="px-0.5">
          <label
            aria-hidden={!shouldShowOfferConsent}
            className={`flex items-start gap-2.5 text-sm text-gray-700 transition-opacity ${
              shouldShowOfferConsent
                ? 'cursor-pointer opacity-100'
                : 'pointer-events-none opacity-0'
            }`}
          >
            <input
              type="checkbox"
              checked={leadForm.consentOffer}
              disabled={!shouldShowOfferConsent}
              onChange={(event) => {
                const isChecked = event.target.checked;
                setLeadForm((prev) => ({ ...prev, consentOffer: isChecked }));
                setConsentValidationState('consentOffer', isChecked);
                if (isChecked) {
                  clearOfferConsentError();
                  setApiError(null);
                }
              }}
              className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span>
              {t.acceptOfferPrefix}{' '}
              <a
                href={`${localePrefix}/legal/terms/`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline underline-offset-2"
              >
                {t.acceptOfferLink}
              </a>
            </span>
          </label>
          {shouldShowOfferConsent && errors.consentOffer ? (
            <p className={errorClassName}>{errors.consentOffer}</p>
          ) : null}
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="md"
            disabled={!hasSelectedPaymentOption}
            className={
              !hasSelectedPaymentOption
                ? '!bg-gray-300 !text-gray-500 hover:!bg-gray-300 focus:!ring-gray-300'
                : ''
            }
          >
            {actionButtonLabel}
          </Button>
        </div>
      </form>
    );
  };

  const renderLeadStep = () => (
    <form onSubmit={submitLeadApplication} className="space-y-4">
      {isMentorship ? (
        <div className="overflow-hidden rounded-2xl bg-white md:-m-5 md:grid md:grid-cols-[1.03fr_0.97fr]">
          <section className="bg-gray-50 px-4 py-5 sm:px-6 sm:py-6 md:px-7 md:py-7">
            <h4 className="max-w-[16ch] text-4xl font-display font-bold leading-[0.95] text-primary sm:text-5xl">
              {t.mentorshipHeading}
            </h4>

            <ul className="mt-8 border-y border-gray-200">
              {t.mentorshipPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 border-b border-gray-200 py-3 text-lg leading-snug text-gray-700 last:border-b-0"
                >
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="border-t border-gray-100 bg-brand-purple/25 px-4 py-5 sm:px-6 sm:py-6 md:border-l md:border-t-0 md:px-7 md:py-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/70">
              {t.fillDetails}
            </p>

            <div className="mt-6 space-y-4">
              <div className="space-y-1">
                <label htmlFor="lead-first-name" className={mentorshipLabelClassName}>
                  {t.labelName}
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="lead-first-name"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={leadForm.firstName}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, firstName: event.target.value }))}
                    onBlur={() => handleTextFieldBlur('firstName', leadForm.firstName)}
                    className={`${mentorshipFieldClassName} pl-10`}
                    placeholder={t.placeholderName}
                  />
                </div>
                {errors.firstName && <p className={mentorshipErrorClassName}>{errors.firstName}</p>}
              </div>

              <div className="space-y-1">
                <label htmlFor="lead-phone-mentorship" className={mentorshipLabelClassName}>
                  {t.labelPhone}
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="lead-phone-mentorship"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={leadForm.phone}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, phone: event.target.value }))}
                    onBlur={() => handleTextFieldBlur('phone', leadForm.phone)}
                    className={`${mentorshipFieldClassName} pl-10`}
                    placeholder={t.placeholderPhone}
                  />
                </div>
                {errors.phone && <p className={mentorshipErrorClassName}>{errors.phone}</p>}
              </div>
            </div>

            <div className="mt-5 space-y-1">
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={leadForm.consentPersonalData}
                  onChange={(event) => {
                    const isChecked = event.target.checked;
                    setLeadForm((prev) => ({ ...prev, consentPersonalData: isChecked }));
                    setConsentValidationState('consentPersonalData', isChecked);
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/30"
                />
                <span className="text-xs leading-snug text-slate-600">
                  {t.consentPersonalDataPrefix}{' '}
                  <a
                    href={`${localePrefix}/legal/consent/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-slate-400 underline-offset-2 text-slate-600"
                  >
                    {t.consentPersonalDataLink}
                  </a>
                </span>
              </label>
              {errors.consentPersonalData && (
                <p className={mentorshipErrorClassName}>{errors.consentPersonalData}</p>
              )}
            </div>

            <div className="mt-5 space-y-2">
              <Button
                type="submit"
                size="lg"
                fullWidth
                disabled={isSubmitting}
                className="group !py-3"
              >
                {isSubmitting ? t.mentorshipSubmitLoading : t.mentorshipSubmitIdle}
                {!isSubmitting && (
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                )}
              </Button>
              <p className="px-1 text-center text-[10px] leading-snug text-slate-500">
                {t.mentorshipLegalPrefix}{' '}
                <a
                  href={`${localePrefix}/legal/privacy/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-slate-300 underline-offset-2 text-slate-500"
                >
                  {t.privacyPolicyLink}
                </a>
                .
              </p>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-700 sm:text-base">
                  {t.contactTelegram}
                </p>
                <a
                  href={SUPPORT_TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg border-2 border-primary px-4 py-2 text-sm font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
                >
                  {t.writeButton}
                </a>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <>
          <div className="space-y-1">
            <p className="text-lg font-display font-bold text-primary">{t.eurTariffPrefix} {plan.name}. €{plan.price}</p>
            <p className="text-sm leading-snug text-slate-600">
              {t.eurTariffInfo}
            </p>
          </div>

          <div className="space-y-1">
            <label htmlFor="lead-full-name" className={eurLabelClassName}>
              {t.labelFullName}
            </label>
            <input
              id="lead-full-name"
              name="fullName"
              type="text"
              autoComplete="name"
              value={leadForm.fullName}
              onChange={(event) => setLeadForm((prev) => ({ ...prev, fullName: event.target.value }))}
              onBlur={() => handleTextFieldBlur('fullName', leadForm.fullName)}
              className={eurFieldClassName}
              placeholder="Ivan Ivanov"
            />
            {errors.fullName && <p className={errorClassName}>{errors.fullName}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="lead-phone-eur" className={eurLabelClassName}>
              {t.labelPhone}
            </label>
            <input
              id="lead-phone-eur"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={leadForm.phone}
              onChange={(event) => setLeadForm((prev) => ({ ...prev, phone: event.target.value }))}
              onBlur={() => handleTextFieldBlur('phone', leadForm.phone)}
              className={eurFieldClassName}
              placeholder={t.placeholderPhone}
            />
            {errors.phone && <p className={errorClassName}>{errors.phone}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="lead-email" className={eurLabelClassName}>
              Email
            </label>
            <input
              id="lead-email"
              name="email"
              type="email"
              autoComplete="email"
              value={leadForm.email}
              onChange={(event) => setLeadForm((prev) => ({ ...prev, email: event.target.value }))}
              onBlur={() => handleTextFieldBlur('email', leadForm.email)}
              className={eurFieldClassName}
              placeholder="name@example.com"
            />
            {errors.email && <p className={errorClassName}>{errors.email}</p>}
          </div>

          <h4 className="pt-1 text-lg font-display font-bold text-primary">{t.contractHeading}</h4>

          <div className="grid gap-2.5 sm:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="lead-contract-country" className={eurLabelClassName}>
                {t.labelCountry}
              </label>
              <input
                id="lead-contract-country"
                name="contractCountry"
                type="text"
                autoComplete="country-name"
                value={leadForm.contractCountry}
                onChange={(event) =>
                  setLeadForm((prev) => ({ ...prev, contractCountry: event.target.value }))
                }
                onBlur={() => handleTextFieldBlur('contractCountry', leadForm.contractCountry)}
                className={eurFieldClassName}
                placeholder="Italy"
              />
              {errors.contractCountry && <p className={errorClassName}>{errors.contractCountry}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="lead-contract-city" className={eurLabelClassName}>
                {t.labelCity}
              </label>
              <input
                id="lead-contract-city"
                name="contractCity"
                type="text"
                autoComplete="address-level2"
                value={leadForm.contractCity}
                onChange={(event) => setLeadForm((prev) => ({ ...prev, contractCity: event.target.value }))}
                onBlur={() => handleTextFieldBlur('contractCity', leadForm.contractCity)}
                className={eurFieldClassName}
                placeholder="Milan"
              />
              {errors.contractCity && <p className={errorClassName}>{errors.contractCity}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="lead-contract-postal-code" className={eurLabelClassName}>
                {t.labelPostalCode}
              </label>
              <input
                id="lead-contract-postal-code"
                name="contractPostalCode"
                type="text"
                autoComplete="postal-code"
                value={leadForm.contractPostalCode}
                onChange={(event) =>
                  setLeadForm((prev) => ({ ...prev, contractPostalCode: event.target.value }))
                }
                onBlur={() => handleTextFieldBlur('contractPostalCode', leadForm.contractPostalCode)}
                className={eurFieldClassName}
                placeholder="20121"
              />
              {errors.contractPostalCode && <p className={errorClassName}>{errors.contractPostalCode}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="lead-contract-address" className={eurLabelClassName}>
              {t.labelAddress}
            </label>
            <input
              id="lead-contract-address"
              name="contractAddress"
              type="text"
              autoComplete="street-address"
              value={leadForm.contractAddress}
              onChange={(event) => setLeadForm((prev) => ({ ...prev, contractAddress: event.target.value }))}
              onBlur={() => handleTextFieldBlur('contractAddress', leadForm.contractAddress)}
              className={eurFieldClassName}
              placeholder="Via Luigi Calamatta 22A"
            />
            {errors.contractAddress && <p className={errorClassName}>{errors.contractAddress}</p>}
          </div>

          <div className="space-y-2">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={leadForm.consentPersonalData}
                onChange={(event) => {
                  const isChecked = event.target.checked;
                  setLeadForm((prev) => ({ ...prev, consentPersonalData: isChecked }));
                  setConsentValidationState('consentPersonalData', isChecked);
                }}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/30"
              />
              <span className="text-[11px] leading-snug text-slate-600">
                {t.consentShortPrefix}{' '}
                <a
                  href={`${localePrefix}/legal/consent/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-slate-400 underline-offset-2 text-slate-600"
                >
                  {t.consentPersonalDataLink}
                </a>
              </span>
            </label>
            {errors.consentPersonalData && (
              <p className={errorClassName}>{errors.consentPersonalData}</p>
            )}

            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={leadForm.consentOffer}
                onChange={(event) => {
                  const isChecked = event.target.checked;
                  setLeadForm((prev) => ({ ...prev, consentOffer: isChecked }));
                  setConsentValidationState('consentOffer', isChecked);
                }}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/30"
              />
              <span className="text-[11px] leading-snug text-slate-600">
                {t.acceptOfferPrefix}{' '}
                <a
                  href={`${localePrefix}/legal/terms/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-slate-400 underline-offset-2 transition-colors hover:text-primary"
                >
                  {t.acceptOfferLink}
                </a>
              </span>
            </label>
            {errors.consentOffer && (
              <p className={errorClassName}>{errors.consentOffer}</p>
            )}
          </div>

          <div className="space-y-1 pt-0.5">
            <Button type="submit" size="md" fullWidth isLoading={isSubmitting} className="!py-2.5">
              {t.submitApplication}
            </Button>
            <p className="px-1 text-center text-[9px] leading-snug text-slate-500">
              {t.submitLegalPrefix}{' '}
              <a
                href={`${localePrefix}/legal/privacy/`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-slate-300 underline-offset-2 text-slate-500"
              >
                {t.privacyPolicyLink}
              </a>
              .
            </p>
          </div>
        </>
      )}
    </form>
  );

  const renderSuccessStep = () => (
    <div className="py-4 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <h4 className="mt-4 text-xl font-bold text-primary">{t.successTitle}</h4>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-600">
        {t.successDescription}
      </p>
      {orderNumber !== null ? (
        <div className="mx-auto mt-4 max-w-md rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <span className="font-semibold">{t.orderNumber}</span> {orderNumber}
        </div>
      ) : null}

      <div className="mt-5">
        <Button onClick={closeWithReset} fullWidth size="sm">
          {t.close}
        </Button>
      </div>
    </div>
  );

  const showSupportAction = step === 'currency' || (step === 'lead_form' && !isMentorship);
  const showBackAction = step === 'lead_form' && !isMentorship;
  const isMentorshipLeadStep = isMentorship && step === 'lead_form';

  const handleBackToCurrency = () => {
    setStep('currency');
    setApiError(null);
    setErrors({});
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeWithReset}
      title={modalTitleByStep[step]}
      maxWidth={isMentorshipLeadStep ? 'max-w-6xl' : 'max-w-xl'}
      viewportPaddingClassName="p-4 sm:p-5"
      panelMaxHeightClassName="max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-2.5rem)]"
      headerLeading={
        showBackAction ? (
          <button
            type="button"
            onClick={handleBackToCurrency}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{t.back}</span>
          </button>
        ) : null
      }
      headerActions={
        showSupportAction ? (
          <a
            href={SUPPORT_TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            {t.support}
          </a>
        ) : null
      }
    >
      <div className="space-y-3 text-sm">
        {apiError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <div className="flex items-start gap-2 text-sm text-red-700">
              <CircleAlert className="mt-0.5 h-3.5 w-3.5 flex-none" />
              <span>{apiError}</span>
            </div>
            {orderNumber !== null ? (
              <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-900">
                <span className="font-semibold">{t.orderNumber}</span> {orderNumber}
              </div>
            ) : null}
            {retryLeadId && (
              <div className="mt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  isLoading={isRetrying}
                  onClick={retryWebhook}
                >
                  {t.retry}
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 'currency' && renderCurrencyStep()}
        {step === 'lead_form' && renderLeadStep()}
        {step === 'success' && renderSuccessStep()}
      </div>
    </Modal>
  );
};

export default PricingLeadModal;

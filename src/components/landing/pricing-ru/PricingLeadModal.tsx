"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CircleAlert,
} from 'lucide-react';
import Button from '@/components/shared/Button';
import Modal from '@/components/shared/Modal';
import {
  formatFullPriceLine,
  RU_PRICING_PRIMARY_CTA_LABEL_BY_PLAN,
} from './data';
import {
  MessengerType,
  PayerType,
  RuPricingCurrency,
  RuPricingPlan,
} from './types';

type ModalStep = 'currency' | 'lead_form' | 'success';
type PaymentOptionId = 'rub_full' | 'rub_installment' | 'eur';

interface PricingLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: RuPricingPlan | null;
}

interface LeadFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  payerType: PayerType;
  messengerType: MessengerType | '';
  messengerHandle: string;
  comment: string;
  consentOffer: boolean;
  consentPersonalData: boolean;
  consentMarketing: boolean;
}

const DEFAULT_LEAD_FORM: LeadFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '+7',
  payerType: 'individual',
  messengerType: '',
  messengerHandle: '',
  comment: '',
  consentOffer: false,
  consentPersonalData: false,
  consentMarketing: false,
};

const E164_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_RUB_PAYMENT_URL_FOUNDATION = 'https://payform.ru/b8aFIn1/';
const DEFAULT_RUB_PAYMENT_URL_ADVANCED = 'https://payform.ru/j2aFIb3/';
const DEFAULT_SUPPORT_TELEGRAM_URL = 'https://t.me/pontea_support_bot';

const RUB_PAYMENT_URL_BY_PLAN: Record<'foundation' | 'advanced', string | undefined> = {
  foundation: process.env.NEXT_PUBLIC_RUB_PAYMENT_URL_FOUNDATION || DEFAULT_RUB_PAYMENT_URL_FOUNDATION,
  advanced: process.env.NEXT_PUBLIC_RUB_PAYMENT_URL_ADVANCED || DEFAULT_RUB_PAYMENT_URL_ADVANCED,
};
const SUPPORT_TELEGRAM_URL =
  process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM_URL || DEFAULT_SUPPORT_TELEGRAM_URL;

const RUB_INSTALLMENT_PAYMENT_URL_BY_PLAN: Record<'foundation' | 'advanced', string | undefined> = {
  foundation: process.env.NEXT_PUBLIC_RUB_PAYMENT_URL_FOUNDATION_INSTALLMENT,
  advanced: process.env.NEXT_PUBLIC_RUB_PAYMENT_URL_ADVANCED_INSTALLMENT,
};

const RUB_FULL_PRICE_BY_PLAN: Record<'foundation' | 'advanced', number> = {
  foundation: 82_000,
  advanced: 137_000,
};

const RUB_INSTALLMENT_TOTAL_BY_PLAN: Record<'foundation' | 'advanced', number> = {
  foundation: 89_000,
  advanced: 149_000,
};

const INSTALLMENT_MONTHS = 4;

const formatRubAmount = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;

const fieldClassName =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20';

const errorClassName = 'mt-1 text-xs font-medium text-red-600';

const PricingLeadModal: React.FC<PricingLeadModalProps> = ({
  isOpen,
  onClose,
  plan,
}) => {
  const [step, setStep] = useState<ModalStep>('currency');
  const [selectedCurrency, setSelectedCurrency] = useState<RuPricingCurrency | null>(null);
  const [leadForm, setLeadForm] = useState<LeadFormState>(DEFAULT_LEAD_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [retryLeadId, setRetryLeadId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<PaymentOptionId>('rub_full');

  const isMentorship = plan?.id === 'mentorship';

  const ctaLabel = useMemo(() => {
    if (!plan) {
      return '';
    }

    return RU_PRICING_PRIMARY_CTA_LABEL_BY_PLAN[plan.id];
  }, [plan]);

  useEffect(() => {
    if (!isOpen || !plan) {
      return;
    }

    setStep(plan.id === 'mentorship' ? 'lead_form' : 'currency');
    setSelectedCurrency(null);
    setLeadForm(DEFAULT_LEAD_FORM);
    setErrors({});
    setApiError(null);
    setRetryLeadId(null);
    setIsSubmitting(false);
    setIsRetrying(false);
    setSelectedPaymentOption('rub_full');
  }, [isOpen, plan?.id]);

  if (!plan) {
    return null;
  }

  const modalTitleByStep: Record<ModalStep, string> = {
    currency: 'Выберите способ оплаты',
    lead_form: isMentorship ? 'Заявка на Mentorship' : 'Оплата в евро',
    success: 'Заявка отправлена',
  };

  const getTrackingContext = () => {
    if (typeof window === 'undefined') {
      return {
        pagePath: '/ru',
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
    onClose();
  };

  const validateLeadForm = (): Record<string, string> => {
    const nextErrors: Record<string, string> = {};

    if (!leadForm.firstName.trim() || leadForm.firstName.trim().length < 2) {
      nextErrors.firstName = 'Введите имя (минимум 2 символа).';
    }

    if (!E164_PHONE_REGEX.test(leadForm.phone.trim())) {
      nextErrors.phone = 'Введите номер в международном формате, например +79991234567.';
    }

    if (!isMentorship) {
      if (!leadForm.lastName.trim() || leadForm.lastName.trim().length < 2) {
        nextErrors.lastName = 'Введите фамилию (минимум 2 символа).';
      }

      if (!EMAIL_REGEX.test(leadForm.email.trim())) {
        nextErrors.email = 'Введите корректный email.';
      }

      if (!leadForm.consentPersonalData) {
        nextErrors.consentPersonalData = 'Нужно согласие на обработку персональных данных.';
      }

      if (leadForm.messengerHandle.trim() && !leadForm.messengerType) {
        nextErrors.messengerType = 'Выберите тип мессенджера или очистите поле handle.';
      }
    }

    return nextErrors;
  };

  const submitLeadApplication = async (event: React.FormEvent) => {
    event.preventDefault();
    setApiError(null);
    setRetryLeadId(null);

    if (!isMentorship && !leadForm.consentOffer) {
      setApiError('Подтвердите согласие с публичной офертой, чтобы продолжить.');
      setStep('currency');
      return;
    }

    const validationErrors = validateLeadForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const tracking = getTrackingContext();

    const leadType = isMentorship ? 'mentorship_application' : 'eur_application';
    const currency = isMentorship ? null : 'EUR';

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
          firstName: leadForm.firstName.trim(),
          lastName: isMentorship ? undefined : leadForm.lastName.trim(),
          email: isMentorship ? undefined : leadForm.email.trim(),
          phone: leadForm.phone.trim(),
          payerType: isMentorship ? undefined : leadForm.payerType,
          messengerType: isMentorship ? undefined : leadForm.messengerType || undefined,
          messengerHandle: isMentorship ? undefined : leadForm.messengerHandle.trim() || undefined,
          comment: isMentorship ? undefined : leadForm.comment.trim() || undefined,
          consentOffer: isMentorship ? false : leadForm.consentOffer,
          consentPersonalData: isMentorship ? true : leadForm.consentPersonalData,
          consentMarketing: isMentorship ? false : leadForm.consentMarketing,
          ctaLabel,
          ...tracking,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setApiError(data?.error || 'Не удалось отправить заявку. Попробуйте ещё раз.');
        setRetryLeadId(typeof data?.leadId === 'string' ? data.leadId : null);
        return;
      }

      setStep('success');
      setRetryLeadId(null);
      setErrors({});
    } catch (error) {
      console.error('Lead submit failed:', error);
      setApiError('Ошибка сети. Проверьте соединение и повторите отправку.');
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

      if (!response.ok) {
        setApiError(data?.error || 'Не удалось повторно отправить заявку. Попробуйте ещё раз.');
        return;
      }

      setStep('success');
      setRetryLeadId(null);
    } catch (error) {
      console.error('Webhook retry failed:', error);
      setApiError('Ошибка сети при повторной отправке.');
    } finally {
      setIsRetrying(false);
    }
  };

  const renderPlanPriceSummary = () => (
    <div className="rounded-xl border border-gray-200 bg-white p-3.5">
      <div className="text-sm font-semibold text-primary">{plan.name}</div>
      <div className="mt-1 text-sm text-gray-600">{formatFullPriceLine(plan.price, plan.priceRub)}</div>
    </div>
  );

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
      consentOffer: 'Чтобы продолжить, примите условия публичной оферты.',
    }));
    return false;
  };

  const renderCurrencyStep = () => {
    if (plan.id !== 'foundation' && plan.id !== 'advanced') {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Оплата в этом формате доступна только для тарифов Foundation и Advanced.
        </div>
      );
    }

    const rubFullPrice = RUB_FULL_PRICE_BY_PLAN[plan.id];
    const rubInstallmentTotal = RUB_INSTALLMENT_TOTAL_BY_PLAN[plan.id];
    const rubInstallmentMonthly = Math.round(
      rubInstallmentTotal / INSTALLMENT_MONTHS
    );

    const handleConfirmPaymentMethod = () => {
      setApiError(null);

      if (!ensureOfferConsent()) {
        return;
      }

      if (selectedPaymentOption === 'rub_full') {
        const paymentUrl = RUB_PAYMENT_URL_BY_PLAN[plan.id];

        if (!paymentUrl) {
          setApiError('Ссылка на оплату временно недоступна. Попробуйте позже.');
          return;
        }

        window.location.assign(paymentUrl);
        return;
      }

      if (selectedPaymentOption === 'rub_installment') {
        const paymentUrl = RUB_INSTALLMENT_PAYMENT_URL_BY_PLAN[plan.id];

        if (!paymentUrl) {
          setApiError('Ссылка на оплату в рассрочку временно недоступна. Попробуйте позже.');
          return;
        }

        window.location.assign(paymentUrl);
        return;
      }

      setSelectedCurrency('EUR');
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
      new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);

    const paymentOptions: PaymentOption[] = [
      {
        id: 'rub_full',
        amount: formatRubAmount(rubFullPrice),
        title: 'Оплата картой РФ',
        subtitle: 'Один платеж в рублях',
      },
      {
        id: 'rub_installment',
        amount: formatRubAmount(rubInstallmentMonthly),
        amountHint: `х ${INSTALLMENT_MONTHS} = ${formatRubAmount(rubInstallmentTotal)}`,
        title: `Рассрочка на ${INSTALLMENT_MONTHS} месяца`,
        subtitle: 'Ежемесячная оплата',
      },
      {
        id: 'eur',
        amount: `€${formatEurAmount(plan.price)}`,
        title: 'Банковский перевод (EUR)',
        subtitle: 'Перевод по реквизитам в евро',
      },
    ];

    const accessNote = `Доступ на 6 месяцев. Тариф ${plan.name}.`;

    const getActionLabel = () => {
      return 'Перейти к оплате';
    };

    return (
      <div className="space-y-3">
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
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={leadForm.consentOffer}
              onChange={(event) => {
                const isChecked = event.target.checked;
                setLeadForm((prev) => ({ ...prev, consentOffer: isChecked }));
                if (isChecked) {
                  setErrors((prev) => {
                    if (!prev.consentOffer) {
                      return prev;
                    }

                    const rest = { ...prev };
                    delete rest.consentOffer;
                    return rest;
                  });
                  setApiError(null);
                }
              }}
              className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span>
              Принимаю условия{' '}
              <a
                href="/ru/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline underline-offset-2"
              >
                публичной оферты
              </a>
            </span>
          </label>
          {errors.consentOffer && <p className={errorClassName}>{errors.consentOffer}</p>}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleConfirmPaymentMethod} size="sm">
            {getActionLabel()}
          </Button>
        </div>
      </div>
    );
  };

  const renderLeadStep = () => (
    <form onSubmit={submitLeadApplication} className="space-y-3">
      {!isMentorship ? (
        <>
          {renderPlanPriceSummary()}

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="text-sm font-semibold text-primary">{plan.name}</div>
            <div className="mt-1 text-sm text-gray-600">
              Оплата не списывается сейчас. После проверки данных отправим дальнейшие шаги.
            </div>
          </div>
        </>
      ) : null}

      {isMentorship ? (
        <>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Имя
              </label>
              <input
                type="text"
                value={leadForm.firstName}
                onChange={(event) => setLeadForm((prev) => ({ ...prev, firstName: event.target.value }))}
                className={fieldClassName}
                placeholder="Иван"
              />
              {errors.firstName && <p className={errorClassName}>{errors.firstName}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Номер телефона
              </label>
              <input
                type="tel"
                value={leadForm.phone}
                onChange={(event) => setLeadForm((prev) => ({ ...prev, phone: event.target.value }))}
                className={fieldClassName}
                placeholder="+79991234567"
              />
              {errors.phone && <p className={errorClassName}>{errors.phone}</p>}
            </div>
          </div>

          <Button type="submit" fullWidth size="sm" isLoading={isSubmitting}>
            Оставить заявку
          </Button>
        </>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Имя
              </label>
              <input
                type="text"
                value={leadForm.firstName}
                onChange={(event) => setLeadForm((prev) => ({ ...prev, firstName: event.target.value }))}
                className={fieldClassName}
                placeholder="Иван"
              />
              {errors.firstName && <p className={errorClassName}>{errors.firstName}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Фамилия
              </label>
              <input
                type="text"
                value={leadForm.lastName}
                onChange={(event) => setLeadForm((prev) => ({ ...prev, lastName: event.target.value }))}
                className={fieldClassName}
                placeholder="Иванов"
              />
              {errors.lastName && <p className={errorClassName}>{errors.lastName}</p>}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Email
              </label>
              <input
                type="email"
                value={leadForm.email}
                onChange={(event) => setLeadForm((prev) => ({ ...prev, email: event.target.value }))}
                className={fieldClassName}
                placeholder="name@example.com"
              />
              {errors.email && <p className={errorClassName}>{errors.email}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Телефон
              </label>
              <input
                type="tel"
                value={leadForm.phone}
                onChange={(event) => setLeadForm((prev) => ({ ...prev, phone: event.target.value }))}
                className={fieldClassName}
                placeholder="+79991234567"
              />
              {errors.phone && <p className={errorClassName}>{errors.phone}</p>}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Тип плательщика
              </label>
              <select
                value={leadForm.payerType}
                onChange={(event) =>
                  setLeadForm((prev) => ({ ...prev, payerType: event.target.value as PayerType }))
                }
                className={fieldClassName}
              >
                <option value="individual">Физлицо</option>
                <option value="legal_entity">Юрлицо</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Тариф
              </label>
              <input
                type="text"
                value={plan.name}
                readOnly
                className={`${fieldClassName} cursor-not-allowed bg-gray-100 text-gray-500`}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
              Валюта
            </label>
            <input
              type="text"
              value={selectedCurrency || 'EUR'}
              readOnly
              className={`${fieldClassName} cursor-not-allowed bg-gray-100 text-gray-500`}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Мессенджер (опционально)
              </label>
              <select
                value={leadForm.messengerType}
                onChange={(event) =>
                  setLeadForm((prev) => ({
                    ...prev,
                    messengerType: event.target.value as MessengerType | '',
                  }))
                }
                className={fieldClassName}
              >
                <option value="">Не выбрано</option>
                <option value="telegram">Telegram</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
              {errors.messengerType && <p className={errorClassName}>{errors.messengerType}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Handle / номер (опционально)
              </label>
              <input
                type="text"
                value={leadForm.messengerHandle}
                onChange={(event) =>
                  setLeadForm((prev) => ({ ...prev, messengerHandle: event.target.value }))
                }
                className={fieldClassName}
                placeholder="@username или +123..."
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
              Комментарий (опционально)
            </label>
            <textarea
              value={leadForm.comment}
              onChange={(event) => setLeadForm((prev) => ({ ...prev, comment: event.target.value }))}
              className={`${fieldClassName} min-h-24 resize-y`}
              placeholder="Добавьте детали, если нужно."
            />
          </div>

          <div className="space-y-2.5 rounded-lg border border-gray-200 p-3">
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={leadForm.consentPersonalData}
                onChange={(event) =>
                  setLeadForm((prev) => ({ ...prev, consentPersonalData: event.target.checked }))
                }
                className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>Согласен(а) на обработку персональных данных.</span>
            </label>
            {errors.consentPersonalData && (
              <p className={errorClassName}>{errors.consentPersonalData}</p>
            )}

            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={leadForm.consentMarketing}
                onChange={(event) =>
                  setLeadForm((prev) => ({ ...prev, consentMarketing: event.target.checked }))
                }
                className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>Согласен(а) на получение рекламных материалов (опционально).</span>
            </label>
          </div>

          <Button type="submit" fullWidth size="sm" isLoading={isSubmitting}>
            Отправить заявку
          </Button>
        </>
      )}
    </form>
  );

  const renderSuccessStep = () => (
    <div className="py-4 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <h4 className="mt-4 text-xl font-bold text-primary">Спасибо, заявка получена</h4>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-600">
        Свяжемся с вами в течение рабочего дня, чтобы согласовать следующие шаги.
      </p>

      <div className="mt-5">
        <Button onClick={closeWithReset} fullWidth size="sm">
          Закрыть
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeWithReset}
      title={modalTitleByStep[step]}
      maxWidth="max-w-xl"
      headerActions={
        step === 'currency' ? (
          <a
            href={SUPPORT_TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            Написать в поддержку
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
            {retryLeadId && (
              <div className="mt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  isLoading={isRetrying}
                  onClick={retryWebhook}
                >
                  Повторить отправку
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

"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CreditCard,
  Euro,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import Button from '@/components/shared/Button';
import Modal from '@/components/shared/Modal';
import {
  formatEurPerMonth,
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
  consentPersonalData: false,
  consentMarketing: false,
};

const E164_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_SUPPORT_TELEGRAM_URL = 'https://t.me/pontea_support_bot';
const SUPPORT_TELEGRAM_URL =
  process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM_URL || DEFAULT_SUPPORT_TELEGRAM_URL;
const DEFAULT_RUB_PAYMENT_URL_FOUNDATION = 'https://payform.ru/b8aFIn1/';
const DEFAULT_RUB_PAYMENT_URL_ADVANCED = 'https://payform.ru/j2aFIb3/';

const RUB_PAYMENT_URL_BY_PLAN: Record<'foundation' | 'advanced', string | undefined> = {
  foundation: process.env.NEXT_PUBLIC_RUB_PAYMENT_URL_FOUNDATION || DEFAULT_RUB_PAYMENT_URL_FOUNDATION,
  advanced: process.env.NEXT_PUBLIC_RUB_PAYMENT_URL_ADVANCED || DEFAULT_RUB_PAYMENT_URL_ADVANCED,
};

const fieldClassName =
  'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20';

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
  const [supportError, setSupportError] = useState<string | null>(null);
  const [retryLeadId, setRetryLeadId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

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
    setSupportError(null);
    setRetryLeadId(null);
    setIsSubmitting(false);
    setIsRetrying(false);
  }, [isOpen, plan?.id]);

  if (!plan) {
    return null;
  }

  const modalTitleByStep: Record<ModalStep, string> = {
    currency: 'Выберите валюту оплаты',
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
    setSupportError(null);
    setRetryLeadId(null);
    onClose();
  };

  const openSupport = () => {
    setSupportError(null);

    if (!SUPPORT_TELEGRAM_URL) {
      setSupportError('Ссылка поддержки пока не настроена. Пожалуйста, попробуйте позже.');
      return;
    }

    window.open(SUPPORT_TELEGRAM_URL, '_blank', 'noopener,noreferrer');
  };

  const handleBack = () => {
    setApiError(null);
    setSupportError(null);
    setErrors({});

    if (step === 'lead_form') {
      if (isMentorship) {
        closeWithReset();
        return;
      }

      setStep('currency');
      return;
    }

    if (step === 'success') {
      setStep('lead_form');
    }
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
    setSupportError(null);
    setRetryLeadId(null);

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
    <div className="rounded-2xl border border-primary/10 bg-gradient-to-r from-primary/5 via-white to-accent/10 p-4">
      <div className="text-sm font-semibold text-primary">{plan.name}</div>
      <div className="mt-1 flex items-end gap-1.5 text-primary">
        <div className="text-3xl font-bold leading-none">€{formatEurPerMonth(plan.price)}</div>
        <div className="pb-0.5 text-sm font-semibold">/мес</div>
      </div>
      <div className="mt-1 text-sm text-gray-600">{formatFullPriceLine(plan.price, plan.priceRub)}</div>
    </div>
  );

  const renderCurrencyStep = () => (
    <>
      <div className="mb-5">{renderPlanPriceSummary()}</div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {
            setApiError(null);
            setErrors({});

            if (plan.id !== 'foundation' && plan.id !== 'advanced') {
              setApiError('Оплата в рублях доступна только для Foundation и Advanced.');
              return;
            }

            const paymentUrl = RUB_PAYMENT_URL_BY_PLAN[plan.id];

            if (!paymentUrl) {
              setApiError('Ссылка на оплату временно недоступна. Напишите в поддержку.');
              return;
            }

            window.location.assign(paymentUrl);
          }}
          className="group w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-primary">Рубли (российской картой)</div>
                <div className="mt-1 text-sm text-gray-600">
                  Оплата по ссылке на платёжной платформе.
                </div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-0.5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedCurrency('EUR');
            setStep('lead_form');
            setApiError(null);
            setErrors({});
          }}
          className="group w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-accent/20 p-2 text-primary">
                <Euro className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-primary">Евро (иностранной картой)</div>
                <div className="mt-1 text-sm text-gray-600">
                  Сначала оформим заявку, затем отправим договор и инвойс.
                </div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-0.5" />
          </div>
        </button>
      </div>
    </>
  );

  const renderLeadStep = () => (
    <form onSubmit={submitLeadApplication} className="space-y-4">
      {renderPlanPriceSummary()}

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-sm font-semibold text-primary">{plan.name}</div>
        <div className="mt-1 text-sm text-gray-600">
          {isMentorship
            ? 'Индивидуально согласуем формат и оплату.'
            : 'Оплата не списывается сейчас. После проверки данных отправим дальнейшие шаги.'}
        </div>
      </div>

      {isMentorship ? (
        <>
          <div className="space-y-4">
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

          <Button type="submit" fullWidth isLoading={isSubmitting}>
            Оставить заявку
          </Button>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
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

          <div className="grid gap-4 sm:grid-cols-2">
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

          <div className="grid gap-4 sm:grid-cols-2">
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

          <div className="grid gap-4 sm:grid-cols-2">
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

          <div className="space-y-3 rounded-xl border border-gray-200 p-3.5">
            <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={leadForm.consentPersonalData}
                onChange={(event) =>
                  setLeadForm((prev) => ({ ...prev, consentPersonalData: event.target.checked }))
                }
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>Согласен(а) на обработку персональных данных.</span>
            </label>
            {errors.consentPersonalData && (
              <p className={errorClassName}>{errors.consentPersonalData}</p>
            )}

            <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={leadForm.consentMarketing}
                onChange={(event) =>
                  setLeadForm((prev) => ({ ...prev, consentMarketing: event.target.checked }))
                }
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>Согласен(а) на получение рекламных материалов (опционально).</span>
            </label>
          </div>

          <Button type="submit" fullWidth isLoading={isSubmitting}>
            Отправить заявку
          </Button>
        </>
      )}
    </form>
  );

  const renderSuccessStep = () => (
    <div className="py-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h4 className="mt-5 text-2xl font-bold text-primary">Спасибо, заявка получена</h4>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-600">
        Свяжемся с вами в течение рабочего дня, чтобы согласовать следующие шаги.
      </p>

      <div className="mt-6">
        <Button onClick={closeWithReset} fullWidth>
          Закрыть
        </Button>
      </div>
    </div>
  );

  const showBackButton = step !== 'currency';

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeWithReset}
      title={modalTitleByStep[step]}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            {showBackButton ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
              >
                <ArrowLeft className="h-4 w-4" />
                Назад
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={openSupport}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            <MessageCircle className="h-4 w-4" />
            Написать в поддержку
          </button>
        </div>

        {supportError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {supportError}
          </div>
        )}

        {apiError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2">
            <div className="flex items-start gap-2 text-sm text-red-700">
              <CircleAlert className="mt-0.5 h-4 w-4 flex-none" />
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

        <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs text-blue-800">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
            <span>
              Мы используем данные только для связи по вашей заявке и организации обучения.
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PricingLeadModal;

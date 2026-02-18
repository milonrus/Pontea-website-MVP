"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  CircleAlert,
  ArrowRight,
  User,
  Phone,
} from 'lucide-react';
import Button from '@/components/shared/Button';
import Modal from '@/components/shared/Modal';
import { getOptionalPublicEnv, getRequiredPublicEnv } from '@/lib/env/public';
import {
  INSTALLMENT_MONTHS,
  RUB_INSTALLMENT_TOTAL_BY_PLAN,
} from './data';
import { PricingLocale, RuPricingPlan } from './types';
import {
  DEFAULT_LEAD_FORM,
  getTextFieldFormatError,
  LeadFormState,
  LeadTextField,
  normalizePhoneToE164,
  normalizeWhitespace,
  parseOrderNumber,
  PRICING_MODAL_TEXT,
} from './pricingLeadShared';

type ModalStep = 'currency' | 'lead_form' | 'success';
type PaymentOptionId = 'rub_full' | 'rub_installment' | 'eur';
type PricingLeadModalMode = 'plan' | 'prepayment';

interface PricingLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: RuPricingPlan | null;
  locale?: PricingLocale;
  mode?: PricingLeadModalMode;
}

const RUB_PAYMENT_URL_BY_PLAN: Record<'foundation' | 'advanced', string> = {
  foundation: getRequiredPublicEnv('NEXT_PUBLIC_RUB_PAYMENT_URL_FOUNDATION'),
  advanced: getRequiredPublicEnv('NEXT_PUBLIC_RUB_PAYMENT_URL_ADVANCED'),
};
const SUPPORT_TELEGRAM_URL = getRequiredPublicEnv('NEXT_PUBLIC_SUPPORT_TELEGRAM_URL');
const RUB_PREPAYMENT_URL = getOptionalPublicEnv('NEXT_PUBLIC_RUB_PREPAYMENT_URL');

const RUB_INSTALLMENT_PAYMENT_URL_BY_PLAN: Record<'foundation' | 'advanced', string | undefined> = {
  foundation: getOptionalPublicEnv('NEXT_PUBLIC_RUB_PAYMENT_URL_FOUNDATION_INSTALLMENT'),
  advanced: getOptionalPublicEnv('NEXT_PUBLIC_RUB_PAYMENT_URL_ADVANCED_INSTALLMENT'),
};

const formatRubAmount = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;

const errorClassName = 'mt-1 text-xs font-medium text-red-600';
const mentorshipLabelClassName = 'text-[11px] font-semibold text-gray-500 uppercase tracking-wide';
const mentorshipFieldClassName =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/20';
const mentorshipErrorClassName = 'mt-1 text-xs text-red-500';

const PricingLeadModal: React.FC<PricingLeadModalProps> = ({
  isOpen,
  onClose,
  plan,
  locale = 'ru',
  mode = 'plan',
}) => {
  const router = useRouter();
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
  const isPrepaymentMode = mode === 'prepayment';

  const isMentorship = plan?.id === 'mentorship';

  useEffect(() => {
    if (!isOpen || (!plan && !isPrepaymentMode)) {
      return;
    }

    setStep(isPrepaymentMode ? 'currency' : plan?.id === 'mentorship' ? 'lead_form' : 'currency');
    setLeadForm(DEFAULT_LEAD_FORM);
    setErrors({});
    setApiError(null);
    setRetryLeadId(null);
    setOrderNumber(null);
    setIsSubmitting(false);
    setIsRetrying(false);
    setSelectedPaymentOption(null);
  }, [isOpen, isPrepaymentMode, plan?.id]);

  if (!plan && !isPrepaymentMode) {
    return null;
  }

  const modalTitleByStep: Record<ModalStep, string> = {
    currency: t.modalTitleCurrency,
    lead_form: t.modalTitleLeadFormMentorship,
    success: t.modalTitleSuccess,
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

  const validateLeadForm = () => {
    const nextErrors: Record<string, string> = {};
    const normalizedPhone = normalizePhoneToE164(leadForm.phone);
    const normalizedFirstName = normalizeWhitespace(leadForm.firstName);

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

    const firstName = leadForm.firstName.trim();
    const pagePath =
      typeof window === 'undefined'
        ? localeHome
        : window.location.pathname;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/pricing-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadType: 'mentorship_application',
          planId: plan.id,
          firstName,
          email: undefined,
          phone: validation.normalizedPhone,
          comment: undefined,
          consentOffer: false,
          consentPersonalData: leadForm.consentPersonalData,
          consentMarketing: false,
          pagePath,
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
    if (!isPrepaymentMode && plan?.id !== 'foundation' && plan?.id !== 'advanced') {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {t.unsupportedPlan}
        </div>
      );
    }

    const rubFullPrice = isPrepaymentMode
      ? 9_000
      : plan!.priceRub;
    const rubInstallmentTotal = isPrepaymentMode
      ? null
      : RUB_INSTALLMENT_TOTAL_BY_PLAN[plan!.id];
    const rubInstallmentMonthly = rubInstallmentTotal === null
      ? null
      : Math.round(
        rubInstallmentTotal / INSTALLMENT_MONTHS
      );

    const hasSelectedPaymentOption = selectedPaymentOption !== null;
    const shouldShowOfferConsent =
      !isPrepaymentMode && hasSelectedPaymentOption && selectedPaymentOption !== 'eur';
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

      if (!isPrepaymentMode && selectedPaymentOption !== 'eur' && !ensureOfferConsent()) {
        return;
      }

      if (selectedPaymentOption === 'rub_full') {
        const paymentUrl = isPrepaymentMode
          ? RUB_PREPAYMENT_URL
          : RUB_PAYMENT_URL_BY_PLAN[plan!.id];

        if (!paymentUrl) {
          setApiError(t.errors.paymentLinkUnavailable);
          return;
        }

        window.location.assign(paymentUrl);
        return;
      }

      if (selectedPaymentOption === 'rub_installment') {
        const paymentUrl = RUB_INSTALLMENT_PAYMENT_URL_BY_PLAN[plan!.id];

        if (!paymentUrl) {
          setApiError(t.errors.installmentLinkUnavailable);
          return;
        }

        window.location.assign(paymentUrl);
        return;
      }

      onClose();
      router.push(
        isPrepaymentMode
          ? `${localePrefix}/invoice-request/?mode=prepayment`
          : `${localePrefix}/invoice-request/?plan=${plan!.id}`
      );
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
        amount: `${t.fromLabel} ${formatRubAmount(rubInstallmentMonthly ?? 0)}`,
        amountHint: rubInstallmentTotal === null
          ? undefined
          : `${t.installmentAmountPrefix} ${INSTALLMENT_MONTHS} = ${formatRubAmount(rubInstallmentTotal)}`,
        title: t.paymentOptionInstallmentTitle,
        subtitle: t.paymentOptionInstallmentSubtitle,
      },
      eur: {
        id: 'eur',
        amount: `€${formatEurAmount(isPrepaymentMode ? 100 : plan!.price)}`,
        title: t.paymentOptionEurTitle,
        subtitle: t.paymentOptionEurSubtitle,
      },
    };

    const paymentOptionOrder: PaymentOptionId[] = isPrepaymentMode
      ? (locale === 'en' ? ['eur', 'rub_full'] : ['rub_full', 'eur'])
      : (locale === 'en'
        ? ['eur', 'rub_full', 'rub_installment']
        : ['rub_full', 'rub_installment', 'eur']);

    const paymentOptions: PaymentOption[] = paymentOptionOrder.map(
      (id) => paymentOptionsById[id]
    );

    const accessNote = isPrepaymentMode
      ? locale === 'en'
        ? 'Deposit amount is fixed. Pay now and lock your discounted price.'
        : 'Сумма предоплаты фиксирована. Оплатите сейчас и зафиксируйте цену со скидкой.'
      : `${t.accessNotePrefix} ${plan!.name}.`;

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

        {!isPrepaymentMode ? (
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
        ) : null}

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

  const showSupportAction = step === 'currency';
  const isMentorshipLeadStep = !isPrepaymentMode && isMentorship && step === 'lead_form';

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeWithReset}
      title={modalTitleByStep[step]}
      maxWidth={isMentorshipLeadStep ? 'max-w-6xl' : 'max-w-xl'}
      viewportPaddingClassName="p-4 sm:p-5"
      panelMaxHeightClassName="max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-2.5rem)]"
      headerLeading={null}
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

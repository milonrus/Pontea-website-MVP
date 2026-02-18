'use client';

import React, { useState } from 'react';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import Button from '@/components/shared/Button';
import { getOptionalPublicEnv } from '@/lib/env/public';
import { InvoiceRequestMode, PricingLocale, RuPricingPlan } from './types';
import {
  DEFAULT_LEAD_FORM,
  getTextFieldFormatError,
  LeadFormState,
  LeadTextField,
  parseOrderNumber,
  PRICING_MODAL_TEXT,
  validateEurLeadForm,
} from './pricingLeadShared';

const eurFieldClassName =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm leading-5 text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/20';
const eurLabelClassName = 'block text-[11px] font-semibold uppercase tracking-wide text-slate-500';
const errorClassName = 'mt-1 text-[11px] font-medium text-red-600';
const normalizePromoCode = (value: string) => value.trim().toUpperCase();

const parsePromoPercent = (value: string | undefined): number | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (parsed < 1 || parsed > 99) {
    return null;
  }

  return parsed;
};

interface PricingEurInvoiceFlowProps {
  plan: (RuPricingPlan & { id: 'foundation' | 'advanced' | 'mentorship' }) | null;
  mode?: InvoiceRequestMode;
  locale?: PricingLocale;
  onClose: () => void;
}

const EUR_PREPAYMENT_AMOUNT = 100;

const PricingEurInvoiceFlow: React.FC<PricingEurInvoiceFlowProps> = ({
  plan,
  mode = 'default',
  locale = 'ru',
  onClose,
}) => {
  const [leadForm, setLeadForm] = useState<LeadFormState>(DEFAULT_LEAD_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [retryLeadId, setRetryLeadId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoAppliedCode, setPromoAppliedCode] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const t = PRICING_MODAL_TEXT[locale];
  const isPrepaymentMode = mode === 'prepayment';
  const localePrefix = locale === 'en' ? '' : '/ru';
  const selectedPlanLabel = isPrepaymentMode
    ? t.summaryPrepaymentLabel
    : t.summarySelectedPlan;
  const promoCodeFromEnv = getOptionalPublicEnv('NEXT_PUBLIC_EUR_PROMO_CODE');
  const promoPercentFromEnv = getOptionalPublicEnv('NEXT_PUBLIC_EUR_PROMO_PERCENT');
  const normalizedPromoCode = normalizePromoCode(promoCodeFromEnv || '');
  const promoPercent = parsePromoPercent(promoPercentFromEnv);
  const isPromoEnabled =
    !isPrepaymentMode && normalizedPromoCode.length > 0 && promoPercent !== null;

  const appliedPromoPercent = isPromoEnabled && promoAppliedCode ? promoPercent : 0;
  const basePrice = isPrepaymentMode
    ? EUR_PREPAYMENT_AMOUNT
    : plan?.price ?? 0;
  const discountAmount = appliedPromoPercent
    ? Math.round((basePrice * appliedPromoPercent) / 100)
    : 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);
  const selectedPlanName = isPrepaymentMode
    ? (locale === 'en' ? 'Deposit €100' : 'Предоплата €100')
    : plan?.name ?? '';

  if (!plan && !isPrepaymentMode) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-slate-600">
        {locale === 'en'
          ? 'Selected plan is unavailable.'
          : 'Выбранный тариф временно недоступен.'}
      </div>
    );
  }

  const formatEurAmount = (value: number) =>
    new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

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

  const applyPromoCode = () => {
    if (!isPromoEnabled) {
      return;
    }

    const normalizedInput = normalizePromoCode(promoInput);

    if (!normalizedInput || normalizedInput !== normalizedPromoCode) {
      setPromoError(t.promoInvalid);
      return;
    }

    setPromoInput(normalizedInput);
    setPromoAppliedCode(normalizedInput);
    setPromoError(null);
  };

  const removePromoCode = () => {
    setPromoAppliedCode(null);
    setPromoInput('');
    setPromoError(null);
  };

  const submitLeadApplication = async (event: React.FormEvent) => {
    event.preventDefault();
    setApiError(null);
    setRetryLeadId(null);
    setOrderNumber(null);

    const validation = validateEurLeadForm(leadForm, locale);
    setErrors(validation.errors);

    if (
      Object.keys(validation.errors).length > 0 ||
      !validation.normalizedPhone ||
      !validation.parsedFullName
    ) {
      return;
    }

    const pagePath =
      typeof window === 'undefined'
        ? (locale === 'en' ? '/' : '/ru/')
        : window.location.pathname;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/pricing-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadType: isPrepaymentMode
            ? 'eur_prepayment_application'
            : 'eur_application',
          planId: isPrepaymentMode ? 'universal' : plan!.id,
          currency: 'EUR',
          firstName: validation.parsedFullName.firstName,
          lastName: validation.parsedFullName.lastName,
          email: leadForm.email.trim(),
          phone: validation.normalizedPhone,
          payerType: 'individual',
          comment: undefined,
          contractCountry: leadForm.contractCountry.trim(),
          contractCity: leadForm.contractCity.trim(),
          contractPostalCode: leadForm.contractPostalCode.trim(),
          contractAddress: leadForm.contractAddress.trim(),
          consentOffer: leadForm.consentOffer,
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

      setIsSuccess(true);
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

      setIsSuccess(true);
      setRetryLeadId(null);
    } catch (error) {
      console.error('Webhook retry failed:', error);
      setApiError(t.errors.retryNetworkFailed);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="space-y-4 text-sm">
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

      {isSuccess ? (
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
            <Button onClick={onClose} fullWidth size="sm">
              {t.close}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submitLeadApplication} className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] sm:items-start sm:gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:gap-5 lg:grid-cols-[minmax(0,420px)_300px] lg:justify-center lg:gap-6 xl:grid-cols-[minmax(0,460px)_320px] xl:gap-8">
            <div className="space-y-5 sm:space-y-6 lg:space-y-7">
              <p className="text-[13px] leading-relaxed text-slate-600 sm:text-sm">
                {isPrepaymentMode ? t.eurTariffInfoPrepayment : t.eurTariffInfo}
              </p>

              <div className="space-y-4">
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
              </div>

              <h4 className="text-base font-display font-bold text-primary lg:text-lg">
                {t.contractHeading}
              </h4>

              <div className="space-y-4">
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

                <div className="grid gap-4 md:grid-cols-2">
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
              </div>
            </div>

            <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
              <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {selectedPlanLabel}
                </p>
                <p className="mt-2 text-2xl font-display font-bold text-primary">
                  {selectedPlanName}
                </p>
                <div className="mt-4 space-y-2 border-t border-gray-200 pt-3">
                  <div className="flex items-center justify-between gap-3 text-sm text-slate-700">
                    <span>{t.summaryBasePrice}</span>
                    <span className="font-semibold text-slate-900">€{formatEurAmount(basePrice)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm text-slate-700">
                    <span>
                      {t.summaryDiscount}
                      {appliedPromoPercent ? ` -${appliedPromoPercent}%` : ''}
                    </span>
                    <span className={`font-semibold ${discountAmount > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {discountAmount > 0 ? `-€${formatEurAmount(discountAmount)}` : '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-2 text-base font-bold text-slate-900">
                    <span>{t.summaryTotal}</span>
                    <span>€{formatEurAmount(finalPrice)}</span>
                  </div>
                </div>
              </div>

              {isPromoEnabled ? (
                <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
                  <label htmlFor="eur-promo-code" className={eurLabelClassName}>
                    {t.promoLabel}
                  </label>

                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <input
                      id="eur-promo-code"
                      name="promoCode"
                      type="text"
                      value={promoInput}
                      onChange={(event) => {
                        setPromoInput(event.target.value);
                        if (promoError) {
                          setPromoError(null);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          applyPromoCode();
                        }
                      }}
                      disabled={!!promoAppliedCode}
                      className={`${eurFieldClassName} !py-2 ${promoAppliedCode ? 'bg-gray-50 text-slate-500' : ''}`}
                      placeholder={t.promoPlaceholder}
                    />
                    {promoAppliedCode ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={removePromoCode}
                        className="w-full whitespace-nowrap md:w-auto"
                      >
                        {t.promoRemove}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={applyPromoCode}
                        className="w-full whitespace-nowrap md:w-auto"
                      >
                        {t.promoApply}
                      </Button>
                    )}
                  </div>

                  {promoAppliedCode ? (
                    <p className="text-[11px] font-medium text-emerald-700">{t.promoApplied}</p>
                  ) : null}

                  {promoError ? (
                    <p className={errorClassName}>{promoError}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
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

              <div className="space-y-1.5">
                <Button type="submit" size="md" fullWidth isLoading={isSubmitting}>
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
            </aside>
          </div>
        </form>
      )}
    </div>
  );
};

export default PricingEurInvoiceFlow;

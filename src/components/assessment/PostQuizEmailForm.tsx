import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, ArrowRight, User, Phone } from 'lucide-react';
import Button from '@/components/shared/Button';
import {
  normalizePhoneToE164,
} from '@/lib/assessment/phone';
import { AssessmentLocale } from '@/data/assessmentQuestions';

interface PostQuizEmailFormProps {
  onSubmit: (data: AssessmentContactSubmission) => void;
  isLoading: boolean;
  locale?: AssessmentLocale;
}

export interface AssessmentContactSubmission {
  name: string;
  email: string;
  phone: string;
  consentPersonalData: true;
  consentAt: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  consentPersonalData?: string;
}

const translations = {
  en: {
    title: 'Final step to keep your results',
    name: 'Name',
    namePlaceholder: 'Your name',
    phone: 'Phone',
    phonePlaceholder: '+393331234567',
    email: 'Email',
    emailPlaceholder: 'your@email.com',
    consentPrefix: 'I consent to the processing of',
    consentLink: 'personal data',
    consentSuffix: 'and to being contacted in messengers for consultation about my test results.',
    submitIdle: 'View results',
    submitLoading: 'Saving...',
    legalPrefix: 'By clicking “View results”, you confirm that you have read the',
    legalLink: 'Privacy Policy',
    errors: {
      nameRequired: 'Please enter your name.',
      emailRequired: 'Please enter a valid email.',
      emailInvalid: 'Please enter a valid email.',
      phoneRequired: 'Please enter your phone number.',
      phoneInvalid: 'Enter phone number in international format (+...).',
      consentRequired: 'Consent to personal data processing is required.',
    },
  },
  ru: {
    title: 'Последний шаг, чтобы не потерять результаты',
    name: 'Имя',
    namePlaceholder: 'Ваше имя',
    phone: 'Телефон',
    phonePlaceholder: '+393331234567',
    email: 'Email',
    emailPlaceholder: 'your@email.com',
    consentPrefix: 'Даю согласие на обработку',
    consentLink: 'персональных данных',
    consentSuffix: 'и на связь со мной по в мессенджерах для консультации по результатам теста.',
    submitIdle: 'Посмотреть результаты',
    submitLoading: 'Сохраняем...',
    legalPrefix: 'Нажимая «Посмотреть результаты», вы подтверждаете ознакомление с',
    legalLink: 'Политикой обработки персональных данных',
    errors: {
      nameRequired: 'Введите имя.',
      emailRequired: 'Введите корректный email.',
      emailInvalid: 'Введите корректный email.',
      phoneRequired: 'Введите номер телефона.',
      phoneInvalid: 'Введите номер телефона в международном формате (+...).',
      consentRequired: 'Нужно согласие на обработку персональных данных.',
    },
  },
};

function getEmailFormatError(value: string, locale: AssessmentLocale): string {
  const normalized = value.trim();
  if (!normalized) {
    return '';
  }

  return EMAIL_REGEX.test(normalized)
    ? ''
    : translations[locale].errors.emailInvalid;
}

function getPhoneFormatError(value: string, locale: AssessmentLocale): string {
  const normalized = value.trim();
  if (!normalized) {
    return '';
  }

  return normalizePhoneToE164(normalized)
    ? ''
    : translations[locale].errors.phoneInvalid;
}

const PostQuizEmailForm: React.FC<PostQuizEmailFormProps> = ({
  onSubmit,
  isLoading,
  locale = 'ru',
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consentPersonalData, setConsentPersonalData] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const t = translations[locale];
  const localePrefix = locale === 'en' ? '' : '/ru';

  const setFieldError = (field: keyof FormErrors, message: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (message) {
        next[field] = message;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedName = name.trim();
    const normalizedEmail = email.trim();
    const normalizedPhoneInput = phone.trim();

    const nextErrors: FormErrors = {};

    if (!normalizedName) {
      nextErrors.name = t.errors.nameRequired;
    }

    if (!normalizedEmail) {
      nextErrors.email = t.errors.emailRequired;
    } else {
      const emailFormatError = getEmailFormatError(normalizedEmail, locale);
      if (emailFormatError) {
        nextErrors.email = emailFormatError;
      }
    }

    if (!normalizedPhoneInput) {
      nextErrors.phone = t.errors.phoneRequired;
    } else {
      const phoneFormatError = getPhoneFormatError(normalizedPhoneInput, locale);
      if (phoneFormatError) {
        nextErrors.phone = phoneFormatError;
      }
    }

    if (!consentPersonalData) {
      nextErrors.consentPersonalData = t.errors.consentRequired;
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    const normalizedPhone = normalizePhoneToE164(normalizedPhoneInput);
    if (!normalizedPhone) {
      setFieldError('phone', t.errors.phoneInvalid);
      return;
    }

    onSubmit({
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      consentPersonalData: true,
      consentAt: new Date().toISOString(),
    });
  };

  return (
    <div className="flex flex-col items-center justify-start px-3 py-2 sm:px-4 sm:py-3">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="no-scrollbar w-full max-w-xl max-h-[calc(100dvh-9rem)] overflow-y-auto bg-white p-4 sm:p-5 md:p-6 rounded-2xl shadow-lg border border-gray-100"
      >
        <div className="text-center mb-4">
          <div className="w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
            <Mail className="w-5 h-5 text-accent" />
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-primary leading-tight">
            {t.title}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off" noValidate>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                {t.name}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setFieldError('name', '')}
                  placeholder={t.namePlaceholder}
                  autoComplete="off"
                  autoFocus
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                />
              </div>
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                {t.phone}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => setFieldError('phone', getPhoneFormatError(phone, locale))}
                  placeholder={t.phonePlaceholder}
                  autoComplete="off"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-500">{errors.phone}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              {t.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setFieldError('email', getEmailFormatError(email, locale))}
              placeholder={t.emailPlaceholder}
              autoComplete="off"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consentPersonalData}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setConsentPersonalData(isChecked);
                  setFieldError(
                    'consentPersonalData',
                    isChecked ? '' : t.errors.consentRequired
                  );
                }}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/30"
              />
              <span className="text-xs text-slate-600 leading-snug">
                {t.consentPrefix}{' '}
                <Link
                  href={`${localePrefix}/legal/consent/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-slate-400 underline-offset-2 text-slate-600"
                >
                  {t.consentLink}
                </Link>{' '}
                {t.consentSuffix}
              </span>
            </label>
            {errors.consentPersonalData && (
              <p className="text-xs text-red-500">{errors.consentPersonalData}</p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            fullWidth
            disabled={isLoading}
            className="group !py-3"
          >
            {isLoading ? t.submitLoading : t.submitIdle}
            {!isLoading && (
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            )}
          </Button>

          <p className="px-1 text-center text-[10px] leading-snug text-slate-500">
            {t.legalPrefix}{' '}
            <Link
              href={`${localePrefix}/legal/privacy/`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-slate-300 underline-offset-2 text-slate-500"
            >
              {t.legalLink}
            </Link>
            .
          </p>
        </form>

      </motion.div>
    </div>
  );
};

export default PostQuizEmailForm;

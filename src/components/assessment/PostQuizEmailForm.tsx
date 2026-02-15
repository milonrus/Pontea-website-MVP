import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, ArrowRight, User, Phone } from 'lucide-react';
import Button from '@/components/shared/Button';
import {
  getPhoneE164Error,
  normalizePhoneToE164,
} from '@/lib/assessment/phone';

interface PostQuizEmailFormProps {
  onSubmit: (data: AssessmentContactSubmission) => void;
  isLoading: boolean;
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

const getEmailFormatError = (value: string): string => {
  const normalized = value.trim();
  if (!normalized) {
    return '';
  }
  return EMAIL_REGEX.test(normalized) ? '' : 'Введите корректный email.';
};

const PostQuizEmailForm: React.FC<PostQuizEmailFormProps> = ({ onSubmit, isLoading }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consentPersonalData, setConsentPersonalData] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

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
      nextErrors.name = 'Введите имя.';
    }

    if (!normalizedEmail) {
      nextErrors.email = 'Введите корректный email.';
    } else {
      const emailFormatError = getEmailFormatError(normalizedEmail);
      if (emailFormatError) {
        nextErrors.email = emailFormatError;
      }
    }

    if (!normalizedPhoneInput) {
      nextErrors.phone = 'Введите номер телефона.';
    } else {
      const phoneFormatError = getPhoneE164Error(normalizedPhoneInput);
      if (phoneFormatError) {
        nextErrors.phone = phoneFormatError;
      }
    }

    if (!consentPersonalData) {
      nextErrors.consentPersonalData = 'Нужно согласие на обработку персональных данных.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    const normalizedPhone = normalizePhoneToE164(normalizedPhoneInput);
    if (!normalizedPhone) {
      setFieldError('phone', 'Введите номер телефона в международном формате (E.164).');
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
            Последний шаг, чтобы не потерять результаты
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off" noValidate>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                Имя
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setFieldError('name', '')}
                  placeholder="Ваше имя"
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
                Телефон
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => setFieldError('phone', getPhoneE164Error(phone))}
                  placeholder="+393331234567"
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
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setFieldError('email', getEmailFormatError(email))}
              placeholder="your@email.com"
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
                    isChecked ? '' : 'Нужно согласие на обработку персональных данных.'
                  );
                }}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/30"
              />
              <span className="text-xs text-slate-600 leading-snug">
                Даю согласие на обработку{' '}
                <Link
                  href="/ru/legal/consent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-slate-400 underline-offset-2 text-slate-600"
                >
                  персональных данных
                </Link>{' '}
                и на связь со мной по в мессенджерах для консультации по результатам теста.
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
            {isLoading ? 'Сохраняем...' : 'Посмотреть результаты'}
            {!isLoading && (
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            )}
          </Button>

          <p className="px-1 text-center text-[10px] leading-snug text-slate-500">
            Нажимая «Посмотреть результаты», вы подтверждаете ознакомление с{' '}
            <Link
              href="/ru/legal/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-slate-300 underline-offset-2 text-slate-500"
            >
              Политикой обработки персональных данных
            </Link>
            .
          </p>
        </form>

      </motion.div>
    </div>
  );
};

export default PostQuizEmailForm;

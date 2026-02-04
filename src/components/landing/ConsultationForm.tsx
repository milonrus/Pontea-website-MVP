"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/shared/Button';
import { CheckCircle, Sparkles } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  phone: string;
  consentPersonalData: boolean;
  consentAdvertising: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  consentPersonalData?: string;
}

const ConsultationForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '+7',
    consentPersonalData: false,
    consentAdvertising: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Имя должно содержать не менее 2 символов';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Введите корректный email';
    }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.phone.startsWith('+7') || phoneDigits.length < 11) {
      newErrors.phone = 'Номер должен начинаться с +7 и содержать 11 цифр';
    }

    if (!formData.consentPersonalData) {
      newErrors.consentPersonalData = 'Необходимо согласие на обработку данных';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (value: string) => {
    if (!value.startsWith('+7')) {
      value = '+7' + value.replace(/^\+7/, '');
    }

    const digits = value.replace(/\D/g, '');
    if (digits.length <= 11) {
      setFormData({ ...formData, phone: '+7' + digits.slice(1) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);

      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({
          name: '',
          email: '',
          phone: '+7',
          consentPersonalData: false,
          consentAdvertising: false,
        });
      }, 3000);
    }, 1500);

    // TODO: Implement actual API call to /api/consultation
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-accent border-4 border-primary mb-6 relative"
        >
          <CheckCircle className="w-10 h-10 text-primary" strokeWidth={3} />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1, delay: 0.3 }}
            className="absolute inset-0 border-4 border-accent"
          />
        </motion.div>
        <h3 className="text-3xl font-black text-primary mb-2 uppercase tracking-tight">
          Готово!
        </h3>
        <p className="text-gray-600 font-medium">
          Свяжемся с вами в ближайшее время
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Field */}
      <div className="relative">
        <label className="block text-xs font-bold uppercase tracking-wider text-primary mb-2">
          Имя
        </label>
        <div className="relative">
          <input
            type="text"
            className={`w-full px-4 py-3 border-2 bg-white font-medium focus:outline-none transition-all ${
              errors.name
                ? 'border-red-500'
                : focusedField === 'name'
                ? 'border-accent shadow-[4px_4px_0px_0px_rgba(255,200,87,0.3)]'
                : 'border-gray-300 hover:border-primary/50'
            }`}
            placeholder="Иван"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
          />
          {focusedField === 'name' && (
            <motion.div
              layoutId="focusIndicator"
              className="absolute -right-1 -top-1 w-3 h-3 bg-accent"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </div>
        <AnimatePresence>
          {errors.name && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-600 text-xs font-bold mt-2 uppercase tracking-wide"
            >
              → {errors.name}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Email Field */}
      <div className="relative">
        <label className="block text-xs font-bold uppercase tracking-wider text-primary mb-2">
          Почта
        </label>
        <div className="relative">
          <input
            type="email"
            className={`w-full px-4 py-3 border-2 bg-white font-medium focus:outline-none transition-all ${
              errors.email
                ? 'border-red-500'
                : focusedField === 'email'
                ? 'border-accent shadow-[4px_4px_0px_0px_rgba(255,200,87,0.3)]'
                : 'border-gray-300 hover:border-primary/50'
            }`}
            placeholder="ivan@mail.ru"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
          />
          {focusedField === 'email' && (
            <motion.div
              layoutId="focusIndicator"
              className="absolute -right-1 -top-1 w-3 h-3 bg-accent"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </div>
        <AnimatePresence>
          {errors.email && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-600 text-xs font-bold mt-2 uppercase tracking-wide"
            >
              → {errors.email}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Phone Field */}
      <div className="relative">
        <label className="block text-xs font-bold uppercase tracking-wider text-primary mb-2">
          Телефон
        </label>
        <div className="relative">
          <input
            type="tel"
            className={`w-full px-4 py-3 border-2 bg-white font-medium focus:outline-none transition-all ${
              errors.phone
                ? 'border-red-500'
                : focusedField === 'phone'
                ? 'border-accent shadow-[4px_4px_0px_0px_rgba(255,200,87,0.3)]'
                : 'border-gray-300 hover:border-primary/50'
            }`}
            placeholder="+7"
            value={formData.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            onFocus={() => setFocusedField('phone')}
            onBlur={() => setFocusedField(null)}
          />
          {focusedField === 'phone' && (
            <motion.div
              layoutId="focusIndicator"
              className="absolute -right-1 -top-1 w-3 h-3 bg-accent"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </div>
        <AnimatePresence>
          {errors.phone && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-600 text-xs font-bold mt-2 uppercase tracking-wide"
            >
              → {errors.phone}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Checkboxes */}
      <div className="space-y-3 pt-2 border-t-2 border-gray-200">
        <label className="flex items-start gap-4 cursor-pointer group">
          <div className="relative flex items-center justify-center mt-1">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={formData.consentPersonalData}
              onChange={(e) =>
                setFormData({ ...formData, consentPersonalData: e.target.checked })
              }
            />
            <div className="w-6 h-6 border-2 border-primary bg-white peer-checked:bg-primary transition-all group-hover:scale-110 flex items-center justify-center">
              {formData.consentPersonalData && (
                <motion.svg
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                </motion.svg>
              )}
            </div>
          </div>
          <span className="text-xs text-gray-700 leading-relaxed font-medium">
            Я соглашаюсь на обработку персональных данных
            {errors.consentPersonalData && (
              <span className="text-red-600 font-bold block mt-1">*{errors.consentPersonalData}</span>
            )}
          </span>
        </label>

        <label className="flex items-start gap-4 cursor-pointer group">
          <div className="relative flex items-center justify-center mt-1">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={formData.consentAdvertising}
              onChange={(e) =>
                setFormData({ ...formData, consentAdvertising: e.target.checked })
              }
            />
            <div className="w-6 h-6 border-2 border-primary bg-white peer-checked:bg-primary transition-all group-hover:scale-110 flex items-center justify-center">
              {formData.consentAdvertising && (
                <motion.svg
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                </motion.svg>
              )}
            </div>
          </div>
          <span className="text-xs text-gray-700 leading-relaxed font-medium">
            Я соглашаюсь на получение рекламных материалов
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <div className="relative pt-2">
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative w-full bg-primary text-white py-4 font-black text-sm uppercase tracking-wider border-2 border-primary hover:bg-white hover:text-primary transition-all duration-300 overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <motion.div
            className="absolute inset-0 bg-accent"
            initial={{ x: '-100%' }}
            whileHover={{ x: 0 }}
            transition={{ duration: 0.3 }}
          />
          <span className="relative z-10 flex items-center justify-center gap-3">
            {isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                Отправка...
              </>
            ) : (
              <>
                Получить консультацию
                <span className="text-lg">→</span>
              </>
            )}
          </span>
        </motion.button>

        {/* Decorative corner on button */}
        <div className="absolute -bottom-2 -right-2 w-8 h-8 border-r-2 border-b-2 border-accent pointer-events-none" />
      </div>
    </form>
  );
};

export default ConsultationForm;

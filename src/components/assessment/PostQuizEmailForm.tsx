import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight } from 'lucide-react';
import Button from '@/components/shared/Button';

interface PostQuizEmailFormProps {
  onSubmit: (email: string) => void;
  isLoading: boolean;
}

const PostQuizEmailForm: React.FC<PostQuizEmailFormProps> = ({ onSubmit, isLoading }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onSubmit(email.trim());
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100"
      >
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-7 h-7 text-accent" />
          </div>
          <h2 className="text-2xl font-display font-bold text-primary mb-2">
            Последний шаг
          </h2>
          <p className="text-gray-500 text-sm">
            Укажите email, чтобы получить результаты и персональный план подготовки.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            fullWidth
            disabled={isLoading || !email.trim()}
            className="group"
          >
            {isLoading ? 'Сохраняем...' : 'Показать результаты'}
            {!isLoading && (
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            )}
          </Button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          Мы не рассылаем спам. Результаты можно будет открыть по ссылке.
        </p>
      </motion.div>
    </div>
  );
};

export default PostQuizEmailForm;

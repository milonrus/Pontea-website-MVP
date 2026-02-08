import React, { useState } from 'react';
import { UserInfo } from '@/types';
import Button from '@/components/shared/Button';

const UserInfoForm: React.FC<{ onSubmit: (data: UserInfo) => void }> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<UserInfo>({
    name: '',
    email: '',
    targetUniversity: 'Пока не определился(лась)'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-display font-bold text-primary mb-2 text-center">Расскажите о себе</h2>
        <p className="text-gray-500 mb-8 text-center">Это нужно для персонального плана подготовки.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ваше имя</label>
            <input
              required
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none"
              placeholder="Имя"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              required
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none"
              placeholder="you@example.com"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Целевой университет</label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none bg-white"
              value={formData.targetUniversity}
              onChange={e => setFormData({...formData, targetUniversity: e.target.value})}
            >
              <option>Пока не определился(лась)</option>
              <option>Politecnico di Milano (ARCHED)</option>
              <option>Politecnico di Torino (TIL-A)</option>
              <option>Оба</option>
            </select>
          </div>

          <Button type="submit" fullWidth className="mt-4">
            Начать тест
          </Button>
        </form>
      </div>
    </div>
  );
};

export default UserInfoForm;

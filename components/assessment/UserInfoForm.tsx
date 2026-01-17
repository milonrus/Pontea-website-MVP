import React, { useState } from 'react';
import { UserInfo } from '../../types';
import Button from '../shared/Button';

const UserInfoForm: React.FC<{ onSubmit: (data: UserInfo) => void }> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<UserInfo>({
    name: '',
    email: '',
    targetUniversity: 'Not sure yet'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-display font-bold text-primary mb-2 text-center">Tell us about yourself</h2>
        <p className="text-gray-500 mb-8 text-center">We need this to personalize your study roadmap.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none"
              placeholder="Your name"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Target University</label>
            <select 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none bg-white"
              value={formData.targetUniversity}
              onChange={e => setFormData({...formData, targetUniversity: e.target.value})}
            >
              <option>Not sure yet</option>
              <option>Politecnico di Milano (ARCHED)</option>
              <option>Politecnico di Torino (TIL-A)</option>
              <option>Both</option>
            </select>
          </div>

          <Button type="submit" fullWidth className="mt-4">
            Start Quiz
          </Button>
        </form>
      </div>
    </div>
  );
};

export default UserInfoForm;

import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { CreditCard, Landmark, CheckCircle2 } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tierName: string;
  price: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, tierName, price }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep('success');
    }, 1500);
  };

  const reset = () => {
    setStep('form');
    onClose();
  };

  if (step === 'success') {
    return (
      <Modal isOpen={isOpen} onClose={reset} title="Success!">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4 className="text-2xl font-bold text-primary mb-2">Thank you!</h4>
          <p className="text-gray-600 mb-6">
            Your enrollment request for the <span className="font-semibold">{tierName}</span> has been received. 
            Our team will contact you within 24 hours to complete your registration.
          </p>
          <Button onClick={reset} fullWidth>Close</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={reset} title="Complete Enrollment">
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-500 mb-1">Selected Plan</p>
        <div className="flex justify-between items-baseline">
          <h4 className="text-lg font-bold text-primary">{tierName}</h4>
          <span className="text-xl font-bold text-primary">€{price}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input 
            required 
            type="text" 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input 
            required 
            type="email" 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            placeholder="john@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
          <input 
            type="tel" 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            placeholder="+39 ..."
          />
        </div>

        <div className="pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Payment Method</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-primary bg-blue-50/50 p-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer ring-1 ring-primary">
              <CreditCard className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">Card</span>
            </div>
            <div className="border border-gray-200 p-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 opacity-60">
              <Landmark className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Bank Transfer</span>
            </div>
          </div>
        </div>

        <Button type="submit" fullWidth isLoading={loading} className="mt-6">
          Confirm Request
        </Button>
        <p className="text-xs text-center text-gray-400 mt-2">
          No payment is taken at this stage.
        </p>
      </form>
    </Modal>
  );
};

export default PaymentModal;

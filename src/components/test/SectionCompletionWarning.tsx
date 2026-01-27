'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '@/components/shared/Button';
import Modal from '@/components/shared/Modal';

interface SectionCompletionWarningProps {
  isOpen: boolean;
  onClose: () => void;
  sectionName: string;
  unansweredQuestions: number[]; // 1-based question numbers
  onContinue: () => void;
}

const SectionCompletionWarning: React.FC<SectionCompletionWarningProps> = ({
  isOpen,
  onClose,
  sectionName,
  unansweredQuestions,
  onContinue
}) => {
  const handleContinue = () => {
    onClose();
    onContinue();
  };

  const questionList = unansweredQuestions.slice(0, 10).join(', ');
  const hasMore = unansweredQuestions.length > 10;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm" title="Section Not Complete">
      <div>
        <p className="text-sm text-gray-600 mb-4">
          You have <span className="font-semibold">{unansweredQuestions.length}</span> unanswered {unansweredQuestions.length === 1 ? 'question' : 'questions'} in <span className="font-semibold">{sectionName}</span>:
        </p>
        <div className="bg-amber-50 rounded-md p-3 border border-amber-200 mb-6">
          <p className="text-sm text-gray-700">
            Questions: {questionList}{hasMore && `, and ${unansweredQuestions.length - 10} more`}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Review Questions
          </Button>
          <Button
            onClick={handleContinue}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
          >
            Continue
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SectionCompletionWarning;

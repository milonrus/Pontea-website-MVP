import React, { useState } from 'react';
import Button from '@/components/shared/Button';
import { createReport } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { QuestionModel } from '@/types';
import { X, Flag, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReportQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: QuestionModel;
}

const REPORT_REASONS = [
  'Incorrect answer marked as correct',
  'Unclear question',
  'Image not loading',
  'Typo/Grammar error',
  'Incorrect explanation',
  'Other'
];

const ReportQuestionModal: React.FC<ReportQuestionModalProps> = ({
  isOpen,
  onClose,
  question
}) => {
  const { currentUser, userProfile } = useAuth();
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!selectedReason || !currentUser) return;

    setSubmitting(true);
    setError('');

    try {
      await createReport({
        questionId: question.id,
        questionText: question.questionText,
        reportedBy: currentUser.id,
        reporterName: userProfile?.displayName || currentUser.email || 'Anonymous',
        reason: selectedReason === 'Other' && additionalDetails
          ? `Other: ${additionalDetails}`
          : selectedReason,
        status: 'pending'
      });

      setSubmitted(true);

      // Auto-close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting report:', err);
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setAdditionalDetails('');
    setSubmitted(false);
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Report Submitted</h2>
                <p className="text-gray-500">Thank you for helping us improve our questions!</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <Flag className="w-5 h-5 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Report Question</h2>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Question Preview */}
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                    <p className="font-medium text-gray-500 text-xs mb-1">Question:</p>
                    <p className="line-clamp-2">{question.questionText}</p>
                  </div>

                  {/* Reason Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What's wrong with this question? <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {REPORT_REASONS.map(reason => (
                        <label
                          key={reason}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedReason === reason
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="reason"
                            value={reason}
                            checked={selectedReason === reason}
                            onChange={e => setSelectedReason(e.target.value)}
                            className="w-4 h-4 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-gray-700">{reason}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Details {selectedReason === 'Other' && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                      value={additionalDetails}
                      onChange={e => setAdditionalDetails(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                      placeholder="Please describe the issue in more detail..."
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      isLoading={submitting}
                      disabled={!selectedReason || (selectedReason === 'Other' && !additionalDetails.trim())}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Submit Report
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReportQuestionModal;

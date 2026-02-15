import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxWidth?: string;
  headerLeading?: React.ReactNode;
  headerActions?: React.ReactNode;
  viewportPaddingClassName?: string;
  panelMaxHeightClassName?: string;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  maxWidth = 'max-w-lg',
  headerLeading,
  headerActions,
  viewportPaddingClassName = 'p-4 sm:p-6',
  panelMaxHeightClassName = 'max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)]',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${viewportPaddingClassName}`}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className={`relative flex w-full flex-col ${maxWidth} ${panelMaxHeightClassName} overflow-hidden rounded-2xl bg-white shadow-xl`}
          >
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-4 sm:p-5">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {headerLeading}
                <h3 className="min-w-0 flex-1 text-xl font-display font-bold text-primary">{title}</h3>
              </div>
              <div className="flex items-center gap-2">
                {headerActions}
                <button 
                  onClick={onClose}
                  className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;

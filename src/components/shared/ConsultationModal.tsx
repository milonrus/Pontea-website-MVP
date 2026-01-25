import React, { useState } from 'react';
import Modal from './Modal';
import { Loader2 } from 'lucide-react';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConsultationModal: React.FC<ConsultationModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Using the specific Calendly URL provided
  const CALENDLY_URL = "https://calendly.com/my-mulyar/consulation";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Book Your Strategy Call" maxWidth="max-w-5xl">
      <div className="relative w-full h-[700px] bg-white rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-0">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
        <iframe
          src={`${CALENDLY_URL}?hide_gdpr_banner=1&background_color=ffffff&text_color=01278b&primary_color=ffc857`}
          width="100%"
          height="100%"
          frameBorder="0"
          title="Schedule time with me"
          className="relative z-10"
          onLoad={() => setIsLoading(false)}
        ></iframe>
      </div>
    </Modal>
  );
};

export default ConsultationModal;
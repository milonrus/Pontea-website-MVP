import { permanentRedirect } from 'next/navigation';

const EnLegacyThankYouPage = () => {
  permanentRedirect('/thank-you/');
};

export default EnLegacyThankYouPage;

import { permanentRedirect } from 'next/navigation';

const EnLegacyLegalPage = () => {
  permanentRedirect('/legal/');
};

export default EnLegacyLegalPage;

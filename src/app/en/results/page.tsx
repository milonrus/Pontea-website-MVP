import { permanentRedirect } from 'next/navigation';

const EnLegacyResultsPage = () => {
  permanentRedirect('/results/');
};

export default EnLegacyResultsPage;

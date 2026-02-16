import { permanentRedirect } from 'next/navigation';

const EnLegacyTokenResultsPage = async ({
  params
}: {
  params: Promise<{ token: string }>;
}) => {
  const { token } = await params;
  permanentRedirect(`/results/${token}/`);
};

export default EnLegacyTokenResultsPage;

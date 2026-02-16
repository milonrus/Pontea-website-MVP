import { permanentRedirect } from 'next/navigation';

const EnLegacyLegalDocPage = async ({
  params
}: {
  params: Promise<{ doc: string }>;
}) => {
  const { doc } = await params;
  permanentRedirect(`/legal/${doc}/`);
};

export default EnLegacyLegalDocPage;

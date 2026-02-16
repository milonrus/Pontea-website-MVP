import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import ResultsPage from '@/views/ResultsPage';
import { AssessmentResult, DomainResult } from '@/types';
import type { CanonicalRoadmapOutput } from '@/lib/roadmap-generator/types';
import { buildPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({
  params
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;

  return buildPageMetadata({
    title: 'Diagnostic Results',
    description: 'Your personal diagnostic results and preparation roadmap.',
    canonical: `/en/results/${token}`,
    languages: {
      en: `/en/results/${token}`,
      ru: `/ru/results/${token}`
    },
    robots: {
      index: false,
      follow: false
    }
  });
}

export default async function TokenResultsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('assessment_results')
    .select('*')
    .eq('share_token', token)
    .single();

  if (error || !data) {
    notFound();
  }

  const results: AssessmentResult = {
    version: data.version,
    name: data.name ?? undefined,
    email: data.email,
    phone: data.phone ?? undefined,
    consentPersonalData:
      typeof data.consent_personal_data === 'boolean'
        ? data.consent_personal_data
        : undefined,
    consentAt: data.consent_at ?? undefined,
    answers: data.answers,
    domainResults: data.domain_results as DomainResult[],
    weakestDomains: data.weakest_domains as DomainResult[],
    studyPlan: data.study_plan as DomainResult[],
    roadmapOutput: (data.roadmap_output as CanonicalRoadmapOutput) ?? undefined,
    submittedAt: data.submitted_at,
  };

  return <ResultsPage initialResults={results} locale="en" />;
}

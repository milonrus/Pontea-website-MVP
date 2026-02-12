import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import ResultsPage from '@/views/ResultsPage';
import { AssessmentResult, DomainResult } from '@/types';
import type { CanonicalRoadmapOutput } from '@/lib/roadmap-generator/types';

export async function generateMetadata({
  params
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;

  return {
    alternates: {
      canonical: `/ru/results/${token}`
    }
  };
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
    email: data.email,
    answers: data.answers,
    domainResults: data.domain_results as DomainResult[],
    weakestDomains: data.weakest_domains as DomainResult[],
    studyPlan: data.study_plan as DomainResult[],
    roadmapOutput: (data.roadmap_output as CanonicalRoadmapOutput) ?? undefined,
    submittedAt: data.submitted_at,
  };

  return <ResultsPage initialResults={results} />;
}

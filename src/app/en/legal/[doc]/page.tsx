import type { Metadata } from 'next';
import type { ComponentPropsWithoutRef } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import Header from '@/components/shared/Header';
import { EN_LEGAL_DOC_IDS, getEnLegalDoc, isEnLegalDocId } from '@/lib/legal/enLegalDocs';
import { buildPageMetadata } from '@/lib/seo/metadata';

type DocPageParams = {
  doc: string;
};

type MarkdownLinkProps = ComponentPropsWithoutRef<'a'> & {
  href?: string;
};

export function generateStaticParams() {
  return EN_LEGAL_DOC_IDS.map((doc) => ({ doc }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<DocPageParams>;
}): Promise<Metadata> {
  const { doc } = await params;

  if (!isEnLegalDocId(doc)) {
    return buildPageMetadata({
      title: 'Legal Documents',
      description: 'Privacy policy, consent, terms of use, and cookie policy.',
      canonical: '/en/legal',
      languages: {
        en: '/en/legal',
        ru: '/ru/legal'
      }
    });
  }

  const legalDoc = await getEnLegalDoc(doc);

  return buildPageMetadata({
    title: legalDoc.title,
    description: `${legalDoc.title} PONTEA School.`,
    canonical: `/en/legal/${doc}`,
    languages: {
      en: `/en/legal/${doc}`,
      ru: `/ru/legal/${doc}`
    }
  });
}

const EnLegalDocPage = async ({
  params
}: {
  params: Promise<DocPageParams>;
}) => {
  const { doc } = await params;

  if (!isEnLegalDocId(doc)) {
    notFound();
  }

  const legalDoc = await getEnLegalDoc(doc);

  return (
    <div className="min-h-screen bg-white">
      <Header locale="en" />
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-28 text-black">
        <Link
          href="/en/legal"
          className="mb-6 inline-block text-sm font-medium text-black underline underline-offset-4 transition-colors hover:text-black/70"
        >
          Back to documents
        </Link>

        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="mb-4 text-4xl font-bold text-black">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="mb-3 mt-7 text-2xl font-semibold text-black">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="mb-2 mt-5 text-xl font-semibold text-black">{children}</h3>
            ),
            p: ({ children }) => <p className="mb-3 leading-7 text-black">{children}</p>,
            ul: ({ children }) => <ul className="mb-4 list-disc space-y-2 pl-6 text-black">{children}</ul>,
            ol: ({ children }) => (
              <ol className="mb-4 list-decimal space-y-2 pl-6 text-black">{children}</ol>
            ),
            li: ({ children }) => <li className="leading-7">{children}</li>,
            a: ({ href, children, ...props }: MarkdownLinkProps) => (
              <a
                href={href}
                {...props}
                className="font-medium text-black underline underline-offset-2 transition-colors hover:text-black/70"
              >
                {children}
              </a>
            ),
            strong: ({ children }) => <strong className="font-semibold text-black">{children}</strong>
          }}
        >
          {legalDoc.content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default EnLegalDocPage;

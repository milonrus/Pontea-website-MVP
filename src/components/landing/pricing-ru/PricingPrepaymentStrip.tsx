import React from 'react';
import Button from '@/components/shared/Button';
import { PricingLocale } from './types';

interface PricingPrepaymentStripProps {
  locale: PricingLocale;
  onOpen: () => void;
}

const PricingPrepaymentStrip: React.FC<PricingPrepaymentStripProps> = ({
  locale,
  onOpen,
}) => {
  const t = locale === 'en'
    ? {
        title: 'Pay a deposit and lock your discounted price. Pay the remaining balance later.',
        cta: 'Lock price for EUR 100',
      }
    : {
        title: 'Внесите предоплату и зафиксируйте цену со\u00A0скидкой. Остаток оплатите позже.',
        cta: 'Зафиксировать цену за €100',
      };

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-slate-300/70 bg-white px-5 py-4 shadow-[0_24px_70px_-52px_rgba(1,39,139,0.45)] sm:px-6 sm:py-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-20 h-44 w-44 rounded-full bg-accent/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 right-[-10%] h-48 w-48 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative z-10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="max-w-[52ch] text-[16px] font-semibold leading-[1.25] text-slate-900 sm:text-[18px]">
            {t.title}
          </p>
        </div>

        <div className="shrink-0">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onOpen}
            className="!rounded-lg !font-semibold"
          >
            {t.cta}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PricingPrepaymentStrip;

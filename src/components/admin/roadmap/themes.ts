import { CSSProperties } from 'react';
import {
  Bebas_Neue,
  Fira_Code,
  Fira_Sans,
  Lora,
  Manrope
} from 'next/font/google';
import { ExamPart } from '@/lib/roadmap-generator/types';
import { RoadmapViewMode, VisualPhaseId } from '@/components/admin/roadmap/types';

const bebasNeue = Bebas_Neue({ subsets: ['latin'], weight: ['400'] });
const firaCode = Fira_Code({ subsets: ['latin'], weight: ['500', '600'] });
const firaSans = Fira_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] });
const lora = Lora({ subsets: ['latin'], weight: ['400', '500', '700'] });
const manrope = Manrope({ subsets: ['latin'], weight: ['500', '700'] });

export interface RoadmapThemeDefinition {
  mode: RoadmapViewMode;
  title: string;
  subtitle: string;
  headingClass: string;
  bodyClass: string;
  wrapperClass: string;
  cardClass: string;
  chipClass: string;
  style: CSSProperties;
}

export const ROADMAP_VIEW_OPTIONS: Array<{ mode: RoadmapViewMode; title: string; hint: string }> = [
  {
    mode: 'results_matrix',
    title: 'Results Matrix',
    hint: 'Same section-by-sprint matrix used on the results page'
  },
  {
    mode: 'rhythm_heatboard',
    title: 'Rhythm Dashboard',
    hint: 'Workload matrix by sprint and exam part'
  },
  {
    mode: 'simple_modules',
    title: 'Simple Modules',
    hint: 'Clean sprint cards with modules only'
  },
  {
    mode: 'command_center',
    title: 'Command Center',
    hint: 'Premium sprint navigator with high-signal execution board'
  }
];

export const EXAM_PART_COLORS: Record<ExamPart, string> = {
  READING: '#1d4ed8',
  LOGIC: '#0f766e',
  DRAWING: '#b45309',
  MATH_PHYSICS: '#9333ea',
  GENERAL_KNOWLEDGE: '#b91c1c'
};

export const PHASE_ACCENTS: Record<VisualPhaseId, string> = {
  launch: '#f97316',
  build: '#0ea5e9',
  focus: '#84cc16',
  final: '#e11d48'
};

export const ROADMAP_THEMES: Record<RoadmapViewMode, RoadmapThemeDefinition> = {
  results_matrix: {
    mode: 'results_matrix',
    title: 'Results Matrix',
    subtitle: 'Production matrix from student results: sections by sprint with module details.',
    headingClass: lora.className,
    bodyClass: manrope.className,
    wrapperClass:
      'rounded-[30px] border border-blue-200 shadow-[0_20px_60px_-42px_rgba(29,78,216,0.28)] overflow-hidden',
    cardClass: 'bg-white/92 border border-blue-100 backdrop-blur',
    chipClass: 'bg-blue-50 text-blue-900 border border-blue-200',
    style: {
      background:
        'radial-gradient(760px 260px at 5% -8%, rgba(59,130,246,0.18), transparent 56%), radial-gradient(980px 400px at 104% 0%, rgba(14,165,233,0.14), transparent 62%), linear-gradient(180deg, #f8fbff 0%, #ffffff 58%, #f8fafc 100%)',
      ['--roadmap-tone-strong' as string]: '#1d4ed8',
      ['--roadmap-tone-mid' as string]: '#2563eb',
      ['--roadmap-tone-soft' as string]: '#60a5fa'
    }
  },
  rhythm_heatboard: {
    mode: 'rhythm_heatboard',
    title: 'Rhythm Dashboard',
    subtitle: 'Poster-like analytics wall for workload waves and sprint tempo.',
    headingClass: bebasNeue.className,
    bodyClass: lora.className,
    wrapperClass:
      'rounded-[30px] border border-amber-200 shadow-[0_24px_76px_-42px_rgba(161,98,7,0.5)] overflow-hidden',
    cardClass: 'bg-amber-50/78 border border-amber-200 backdrop-blur',
    chipClass: 'bg-amber-100 text-amber-950 border border-amber-300',
    style: {
      background:
        'radial-gradient(860px 280px at 16% -12%, rgba(251,191,36,0.3), transparent 58%), radial-gradient(1080px 420px at 94% 0%, rgba(251,146,60,0.25), transparent 62%), linear-gradient(180deg, #fffbeb 0%, #fefce8 48%, #fff7ed 100%)',
      ['--roadmap-tone-strong' as string]: '#ea580c',
      ['--roadmap-tone-mid' as string]: '#f97316',
      ['--roadmap-tone-soft' as string]: '#fdba74'
    }
  },
  simple_modules: {
    mode: 'simple_modules',
    title: 'Simple Modules',
    subtitle: 'A clean sprint-by-sprint module checklist with no workload metrics.',
    headingClass: lora.className,
    bodyClass: manrope.className,
    wrapperClass:
      'rounded-[30px] border border-slate-300 shadow-[0_18px_52px_-38px_rgba(15,23,42,0.25)] overflow-hidden',
    cardClass: 'bg-white/95 border border-slate-200 backdrop-blur',
    chipClass: 'bg-slate-100 text-slate-900 border border-slate-300',
    style: {
      background:
        'radial-gradient(900px 360px at -6% -16%, rgba(148,163,184,0.14), transparent 56%), radial-gradient(920px 320px at 105% -8%, rgba(186,230,253,0.16), transparent 60%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
      ['--roadmap-tone-strong' as string]: '#334155',
      ['--roadmap-tone-mid' as string]: '#64748b',
      ['--roadmap-tone-soft' as string]: '#94a3b8'
    }
  },
  command_center: {
    mode: 'command_center',
    title: 'Command Center',
    subtitle: 'Interactive execution board with sprint navigator, focus checkpoints, and module lanes.',
    headingClass: firaCode.className,
    bodyClass: firaSans.className,
    wrapperClass:
      'rounded-[30px] border border-cyan-200 shadow-[0_26px_72px_-40px_rgba(8,145,178,0.42)] overflow-hidden',
    cardClass: 'bg-white/92 border border-cyan-100 backdrop-blur',
    chipClass: 'bg-cyan-50 text-cyan-900 border border-cyan-200',
    style: {
      background:
        'radial-gradient(980px 380px at -8% -16%, rgba(34,211,238,0.22), transparent 58%), radial-gradient(1020px 420px at 104% -4%, rgba(56,189,248,0.18), transparent 62%), linear-gradient(180deg, #ecfeff 0%, #f8fdff 58%, #ffffff 100%)',
      ['--roadmap-tone-strong' as string]: '#0891b2',
      ['--roadmap-tone-mid' as string]: '#0ea5e9',
      ['--roadmap-tone-soft' as string]: '#67e8f9'
    }
  }
};

export const getRoadmapTheme = (mode: RoadmapViewMode): RoadmapThemeDefinition =>
  ROADMAP_THEMES[mode];

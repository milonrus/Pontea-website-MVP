'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Trophy,
  BookOpen,
  Sparkles,
  GraduationCap,
  Zap,
  Target,
  Star,
  ArrowRight,
  TrendingUp,
  Palette,
} from 'lucide-react';

type ColorScheme = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  vibe: string;
  reference: string;
  accent: string;
  secondary: string;
};

const PRIMARY = '#01278b';

// Derive a light tint from a hex color for backgrounds
function hexToLightBg(hex: string, opacity: number = 0.08): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(255 - (255 - r) * opacity);
  const lg = Math.round(255 - (255 - g) * opacity);
  const lb = Math.round(255 - (255 - b) * opacity);
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

const colorSchemes: ColorScheme[] = [
  {
    id: 'blueprint',
    name: 'Blueprint',
    tagline: 'Academic Excellence',
    description:
      'Classic university feel with steel blue and scholarly gold. Trustworthy and authoritative — the established institution vibe.',
    vibe: 'Professional, trustworthy, prestigious',
    reference: 'Oxford, Harvard, Coursera',
    accent: '#3B82F6',
    secondary: '#D4AF37',
  },
  {
    id: 'aurora',
    name: 'Northern Lights',
    tagline: 'Modern & Inspiring',
    description:
      'Electric violet meets cyan. Futuristic yet approachable — like a platform built for the next generation of architects.',
    vibe: 'Innovative, energetic, future-forward',
    reference: 'Linear, Vercel, Figma',
    accent: '#7C3AED',
    secondary: '#06B6D4',
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    tagline: 'Warm & Architectural',
    description:
      'Terracotta and warm gold — colors born from Mediterranean architecture. Perfect for students dreaming of designing beautiful spaces.',
    vibe: 'Cultural, warm, grounded in tradition',
    reference: 'Airbnb, Pinterest, Architectural Digest',
    accent: '#C2703E',
    secondary: '#E8A838',
  },
  {
    id: 'glacier',
    name: 'Glacier',
    tagline: 'Clean & Focused',
    description:
      'Sky blue and a touch of coral. Scandinavian-inspired clarity that lets content breathe. Minimal distraction, maximum focus.',
    vibe: 'Minimal, clean, Scandinavian calm',
    reference: 'Notion, Stripe, Apple',
    accent: '#0EA5E9',
    secondary: '#FB7185',
  },
  {
    id: 'atelier',
    name: 'Atelier',
    tagline: 'Creative & Bold',
    description:
      'Magenta and electric indigo — a design studio palette. Bold and expressive for students who see architecture as art.',
    vibe: 'Creative, expressive, design-forward',
    reference: 'Dribbble, Behance, Pentagram',
    accent: '#DB2777',
    secondary: '#6366F1',
  },
  {
    id: 'ivory',
    name: 'Ivory Tower',
    tagline: 'Premium & Refined',
    description:
      'Burgundy and old gold — the color language of prestige. For a premium prep experience that feels exclusive.',
    vibe: 'Prestigious, refined, exclusive',
    reference: 'The Economist, Monocle, Yale',
    accent: '#9F1239',
    secondary: '#BFA14A',
  },
];

const ColorSchemeDemo: React.FC = () => {
  const [selectedScheme, setSelectedScheme] = useState<string>('blueprint');
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const scheme =
    colorSchemes.find((s) => s.id === selectedScheme) || colorSchemes[0];

  const bgSoft = hexToLightBg(scheme.accent, 0.06);
  const bgCard = hexToLightBg(scheme.secondary, 0.08);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(label);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="py-20 bg-gradient-to-b from-white via-gray-50/50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 text-primary text-xs font-bold uppercase tracking-wider mb-4 border border-primary/10">
            <Palette className="w-3.5 h-3.5" />
            Design Exploration
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-primary mb-4">
            Color Scheme Lab
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Each palette pairs two accent colors with our dark blue primary.
            Simple, focused, easy to evaluate at a glance.
          </p>
        </div>

        {/* Scheme Selector */}
        <div className="mb-14">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {colorSchemes.map((s) => {
              const isActive = selectedScheme === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedScheme(s.id)}
                  className={`
                    relative group rounded-2xl p-4 text-left transition-all duration-300 border-2
                    ${
                      isActive
                        ? 'border-primary bg-white shadow-xl shadow-primary/10 scale-[1.02]'
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
                    }
                  `}
                >
                  {/* Color dots: primary + accent + secondary */}
                  <div className="flex gap-1.5 mb-3">
                    <div
                      className="w-5 h-5 rounded-full shadow-sm ring-1 ring-black/5"
                      style={{ backgroundColor: PRIMARY }}
                    />
                    <div
                      className="w-5 h-5 rounded-full shadow-sm ring-1 ring-black/5"
                      style={{ backgroundColor: s.accent }}
                    />
                    <div
                      className="w-5 h-5 rounded-full shadow-sm ring-1 ring-black/5"
                      style={{ backgroundColor: s.secondary }}
                    />
                  </div>
                  <div className="font-bold text-sm text-primary">{s.name}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {s.tagline}
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="scheme-indicator"
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedScheme}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Info Bar + Palette */}
            <div className="grid lg:grid-cols-3 gap-6 mb-10">
              {/* Info */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${PRIMARY}, ${scheme.accent})`,
                    }}
                  >
                    {scheme.name[0]}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-primary">
                      {scheme.name}
                    </h3>
                    <p className="text-sm text-gray-400">{scheme.reference}</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-5 leading-relaxed">
                  {scheme.description}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-primary">Mood:</span>
                  <span className="text-gray-500 italic">{scheme.vibe}</span>
                </div>
              </div>

              {/* Palette Panel */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h4 className="font-bold text-primary text-sm uppercase tracking-wider mb-4">
                  Palette
                </h4>
                <div className="space-y-2.5">
                  {/* Primary — locked */}
                  <div
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-gray-50/50 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => copyToClipboard(PRIMARY, 'Primary')}
                  >
                    <div
                      className="w-9 h-9 rounded-lg shadow-sm ring-1 ring-black/5 flex-shrink-0"
                      style={{ backgroundColor: PRIMARY }}
                    />
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-xs font-bold text-gray-700">Primary</div>
                      <div className="text-[10px] text-gray-400">Foundation (locked)</div>
                    </div>
                    <div className="text-[10px] font-mono text-gray-400">
                      {copiedColor === 'Primary' ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        PRIMARY
                      )}
                    </div>
                  </div>

                  {/* Accent */}
                  <div
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => copyToClipboard(scheme.accent, 'Accent')}
                  >
                    <div
                      className="w-9 h-9 rounded-lg shadow-sm ring-1 ring-black/5 flex-shrink-0"
                      style={{ backgroundColor: scheme.accent }}
                    />
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-xs font-bold text-gray-700">Accent</div>
                      <div className="text-[10px] text-gray-400">Buttons & Actions</div>
                    </div>
                    <div className="text-[10px] font-mono text-gray-400">
                      {copiedColor === 'Accent' ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        scheme.accent
                      )}
                    </div>
                  </div>

                  {/* Secondary */}
                  <div
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => copyToClipboard(scheme.secondary, 'Secondary')}
                  >
                    <div
                      className="w-9 h-9 rounded-lg shadow-sm ring-1 ring-black/5 flex-shrink-0"
                      style={{ backgroundColor: scheme.secondary }}
                    />
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-xs font-bold text-gray-700">Secondary</div>
                      <div className="text-[10px] text-gray-400">Highlights & Accents</div>
                    </div>
                    <div className="text-[10px] font-mono text-gray-400">
                      {copiedColor === 'Secondary' ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        scheme.secondary
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ========== LIVE PREVIEWS ========== */}

            {/* 1. Hero Preview */}
            <div className="mb-8 rounded-2xl overflow-hidden shadow-xl border border-gray-100">
              <div
                className="relative p-10 md:p-16"
                style={{
                  background: `linear-gradient(135deg, ${PRIMARY} 0%, ${scheme.accent}22 60%, ${scheme.secondary}18 100%)`,
                }}
              >
                {/* Decorative orbs */}
                <div
                  className="absolute top-10 right-10 w-72 h-72 rounded-full blur-3xl opacity-20"
                  style={{ backgroundColor: scheme.accent }}
                />
                <div
                  className="absolute bottom-0 left-20 w-56 h-56 rounded-full blur-3xl opacity-15"
                  style={{ backgroundColor: scheme.secondary }}
                />

                <div className="relative z-10 max-w-2xl">
                  {/* Badge */}
                  <div
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border"
                    style={{
                      backgroundColor: scheme.accent + '20',
                      color: scheme.secondary,
                      borderColor: scheme.secondary + '30',
                    }}
                  >
                    <Star className="w-3 h-3" style={{ color: scheme.secondary }} />
                    Enrollment Open 2026
                  </div>

                  <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 leading-tight">
                    Your{' '}
                    <span
                      style={{
                        color: scheme.secondary,
                        textShadow: `0 0 40px ${scheme.secondary}40`,
                      }}
                    >
                      Architecture
                    </span>{' '}
                    Career Starts Here
                  </h1>
                  <p className="text-lg text-blue-100/80 mb-8 leading-relaxed">
                    From zero knowledge to exam mastery — our Knowledge Matrix
                    system tracks every step of your preparation journey.
                  </p>

                  <div className="flex flex-wrap gap-4">
                    <button
                      className="px-8 py-3.5 rounded-xl font-bold text-white shadow-xl transition-all hover:scale-105 flex items-center gap-2"
                      style={{
                        backgroundColor: scheme.accent,
                        boxShadow: `0 12px 30px ${scheme.accent}40`,
                      }}
                    >
                      Get Study Plan
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      className="px-8 py-3.5 rounded-xl font-bold border-2 transition-all hover:scale-105"
                      style={{
                        borderColor: scheme.secondary + '60',
                        color: scheme.secondary,
                      }}
                    >
                      View Pricing
                    </button>
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-8 mt-10">
                    {[
                      { num: '2,400+', label: 'Students' },
                      { num: '94%', label: 'Pass Rate' },
                      { num: '4.9', label: 'Rating' },
                    ].map((stat, i) => (
                      <div key={i}>
                        <div
                          className="text-2xl font-bold"
                          style={{ color: scheme.secondary }}
                        >
                          {stat.num}
                        </div>
                        <div className="text-xs text-blue-200/60">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Component Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Buttons */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h4 className="font-bold text-primary mb-4 text-sm">
                  Button System
                </h4>
                <div className="space-y-3">
                  <button
                    className="w-full py-3 px-6 rounded-xl font-bold text-white transition-all hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: scheme.accent,
                      boxShadow: `0 8px 20px ${scheme.accent}30`,
                    }}
                  >
                    <Zap className="w-4 h-4" />
                    Primary Action
                  </button>
                  <button
                    className="w-full py-3 px-6 rounded-xl font-bold border-2 transition-all hover:scale-[1.02]"
                    style={{
                      borderColor: scheme.accent,
                      color: scheme.accent,
                    }}
                  >
                    Secondary Action
                  </button>
                  <button
                    className="w-full py-3 px-6 rounded-xl font-bold transition-all hover:scale-[1.02]"
                    style={{
                      backgroundColor: bgSoft,
                      color: PRIMARY,
                    }}
                  >
                    Tertiary Action
                  </button>
                </div>
              </div>

              {/* Badges & Pills */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h4 className="font-bold text-primary mb-4 text-sm">
                  Badges & Labels
                </h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span
                    className="px-3 py-1.5 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: scheme.accent }}
                  >
                    New Course
                  </span>
                  <span
                    className="px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: scheme.secondary + '20',
                      color: scheme.secondary,
                    }}
                  >
                    Premium
                  </span>
                </div>
                <div className="flex gap-2">
                  <div
                    className="flex-1 p-3 rounded-xl text-center"
                    style={{ backgroundColor: bgSoft }}
                  >
                    <div
                      className="text-xl font-bold"
                      style={{ color: scheme.accent }}
                    >
                      85
                    </div>
                    <div className="text-[10px] text-gray-400">Score</div>
                  </div>
                  <div
                    className="flex-1 p-3 rounded-xl text-center"
                    style={{ backgroundColor: bgCard }}
                  >
                    <div
                      className="text-xl font-bold"
                      style={{ color: scheme.secondary }}
                    >
                      A+
                    </div>
                    <div className="text-[10px] text-gray-400">Grade</div>
                  </div>
                </div>
              </div>

              {/* Progress & Achievement */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h4 className="font-bold text-primary mb-4 text-sm">
                  Progress Tracking
                </h4>
                <div className="space-y-4">
                  {[
                    { label: 'Reading Comp', pct: 82 },
                    { label: 'Logical Reasoning', pct: 65 },
                    { label: 'History', pct: 45 },
                    { label: 'Drawing Skills', pct: 30 },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-semibold text-gray-600">
                          {item.label}
                        </span>
                        <span
                          className="font-bold"
                          style={{ color: scheme.accent }}
                        >
                          {item.pct}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: scheme.accent }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Cards */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h4 className="font-bold text-primary mb-4 text-sm">
                  Feature Cards
                </h4>
                <div className="space-y-3">
                  {[
                    {
                      icon: GraduationCap,
                      title: 'Expert Teachers',
                      color: scheme.accent,
                      bg: bgSoft,
                    },
                    {
                      icon: Target,
                      title: 'Targeted Practice',
                      color: scheme.secondary,
                      bg: bgCard,
                    },
                    {
                      icon: TrendingUp,
                      title: 'Score Guarantee',
                      color: scheme.accent,
                      bg: bgSoft,
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02] cursor-pointer"
                      style={{ backgroundColor: item.bg }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
                        style={{
                          backgroundColor: item.color + '20',
                        }}
                      >
                        <item.icon
                          className="w-5 h-5"
                          style={{ color: item.color }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm text-primary">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          Click to explore
                        </div>
                      </div>
                      <ArrowRight
                        className="w-4 h-4"
                        style={{ color: item.color }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Text & Gradient Showcase */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h4 className="font-bold text-primary mb-4 text-sm">
                  Text & Gradients
                </h4>
                <div className="space-y-4">
                  <h3
                    className="text-3xl font-bold bg-clip-text text-transparent"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${PRIMARY} 0%, ${scheme.accent} 100%)`,
                    }}
                  >
                    Amazing Results
                  </h3>
                  <h3
                    className="text-3xl font-bold bg-clip-text text-transparent"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${scheme.accent} 0%, ${scheme.secondary} 100%)`,
                    }}
                  >
                    Top Performers
                  </h3>
                  <div
                    className="h-3 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${PRIMARY}, ${scheme.accent}, ${scheme.secondary})`,
                    }}
                  />
                  <div className="flex gap-2">
                    <div
                      className="flex-1 h-16 rounded-lg"
                      style={{
                        background: `linear-gradient(135deg, ${PRIMARY}, ${scheme.accent})`,
                      }}
                    />
                    <div
                      className="flex-1 h-16 rounded-lg"
                      style={{
                        background: `linear-gradient(135deg, ${scheme.accent}, ${scheme.secondary})`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Accents & Shadows */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h4 className="font-bold text-primary mb-4 text-sm">
                  Card Accents
                </h4>
                <div className="space-y-3">
                  <div
                    className="border-l-4 p-4 rounded-lg"
                    style={{
                      borderColor: scheme.accent,
                      backgroundColor: bgSoft,
                    }}
                  >
                    <div className="font-bold text-primary text-sm">Pro Tip</div>
                    <div className="text-xs text-gray-500">
                      Review weak areas before the exam.
                    </div>
                  </div>
                  <div
                    className="p-4 rounded-xl flex items-center gap-3"
                    style={{
                      backgroundColor: scheme.secondary + '10',
                      border: `1px solid ${scheme.secondary}25`,
                    }}
                  >
                    <Trophy
                      className="w-8 h-8"
                      style={{ color: scheme.secondary }}
                    />
                    <div>
                      <div className="font-bold text-primary text-sm">
                        Achievement Unlocked
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Completed 100 practice questions
                      </div>
                    </div>
                  </div>
                  <div
                    className="h-16 rounded-xl flex items-center justify-center text-white font-bold shadow-xl"
                    style={{
                      background: `linear-gradient(135deg, ${scheme.accent}, ${scheme.secondary})`,
                      boxShadow: `0 16px 40px ${scheme.accent}30`,
                    }}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Glow Effect
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Pricing Card Preview */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[
                {
                  name: 'Starter',
                  price: '€29',
                  desc: 'Self-paced essentials',
                  color: scheme.secondary,
                  featured: false,
                },
                {
                  name: 'Professional',
                  price: '€69',
                  desc: 'Full access + mentoring',
                  color: scheme.accent,
                  featured: true,
                },
                {
                  name: 'Elite',
                  price: '€129',
                  desc: '1-on-1 coaching & guarantee',
                  color: scheme.secondary,
                  featured: false,
                },
              ].map((plan, i) => (
                <div
                  key={i}
                  className={`rounded-2xl p-6 border transition-all ${
                    plan.featured
                      ? 'shadow-2xl scale-[1.03] border-2'
                      : 'shadow-lg border-gray-100 bg-white'
                  }`}
                  style={
                    plan.featured
                      ? {
                          borderColor: plan.color,
                          background: `linear-gradient(180deg, white 0%, ${plan.color}08 100%)`,
                        }
                      : {}
                  }
                >
                  {plan.featured && (
                    <div
                      className="text-[10px] font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full inline-block text-white"
                      style={{ backgroundColor: plan.color }}
                    >
                      Most Popular
                    </div>
                  )}
                  <div
                    className="text-sm font-bold mb-1"
                    style={{ color: plan.color }}
                  >
                    {plan.name}
                  </div>
                  <div className="text-3xl font-bold text-primary mb-1">
                    {plan.price}
                    <span className="text-sm text-gray-400 font-normal">
                      /month
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mb-4">{plan.desc}</div>
                  <div className="space-y-2 mb-5">
                    {['Practice Tests', 'Video Lessons', 'Progress Tracking'].map(
                      (feat, j) => (
                        <div
                          key={j}
                          className="flex items-center gap-2 text-xs text-gray-600"
                        >
                          <Check
                            className="w-3.5 h-3.5"
                            style={{ color: plan.color }}
                          />
                          {feat}
                        </div>
                      )
                    )}
                  </div>
                  <button
                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] ${
                      plan.featured ? 'text-white shadow-lg' : 'border-2'
                    }`}
                    style={
                      plan.featured
                        ? {
                            backgroundColor: plan.color,
                            boxShadow: `0 8px 20px ${plan.color}30`,
                          }
                        : {
                            borderColor: plan.color,
                            color: plan.color,
                          }
                    }
                  >
                    {plan.featured ? 'Get Started' : 'Learn More'}
                  </button>
                </div>
              ))}
            </div>

            {/* 4. How Colors Work Together */}
            <div
              className="rounded-2xl p-8 border"
              style={{
                backgroundColor: bgSoft,
                borderColor: scheme.accent + '15',
              }}
            >
              <h4 className="font-bold text-primary mb-6 text-center text-sm uppercase tracking-wider">
                How Colors Work Together
              </h4>
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    icon: BookOpen,
                    label: 'Foundation',
                    sublabel: 'Primary',
                    color: PRIMARY,
                  },
                  {
                    icon: Zap,
                    label: 'Actions',
                    sublabel: 'Accent',
                    color: scheme.accent,
                  },
                  {
                    icon: Star,
                    label: 'Highlights',
                    sublabel: 'Secondary',
                    color: scheme.secondary,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center text-center bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-sm"
                      style={{
                        backgroundColor: item.color + '15',
                      }}
                    >
                      <item.icon
                        className="w-6 h-6"
                        style={{ color: item.color }}
                      />
                    </div>
                    <div className="font-bold text-sm text-primary">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-gray-400">{item.sublabel}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ColorSchemeDemo;

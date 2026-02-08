'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, Download, Trophy, Users, BookOpen, Sparkles } from 'lucide-react';

type ColorScheme = {
  id: string;
  name: string;
  description: string;
  vibe: string;
  accent: string;
  supporting: string;
  tertiary: string;
  brandGreen: string;
  brandPurple: string;
  brandPink: string;
  accentClass: string;
  supportingClass: string;
  tertiaryClass: string;
  reference: string;
};

const colorSchemes: ColorScheme[] = [
  {
    id: 'current',
    name: 'Current (Yellow)',
    description: 'Original sunny yellow scheme',
    vibe: 'Optimistic, energetic, warm',
    accent: '#FFC857',
    supporting: '#4ecca3',
    tertiary: '#FFC857',
    brandGreen: '#ECF8B4',
    brandPurple: '#E0DFF8',
    brandPink: '#FCEAEB',
    accentClass: 'accent',
    supportingClass: 'teal',
    tertiaryClass: 'accent',
    reference: 'Current design',
  },
  {
    id: 'sakura',
    name: 'Sakura Bloom',
    description: 'Pink & Coral - Warm, approachable, energetic',
    vibe: 'Youthful, Instagram-worthy, vibrant',
    accent: '#FF6B9D',
    supporting: '#FF8FA3',
    tertiary: '#FFB6C1',
    brandGreen: '#FFE4E9',
    brandPurple: '#FFF0F5',
    brandPink: '#FFD6E0',
    accentClass: 'accent-sakura',
    supportingClass: 'supporting-sakura',
    tertiaryClass: 'tertiary-sakura',
    reference: 'Dribbble, Instagram',
  },
  {
    id: 'neon',
    name: 'Neon Midnight',
    description: 'Electric Purple & Magenta - Bold, futuristic, premium',
    vibe: 'Innovative, design-savvy, tech-forward',
    accent: '#C77DFF',
    supporting: '#E0AAFF',
    tertiary: '#7B2CBF',
    brandGreen: '#F3E8FF',
    brandPurple: '#EDE7F6',
    brandPink: '#E8DAFF',
    accentClass: 'accent-neon',
    supportingClass: 'supporting-neon',
    tertiaryClass: 'tertiary-neon',
    reference: 'Stripe, Linear',
  },
  {
    id: 'sunset',
    name: 'Sunset Beach',
    description: 'Coral & Peach - Optimistic, fresh, creative',
    vibe: 'Mediterranean, human-centered, accessible',
    accent: '#FF6F61',
    supporting: '#FFB199',
    tertiary: '#FFA07A',
    brandGreen: '#FFE5D9',
    brandPurple: '#FFF4ED',
    brandPink: '#FFD4C8',
    accentClass: 'accent-sunset',
    supportingClass: 'supporting-sunset',
    tertiaryClass: 'tertiary-sunset',
    reference: 'Airbnb, Notion',
  },
  {
    id: 'emerald',
    name: 'Emerald Garden',
    description: 'Mint & Sage - Calm, natural, sustainable',
    vibe: 'Focused, eco-conscious, minimalist',
    accent: '#10B981',
    supporting: '#6EE7B7',
    tertiary: '#34D399',
    brandGreen: '#D1FAE5',
    brandPurple: '#F0FDF4',
    brandPink: '#E0F2E9',
    accentClass: 'accent-emerald',
    supportingClass: 'supporting-emerald',
    tertiaryClass: 'tertiary-emerald',
    reference: 'Notion, Calm',
  },
  {
    id: 'crimson',
    name: 'Crimson Energy',
    description: 'Red-Orange & Tangerine - Passionate, energetic, bold',
    vibe: 'Ambitious, high-energy, driven',
    accent: '#FF5722',
    supporting: '#FF7043',
    tertiary: '#FF8A65',
    brandGreen: '#FFE8E0',
    brandPurple: '#FFF3E0',
    brandPink: '#FFCCBC',
    accentClass: 'accent-crimson',
    supportingClass: 'supporting-crimson',
    tertiaryClass: 'tertiary-crimson',
    reference: 'Material Design',
  },
];

const ColorSchemeDemo: React.FC = () => {
  const [selectedScheme, setSelectedScheme] = useState<string>('current');
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const currentScheme = colorSchemes.find((s) => s.id === selectedScheme) || colorSchemes[0];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(label);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const exportTailwindConfig = () => {
    const config = `// Add to tailwind.config.cjs colors:
"accent": "${currentScheme.accent}",
"supporting": "${currentScheme.supporting}",
"tertiary": "${currentScheme.tertiary}",
"brand-green": "${currentScheme.brandGreen}",
"brand-purple": "${currentScheme.brandPurple}",
"brand-pink": "${currentScheme.brandPink}"`;

    copyToClipboard(config, 'config');
  };

  return (
    <div className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-display font-bold text-primary mb-4">
            Color Scheme Variations
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore 5 bold, distinctive color schemes. Each variation maintains the professional blue foundation while experimenting with different accent colors and emotional tones.
          </p>
        </div>

        {/* Scheme Selector */}
        <div className="mb-12">
          <div className="flex flex-wrap gap-3 justify-center">
            {colorSchemes.map((scheme) => (
              <button
                key={scheme.id}
                onClick={() => setSelectedScheme(scheme.id)}
                className={`
                  px-6 py-3 rounded-xl font-semibold transition-all duration-200
                  ${
                    selectedScheme === scheme.id
                      ? 'bg-primary text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: scheme.accent }}
                  />
                  {scheme.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedScheme}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Scheme Info */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold text-primary mb-2">
                    {currentScheme.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{currentScheme.description}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-primary">Vibe:</span>
                      <span className="text-gray-600">{currentScheme.vibe}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-primary">Reference:</span>
                      <span className="text-gray-600">{currentScheme.reference}</span>
                    </div>
                  </div>
                </div>

                {/* Color Palette */}
                <div>
                  <h4 className="font-bold text-primary mb-3">Color Palette</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Accent', color: currentScheme.accent },
                      { label: 'Supporting', color: currentScheme.supporting },
                      { label: 'Tertiary', color: currentScheme.tertiary },
                      { label: 'Brand Green', color: currentScheme.brandGreen },
                      { label: 'Brand Purple', color: currentScheme.brandPurple },
                      { label: 'Brand Pink', color: currentScheme.brandPink },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => copyToClipboard(item.color, item.label)}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                      >
                        <div
                          className="w-10 h-10 rounded-lg shadow-sm border border-gray-200"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="flex-1 text-left">
                          <div className="text-xs font-semibold text-gray-700">
                            {item.label}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {item.color}
                          </div>
                        </div>
                        {copiedColor === item.label ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={exportTailwindConfig}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors text-sm font-semibold"
                  >
                    <Download className="w-4 h-4" />
                    {copiedColor === 'config' ? 'Copied!' : 'Export Tailwind Config'}
                  </button>
                </div>
              </div>
            </div>

            {/* Live Preview Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Gradient Background */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <h4 className="font-bold text-primary mb-3 text-sm">Gradient Background</h4>
                <div
                  className="h-32 rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, #01278b 0%, ${currentScheme.supporting} 50%, ${currentScheme.accent} 100%)`,
                  }}
                />
              </div>

              {/* Primary Button */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <h4 className="font-bold text-primary mb-3 text-sm">Primary Button</h4>
                <button
                  className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-all hover:scale-105"
                  style={{ backgroundColor: currentScheme.accent }}
                >
                  Get Started
                </button>
              </div>

              {/* Secondary Button */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <h4 className="font-bold text-primary mb-3 text-sm">Secondary Button</h4>
                <button
                  className="w-full py-3 px-6 rounded-lg font-semibold border-2 transition-all hover:scale-105"
                  style={{
                    borderColor: currentScheme.accent,
                    color: currentScheme.accent,
                  }}
                >
                  Learn More
                </button>
              </div>

              {/* Badge/Pill */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <h4 className="font-bold text-primary mb-3 text-sm">Badge Component</h4>
                <div className="flex gap-2 flex-wrap">
                  <span
                    className="px-4 py-2 rounded-full text-sm font-semibold"
                    style={{
                      backgroundColor: currentScheme.brandGreen,
                      color: currentScheme.accent,
                    }}
                  >
                    New Feature
                  </span>
                  <span
                    className="px-4 py-2 rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: currentScheme.accent }}
                  >
                    Featured
                  </span>
                </div>
              </div>

              {/* Card with Accent Border */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <h4 className="font-bold text-primary mb-3 text-sm">Accent Card</h4>
                <div
                  className="border-l-4 p-4 rounded-lg"
                  style={{
                    borderColor: currentScheme.accent,
                    backgroundColor: currentScheme.brandPurple,
                  }}
                >
                  <div className="font-semibold text-primary mb-1">Pro Tip</div>
                  <div className="text-sm text-gray-600">
                    This card uses the accent color for emphasis.
                  </div>
                </div>
              </div>

              {/* Text Gradient */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <h4 className="font-bold text-primary mb-3 text-sm">Text Gradient</h4>
                <h3
                  className="text-3xl font-bold bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(135deg, #01278b 0%, ${currentScheme.accent} 100%)`,
                  }}
                >
                  Amazing Results
                </h3>
              </div>

              {/* Progress Bar */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <h4 className="font-bold text-primary mb-3 text-sm">Progress Indicator</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>75%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: '75%',
                          backgroundColor: currentScheme.accent,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Icon with Background */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <h4 className="font-bold text-primary mb-3 text-sm">Icon Accent</h4>
                <div className="flex gap-4">
                  <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: currentScheme.brandGreen }}
                  >
                    <Trophy className="w-6 h-6" style={{ color: currentScheme.accent }} />
                  </div>
                  <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: currentScheme.brandPurple }}
                  >
                    <Users className="w-6 h-6" style={{ color: currentScheme.accent }} />
                  </div>
                  <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: currentScheme.brandPink }}
                  >
                    <BookOpen className="w-6 h-6" style={{ color: currentScheme.accent }} />
                  </div>
                </div>
              </div>

              {/* Shadow Effect */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <h4 className="font-bold text-primary mb-3 text-sm">Shadow Glow</h4>
                <div
                  className="h-24 rounded-lg flex items-center justify-center text-white font-semibold"
                  style={{
                    backgroundColor: currentScheme.accent,
                    boxShadow: `0 20px 40px ${currentScheme.accent}40`,
                  }}
                >
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Hero Preview */}
            <div className="mt-8 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h4 className="font-bold text-primary mb-6 text-lg">Hero Section Preview</h4>
              <div
                className="relative rounded-2xl overflow-hidden p-12"
                style={{
                  background: `linear-gradient(135deg, #01278b15 0%, ${currentScheme.supporting}20 50%, ${currentScheme.accent}15 100%)`,
                }}
              >
                <div className="relative z-10">
                  <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border text-primary text-sm font-bold mb-4"
                    style={{ borderColor: currentScheme.accent + '30' }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: currentScheme.accent }}
                    />
                    Enrollment Open 2026/2027
                  </div>
                  <h1
                    className="text-4xl md:text-5xl font-display font-bold mb-4 bg-clip-text text-transparent"
                    style={{
                      backgroundImage: `linear-gradient(135deg, #01278b 0%, ${currentScheme.accent} 100%)`,
                    }}
                  >
                    Online School for ARCHED & TIL-A
                  </h1>
                  <p className="text-xl text-gray-600 mb-6 max-w-2xl">
                    We'll prepare you from any level to achieve high scores!
                  </p>
                  <div className="flex gap-4">
                    <button
                      className="px-8 py-4 rounded-lg font-semibold text-white shadow-xl transition-all hover:scale-105"
                      style={{
                        backgroundColor: currentScheme.accent,
                        boxShadow: `0 10px 30px ${currentScheme.accent}30`,
                      }}
                    >
                      Get Study Plan
                    </button>
                    <button
                      className="px-8 py-4 rounded-lg font-semibold border-2 transition-all hover:scale-105"
                      style={{
                        borderColor: currentScheme.accent,
                        color: currentScheme.accent,
                      }}
                    >
                      View Pricing
                    </button>
                  </div>
                </div>

                {/* Decorative Orbs */}
                <div
                  className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30"
                  style={{ backgroundColor: currentScheme.accent }}
                />
                <div
                  className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-20"
                  style={{ backgroundColor: currentScheme.supporting }}
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ColorSchemeDemo;

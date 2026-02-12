"use client";

import React, { useState, useEffect } from 'react';
import { Menu, X, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Button from './Button';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  locale?: 'en' | 'ru';
}

const translations = {
  en: {
    aboutCourse: 'About the Course',
    pricing: 'Pricing',
    personalPlan: 'Personal Plan',
    needHelp: 'Need help choosing?',
  },
  ru: {
    aboutCourse: 'О курсе',
    pricing: 'Цены',
    personalPlan: 'Персональный план',
    needHelp: 'Нужна помощь с выбором?',
  },
};

const Header: React.FC<HeaderProps> = ({ locale = 'ru' }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { currentUser, isAdmin } = useAuth();

  const t = translations[locale];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const localePrefix = locale === 'en' ? '/en' : '/ru';

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (pathname !== '/' && pathname !== `${localePrefix}`) {
      window.location.href = `${localePrefix}#${id}`;
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { label: t.aboutCourse, path: `${localePrefix}/arched-prep-course`, type: 'link' as const },
    { label: t.pricing, id: 'pricing', type: 'scroll' as const },
    { label: t.personalPlan, path: `${localePrefix}/assessment`, type: 'link' as const },
  ];

  return (
    <header
      className={`fixed top-0 w-full z-40 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link href={localePrefix} className="z-50">
          <div
            className={`w-auto transition-all duration-300 ${isScrolled ? 'h-5' : 'h-7'}`}
            style={{
              aspectRatio: '1056 / 122',
              backgroundColor: '#01278b',
              WebkitMaskImage: 'url(/pontea-logo.webp)',
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskImage: 'url(/pontea-logo.webp)',
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
            }}
            role="img"
            aria-label="Pontea"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            link.type === 'link' ? (
              <Link
                key={link.label}
                href={link.path!}
                className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ) : (
              <button
                key={link.label}
                onClick={() => scrollToSection(link.id!)}
                className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
              >
                {link.label}
              </button>
            )
          ))}

          {isAdmin && (
            <Link href="/admin" className="text-sm font-bold text-primary hover:text-accent transition-colors">
              Admin
            </Link>
          )}

          {currentUser && (
            <Link href="/dashboard">
              <Button size="sm" variant="outline" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
          )}

          <Link href="/consultation">
            <Button size="sm" variant="primary">{t.needHelp}</Button>
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden z-50 p-2 min-w-11 min-h-11 text-primary"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-white z-40 flex flex-col items-center justify-center gap-6 md:hidden">
            {navLinks.map((link) => (
               link.type === 'link' ? (
                <Link
                  key={link.label}
                  href={link.path!}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xl font-display font-bold text-primary min-h-11 px-4 flex items-center"
                >
                  {link.label}
                </Link>
               ) : (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.id!)}
                  className="text-xl font-display font-bold text-primary min-h-11 px-4 flex items-center"
                >
                  {link.label}
                </button>
               )
            ))}

            {isAdmin && (
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                <span className="text-xl font-display font-bold text-accent">Admin</span>
              </Link>
            )}

            {currentUser && (
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <span className="text-xl font-display font-bold text-primary">Dashboard</span>
              </Link>
            )}

            <Link href="/consultation" onClick={() => setMobileMenuOpen(false)}>
              <Button size="lg" variant="primary">{t.needHelp}</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

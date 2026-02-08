"use client";

import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Button from './Button';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (pathname !== '/') {
      window.location.hash = id;
      // Let the hash change trigger the scroll after navigation
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { label: 'The Exam & Method', path: '/methodology', type: 'link' },
    { label: 'Pricing', id: 'pricing', type: 'scroll' },
    { label: 'Team', id: 'team', type: 'scroll' },
    { label: 'FAQ', id: 'faq', type: 'scroll' },
  ];

  return (
    <header 
      className={`fixed top-0 w-full z-40 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 z-50">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-accent font-display font-bold text-xl">P</span>
          </div>
          <span className={`font-display font-bold text-2xl tracking-tight ${isScrolled ? 'text-primary' : 'text-primary'}`}>
            PONTEA
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            link.type === 'link' ? (
              <Link
                key={link.label}
                href={link.path || '/'}
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
          
          <Link href="/auth/login">
            <span className="text-sm font-medium text-gray-600 hover:text-primary transition-colors cursor-pointer">
              Login
            </span>
          </Link>

          <Link href="/ru/assessment">
            <Button size="sm" variant="primary">Free Assessment</Button>
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden z-50 p-2 text-primary"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-white z-40 flex flex-col items-center justify-center gap-8 md:hidden">
            {navLinks.map((link) => (
               link.type === 'link' ? (
                <Link
                  key={link.label}
                  href={link.path!}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xl font-display font-bold text-primary"
                >
                  {link.label}
                </Link>
               ) : (
                <button 
                  key={link.label}
                  onClick={() => scrollToSection(link.id!)}
                  className="text-xl font-display font-bold text-primary"
                >
                  {link.label}
                </button>
               )
            ))}

            <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
              <span className="text-xl font-display font-bold text-primary">Login</span>
            </Link>

            <Link href="/ru/assessment" onClick={() => setMobileMenuOpen(false)}>
              <Button size="lg" variant="primary">Start Assessment</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

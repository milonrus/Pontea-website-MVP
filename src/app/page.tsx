"use client";

import Link from 'next/link';

const LanguageGateway = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
      <div className="max-w-2xl w-full mx-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            PONTEA
          </h1>
          <p className="text-xl text-white/80">
            TEST ARCHED Preparation Course
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Russian Version */}
          <Link
            href="/ru/arched-prep-course"
            className="group bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="text-4xl mb-4">🇷🇺</div>
            <h2 className="text-2xl font-bold text-primary mb-2">Русский</h2>
            <p className="text-gray-600 mb-4">
              Полный курс подготовки к экзамену TEST ARCHED
            </p>
            <div className="text-primary font-semibold group-hover:translate-x-2 transition-transform duration-300">
              Купить курс →
            </div>
          </Link>

          {/* English Version */}
          <Link
            href="/en"
            className="group bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="text-4xl mb-4">🇬🇧</div>
            <h2 className="text-2xl font-bold text-primary mb-2">English</h2>
            <p className="text-gray-600 mb-4">
              Full TEST ARCHED preparation course
            </p>
            <div className="text-primary font-semibold group-hover:translate-x-2 transition-transform duration-300">
              Register for early access →
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LanguageGateway;

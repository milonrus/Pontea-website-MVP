import React from 'react';
import { motion } from 'framer-motion';

interface ExperienceBannerProps {
  locale?: 'en' | 'ru';
}

const translations = {
  en: {
    h2: '5 years preparing students for Italy\'s top architecture universities',
    tagline: 'Our students were just like you — and they made it!',
  },
  ru: {
    h2: '5 лет готовим к поступлению в лучшие архитектурные вузы Италии',
    tagline: 'Наши ученики — такие же, как ты, И у них получилось!',
  },
};

const ExperienceBanner: React.FC<ExperienceBannerProps> = ({ locale = 'ru' }) => {
  const t = translations[locale];

  return (
    <section className="pt-4 md:pt-6 pb-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
            >
                <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-10 opacity-80 mb-10 md:mb-12">
                    {[
                        { name: 'Politecnico di Milano', src: '/universities/polimi.png' },
                        { name: 'University of Bologna', src: '/universities/unibo.png' },
                        { name: 'Sapienza University', src: '/universities/sapienza.png' },
                        { name: 'IUAV', src: '/universities/iuav.jpg' },
                        { name: 'Politecnico di Torino', src: '/universities/polito.png' },
                        { name: 'University of Padua', src: '/universities/unipd.png' },
                    ].map((uni, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="w-24 h-20 md:w-32 md:h-24 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300"
                        >
                            <img
                                src={uni.src}
                                alt={uni.name}
                                className="max-w-full max-h-full object-contain"
                            />
                        </motion.div>
                    ))}
                </div>

                <h2 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold text-primary leading-tight mb-6">
                    {locale === 'en' ? t.h2 : (
                        <>
                            5 лет готовим к поступлению
                            <br />
                            <span className="inline-block mt-2">в лучшие архитектурные вузы Италии</span>
                        </>
                    )}
                </h2>

                <p className="text-gray-500 text-lg">
                    {locale === 'en' ? t.tagline : (
                        <>
                            Наши ученики — такие же, как ты,
                            <br />
                            И у них получилось!
                        </>
                    )}
                </p>
            </motion.div>
        </div>
    </section>
  );
};

export default ExperienceBanner;

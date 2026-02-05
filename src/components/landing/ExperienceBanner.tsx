import React from 'react';
import { motion } from 'framer-motion';

const ExperienceBanner = () => {
    return (
        <section className="pt-20 pb-8 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl md:text-5xl font-display font-bold text-primary leading-tight">
                        5 лет готовим к поступлению
                        <br />
                        <span className="relative inline-block mt-2">
                            <span className="relative z-10">в Лучшие архитектурные вузы</span>
                            <span className="absolute inset-0 bg-[#FDE047]/30 -rotate-1 scale-110 z-0 rounded-lg"></span>
                        </span>
                    </h2>

                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-80 mt-12 mb-8">
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
                                className="w-24 h-24 md:w-32 md:h-24 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300"
                            >
                                <img
                                    src={uni.src}
                                    alt={uni.name}
                                    className="max-w-full max-h-full object-contain"
                                />
                            </motion.div>
                        ))}
                    </div>

                    <p className="mt-8 text-gray-500 text-lg">
                        Наши ученики — такие же, как ты,
                        <br />
                        И у них получилось!
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

export default ExperienceBanner;

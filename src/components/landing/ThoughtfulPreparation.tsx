import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, Target, BookOpen, Zap, MessageCircle } from 'lucide-react';

const ThoughtfulPreparation = () => {
    return (
        <section className="section-padding bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-primary mb-4">
                        Продуманная подготовка
                    </h2>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Card 1: Custom Pace */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0 * 0.1 }}
                        className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group"
                    >
                        <div className="bg-gray-50 rounded-2xl p-6 mb-8 h-56 flex items-center justify-center group-hover:bg-blue-50/50 transition-colors">
                            <div className="space-y-3 w-full max-w-[240px]">
                                <div className="bg-white border border-gray-200 py-3 px-4 rounded-xl text-xs text-gray-400 font-medium flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                    Медленный темп
                                </div>
                                <div className="bg-white border-2 border-accent py-3 px-4 rounded-xl text-xs font-bold text-primary flex justify-between items-center shadow-md scale-105">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                                        Средний темп
                                    </div>
                                    <Calendar className="w-4 h-4 text-accent" />
                                </div>
                                <div className="bg-white border border-gray-200 py-3 px-4 rounded-xl text-xs text-gray-400 font-medium flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                    Интенсивный темп
                                </div>
                            </div>
                        </div>
                        <h3 className="text-xl font-display font-bold text-primary mb-3">
                            Темп, который тебе подходит
                        </h3>
                        <p className="text-gray-500 leading-relaxed text-sm">
                            Стартуешь с любого уровня: сначала приоритеты, потом чёткие шаги на неделю
                        </p>
                    </motion.div>

                    {/* Card 2: Predictable Results */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1 * 0.1 }}
                        className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group"
                    >
                        <div className="bg-gray-50 rounded-2xl p-6 mb-8 h-56 flex items-center justify-center group-hover:bg-blue-50/50 transition-colors relative overflow-hidden">
                            {/* Line chart visualization */}
                            <div className="relative w-full h-full flex items-end justify-center pb-8">
                                <svg viewBox="0 0 200 120" className="w-full h-full max-w-[200px]">
                                    {/* Grid lines */}
                                    <line x1="20" y1="100" x2="180" y2="100" stroke="currentColor" strokeWidth="1" className="text-gray-200" strokeDasharray="4 4" />
                                    <line x1="20" y1="75" x2="180" y2="75" stroke="currentColor" strokeWidth="1" className="text-gray-200" strokeDasharray="4 4" />
                                    <line x1="20" y1="50" x2="180" y2="50" stroke="currentColor" strokeWidth="1" className="text-gray-200" strokeDasharray="4 4" />
                                    <line x1="20" y1="25" x2="180" y2="25" stroke="currentColor" strokeWidth="1" className="text-gray-200" strokeDasharray="4 4" />

                                    {/* Trend line */}
                                    <polyline
                                        points="20,90 50,75 80,70 110,55 140,45 170,30"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        className="text-primary transition-all duration-500 group-hover:text-teal-400"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />

                                    {/* Data points */}
                                    <circle cx="20" cy="90" r="4" fill="currentColor" className="text-primary" />
                                    <circle cx="50" cy="75" r="4" fill="currentColor" className="text-primary" />
                                    <circle cx="80" cy="70" r="4" fill="currentColor" className="text-primary" />
                                    <circle cx="110" cy="55" r="4" fill="currentColor" className="text-primary" />
                                    <circle cx="140" cy="45" r="4" fill="currentColor" className="text-primary" />
                                    <circle cx="170" cy="30" r="5" fill="currentColor" className="text-accent transition-all duration-500 group-hover:scale-150" />
                                </svg>

                                {/* Floating score indicator */}
                                <div className="absolute top-4 right-4 bg-white border-2 border-accent rounded-lg px-3 py-1.5 shadow-lg">
                                    <div className="flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3 text-accent" />
                                        <span className="text-xs font-bold text-primary">+28%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <h3 className="text-xl font-display font-bold text-primary mb-3">
                            Прогнозируемый результат
                        </h3>
                        <p className="text-gray-500 leading-relaxed text-sm">
                            Видишь, сколько набираешь на тренировках и как это меняется со временем
                        </p>
                    </motion.div>

                    {/* Card 3: Weak Topics Control */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 2 * 0.1 }}
                        className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group"
                    >
                        <div className="bg-gray-50 rounded-2xl p-6 mb-8 h-56 flex flex-col justify-center items-center group-hover:bg-blue-50/50 transition-colors">
                            <div className="w-full max-w-[240px] space-y-3 relative z-10">
                                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center transform translate-x-4 transition-transform group-hover:translate-x-2">
                                    <span className="font-bold text-gray-700 text-xs">Композиция</span>
                                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="bg-red-400 w-[45%] h-full rounded-full transition-all duration-500 group-hover:w-[65%] group-hover:bg-accent"></div>
                                    </div>
                                    <span className="font-bold text-red-400 text-xs group-hover:text-accent transition-colors">4.5</span>
                                </div>
                                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center transform -translate-x-2 transition-transform group-hover:translate-x-0">
                                    <span className="font-bold text-gray-700 text-xs">Рисунок</span>
                                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="bg-accent w-[72%] h-full rounded-full transition-all duration-500 group-hover:w-[82%]"></div>
                                    </div>
                                    <span className="font-bold text-accent text-xs">7.2</span>
                                </div>
                                <div className="bg-primary text-white p-3 rounded-lg shadow-lg flex justify-between items-center scale-105 z-20 relative">
                                    <span className="font-bold text-xs flex items-center gap-1">
                                        <Target className="w-3 h-3" />
                                        Черчение
                                    </span>
                                    <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                                        <div className="bg-teal-400 w-[88%] h-full rounded-full"></div>
                                    </div>
                                    <span className="font-bold text-base">8.8</span>
                                </div>
                            </div>
                        </div>
                        <h3 className="text-xl font-display font-bold text-primary mb-3">
                            Слабые темы под контролем
                        </h3>
                        <p className="text-gray-500 leading-relaxed text-sm">
                            Меньше хаоса: понятно, что делать дальше и почему
                        </p>
                    </motion.div>

                    {/* Card 4: Theory Resources */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 3 * 0.1 }}
                        className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group"
                    >
                        <div className="bg-gray-50 rounded-2xl p-6 mb-8 h-56 flex items-center justify-center group-hover:bg-blue-50/50 transition-colors relative">
                            <div className="relative w-48 h-40">
                                {/* Stacked documents */}
                                <div className="absolute inset-0 bg-white rounded-lg shadow-md border border-gray-200 p-4 transform -rotate-6 transition-all duration-500 group-hover:-rotate-3 group-hover:translate-x-2">
                                    <BookOpen className="w-5 h-5 text-gray-300 mb-2" />
                                    <div className="space-y-1.5">
                                        <div className="h-1.5 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-1.5 bg-gray-200 rounded w-full"></div>
                                        <div className="h-1.5 bg-gray-200 rounded w-5/6"></div>
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-white rounded-lg shadow-md border border-gray-200 p-4 transform -rotate-3 transition-all duration-500 group-hover:-rotate-1">
                                    <BookOpen className="w-5 h-5 text-gray-400 mb-2" />
                                    <div className="space-y-1.5">
                                        <div className="h-1.5 bg-gray-300 rounded w-3/4"></div>
                                        <div className="h-1.5 bg-gray-300 rounded w-full"></div>
                                        <div className="h-1.5 bg-gray-300 rounded w-5/6"></div>
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-white rounded-lg shadow-lg border-2 border-primary p-4 transform rotate-0 transition-all duration-500 group-hover:scale-105">
                                    <BookOpen className="w-5 h-5 text-primary mb-2" />
                                    <div className="space-y-1.5">
                                        <div className="h-1.5 bg-primary/80 rounded w-3/4"></div>
                                        <div className="h-1.5 bg-primary/60 rounded w-full"></div>
                                        <div className="h-1.5 bg-primary/40 rounded w-5/6"></div>
                                        <div className="h-1.5 bg-primary/20 rounded w-2/3"></div>
                                    </div>
                                    <div className="absolute top-3 right-3 bg-accent text-primary px-2 py-1 rounded text-[10px] font-bold">
                                        PDF
                                    </div>
                                </div>
                            </div>
                        </div>
                        <h3 className="text-xl font-display font-bold text-primary mb-3">
                            Теория, которая помогает решать
                        </h3>
                        <p className="text-gray-500 leading-relaxed text-sm">
                            Полезные PDFки, олайн-уроки и разборы + материалы в записи
                        </p>
                    </motion.div>

                    {/* Card 5: Daily Practice */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 4 * 0.1 }}
                        className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group"
                    >
                        <div className="bg-gray-50 rounded-2xl p-6 mb-8 h-56 flex items-center justify-center group-hover:bg-blue-50/50 transition-colors">
                            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 w-48 relative transform rotate-3 group-hover:rotate-0 transition-transform duration-300">
                                <div className="absolute -top-3 -right-3 bg-accent text-primary p-2 rounded-lg shadow-sm">
                                    <Zap className="w-4 h-4" fill="currentColor" />
                                </div>
                                <div className="font-bold text-primary mb-1 text-base">Практика</div>
                                <div className="text-xs text-gray-400 mb-4 font-medium flex items-center gap-2">
                                    <div className="bg-primary/10 text-primary px-2 py-0.5 rounded font-bold text-[10px]">
                                        12 задач
                                    </div>
                                    • Смешанные темы
                                </div>
                                <div className="w-full bg-accent text-primary text-center py-2.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-yellow-400 transition-colors shadow-sm">
                                    Начать тренировку
                                </div>
                            </div>
                        </div>
                        <h3 className="text-xl font-display font-bold text-primary mb-3">
                            Ежедневная практика
                        </h3>
                        <p className="text-gray-500 leading-relaxed text-sm">
                            Задания и тренировки по темам + разбор ошибок, чтобы закрепить результат
                        </p>
                    </motion.div>

                    {/* Card 6: All-in-One Platform */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 5 * 0.1 }}
                        className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group"
                    >
                        <div className="bg-gray-50 rounded-2xl p-6 mb-8 h-56 flex items-center justify-center relative group-hover:bg-blue-50/50 transition-colors">
                            {/* Student question bubble */}
                            <div className="absolute top-10 right-6 animate-pulse" style={{ animationDuration: '3s' }}>
                                <div className="bg-white p-3 rounded-2xl rounded-tr-none shadow-lg border border-gray-100 max-w-[180px]">
                                    <p className="text-xs text-gray-600 font-medium">Как решать композицию с двумя объектами?</p>
                                </div>
                            </div>

                            {/* Mentor response bubble */}
                            <div className="absolute bottom-10 left-6">
                                <div className="flex items-end gap-2">
                                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                                        <MessageCircle className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="bg-primary p-3 rounded-2xl rounded-bl-none shadow-lg max-w-[180px]">
                                        <p className="text-xs text-white font-medium">Сначала найди композиционный центр...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <h3 className="text-xl font-display font-bold text-primary mb-3">
                            Всё в одном месте
                        </h3>
                        <p className="text-gray-500 leading-relaxed text-sm">
                            Поддержка в чате с ментором: вопросы по плану и задачам (отвечаем быстро)
                        </p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default ThoughtfulPreparation;

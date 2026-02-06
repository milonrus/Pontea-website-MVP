import React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image: string;
  tags: [string, string];
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Анна Орлова',
    role: 'Архитектурная композиция',
    bio: 'Помогает выстроить визуальное мышление и уверенно решать задания по композиции.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=1200',
    tags: ['Композиция', 'Разбор работ'],
  },
  {
    name: 'Илья Морозов',
    role: 'Математика и физика',
    bio: 'Объясняет сложные темы простым языком и доводит до стабильной точности.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1200',
    tags: ['Формулы без зубрежки', 'Типовые ловушки'],
  },
  {
    name: 'Мария Демидова',
    role: 'История архитектуры',
    bio: 'Дает систему, в которой даты и стили запоминаются через логику, а не хаос.',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=1200',
    tags: ['Хронология', 'Визуальные ассоциации'],
  },
  {
    name: 'Никита Власов',
    role: 'Логика и аналитика',
    bio: 'Тренирует скорость и точность мышления под формат реального экзамена.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=1200',
    tags: ['Логические модели', 'Работа на время'],
  },
  {
    name: 'София Белова',
    role: 'Черчение и графика',
    bio: 'Помогает убрать технические ошибки и собирать аккуратные, понятные решения.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=1200',
    tags: ['Техника', 'Критерии оценки'],
  },
  {
    name: 'Артём Кузнецов',
    role: 'Экзаменационная стратегия',
    bio: 'Собирает стратегию попытки: приоритеты, тайминг и управление стрессом.',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=1200',
    tags: ['Стратегия', 'Тактика попытки'],
  },
];

const Teachers: React.FC = () => {
  return (
    <section id="team" className="section-padding bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-bold uppercase tracking-wider mb-4 border border-blue-100">
            <Users className="w-3 h-3" />
            Команда специалистов
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-primary mb-5">
            Сильная команда
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Эксперты по каждому блоку экзамена помогают двигаться быстрее и увереннее.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {TEAM_MEMBERS.map((member, index) => (
            <motion.article
              key={member.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className="group h-full rounded-3xl border border-blue-100 bg-white shadow-[0_16px_40px_-26px_rgba(1,39,139,0.45)] hover:shadow-[0_20px_48px_-24px_rgba(1,39,139,0.55)] transition-all duration-300 overflow-hidden"
            >
              <div className="relative aspect-[4/3] overflow-hidden border-b border-blue-100">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/35 via-secondary/10 to-transparent pointer-events-none" />
              </div>

              <div className="p-6 md:p-7">
                <h3 className="text-2xl font-display font-bold text-primary leading-tight">
                  {member.name}
                </h3>
                <p className="text-sm font-bold text-accent uppercase tracking-wide mt-2">
                  {member.role}
                </p>

                <p className="text-gray-600 leading-relaxed mt-4 min-h-[84px]">
                  {member.bio}
                </p>

                <div className="pt-5 mt-5 border-t border-blue-100 flex flex-wrap gap-2">
                  {member.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50/70 px-3 py-1 text-xs font-semibold text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Teachers;

import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Award, Users } from 'lucide-react';

const TEACHERS = [
  {
    name: 'Arch. Giulia Bianchi',
    role: 'Architectural Design & History',
    bio: 'PoliMi Alumna (110L). 5+ years helping students crack the history section with visual memory techniques.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    stats: '500+ Students'
  },
  {
    name: 'Ing. Marco Rossi',
    role: 'Math & Physics Lead',
    bio: 'PhD candidate at PoliTo. Specialized in simplifying complex physics concepts for the TIL-A and ARCHED logic sections.',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400',
    stats: 'Top 1% Scorer'
  },
  {
    name: 'Dr. Elena Verdi',
    role: 'Logic & Reading Coach',
    bio: 'Cognitive Science background. Expert in test-taking strategies and "trap detection" for logical reasoning.',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
    stats: 'Strat Master'
  }
];

const Teachers: React.FC = () => {
  return (
    <section id="team" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-bold uppercase tracking-wider mb-4 border border-blue-100">
            <Users className="w-3 h-3" />
            World-Class Mentors
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-primary mb-6">
            Learn from the <span className="text-accent">Best</span>
          </h2>
          <p className="text-lg text-gray-600">
            Our instructors aren't just tutors; they are top-ranking alumni and industry professionals who know the entrance exams inside out.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {TEACHERS.map((teacher, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-primary rounded-2xl transform rotate-1 transition-transform group-hover:rotate-2 opacity-5"></div>
              <div className="relative bg-white border border-gray-100 p-2 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="aspect-[4/3] overflow-hidden rounded-xl mb-6 relative">
                  <img 
                    src={teacher.image} 
                    alt={teacher.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                     <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/20">
                        <Award className="w-3 h-3 text-accent" />
                        {teacher.stats}
                     </span>
                  </div>
                </div>
                
                <div className="px-4 pb-4 text-center">
                    <h3 className="text-xl font-bold text-primary mb-1 font-display">{teacher.name}</h3>
                    <div className="text-sm font-bold text-accent mb-3 uppercase tracking-wide">{teacher.role}</div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {teacher.bio}
                    </p>
                    <div className="pt-4 border-t border-gray-50 flex justify-center gap-4 text-gray-400">
                        <GraduationCap className="w-5 h-5 hover:text-primary transition-colors cursor-pointer" />
                    </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Teachers;

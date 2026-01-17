import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/shared/Header';
import Hero from '../components/landing/Hero';
import Pricing from '../components/landing/Pricing';
import Button from '../components/shared/Button';

// Methodology Preview Section
const MethodologyPreview = () => (
  <section className="py-24 bg-white border-b border-gray-100">
    <div className="max-w-7xl mx-auto px-4">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-bold uppercase tracking-wider mb-4 border border-blue-100">
          Proprietary Methodology
        </div>
        <h2 className="text-3xl md:text-5xl font-display font-bold text-primary mb-6">
          The Knowledge Matrix™
        </h2>
        <p className="text-lg text-gray-600 leading-relaxed">
            Success in the ARCHED exam isn't about memorizing facts. It's about systematically climbing from <strong>Beginner</strong> to <strong>Mastery</strong> across 5 distinct domains. We track your "Knowledge Level" (KL) to guarantee your score.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-12">
        {[
            { 
                level: 'KL0', 
                title: 'Pre-Foundation', 
                desc: 'Unfamiliar concepts. High risk of negative marking.',
                color: 'text-gray-300',
                bg: 'bg-gray-50',
                border: 'border-gray-100'
            },
            { 
                level: 'KL1', 
                title: 'Foundation', 
                desc: 'Conceptual understanding but slow execution.',
                color: 'text-blue-300',
                bg: 'bg-blue-50/50',
                border: 'border-blue-100'
            },
            { 
                level: 'KL2', 
                title: 'Competence', 
                desc: 'Reliable accuracy on standard questions.',
                color: 'text-accent',
                bg: 'bg-amber-50/50',
                border: 'border-accent/20'
            },
            { 
                level: 'KL3', 
                title: 'Mastery', 
                desc: 'Automatic recognition. Speed under 45s.',
                color: 'text-white/40',
                bg: 'bg-primary text-white shadow-xl scale-105 transform',
                border: 'border-transparent' // KL3 is highlighted
            }
        ].map((card, i) => (
            <div key={i} className={`p-6 rounded-2xl border flex flex-col ${card.bg} ${card.border}`}>
                <div className={`text-3xl font-bold mb-3 ${card.color}`}>{card.level}</div>
                <h3 className={`font-bold text-lg mb-2 ${card.bg.includes('text-white') ? 'text-white' : 'text-primary'}`}>{card.title}</h3>
                <p className={`text-sm ${card.bg.includes('text-white') ? 'text-blue-100' : 'text-gray-500'}`}>{card.desc}</p>
            </div>
        ))}
      </div>

      <div className="text-center">
        <Link to="/methodology">
            <Button variant="outline" className="border-primary text-primary hover:bg-blue-50">
                Explore the Methodology
            </Button>
        </Link>
      </div>
    </div>
  </section>
);

// Simple Placeholders for other sections to save space but maintain structure
const SectionPlaceholder = ({ title, bg = 'bg-white', id }: { title: string, bg?: string, id?: string }) => (
  <section id={id} className={`py-20 ${bg}`}>
    <div className="max-w-7xl mx-auto px-4 text-center">
      <h2 className="text-3xl font-display font-bold text-primary mb-8">{title}</h2>
      <div className="h-64 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400">
        {title} Content Area
      </div>
    </div>
  </section>
);

const Universities = () => (
  <section className="py-16 bg-white border-b border-gray-100">
    <div className="max-w-7xl mx-auto px-4 text-center">
      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-10">Universities waiting for you</p>
      <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
        {[
          { name: 'Politecnico di Milano', short: 'PoliMi' },
          { name: 'Politecnico di Torino', short: 'PoliTo' },
          { name: 'Sapienza Roma', short: 'Sapienza' },
          { name: 'IUAV Venezia', short: 'IUAV' },
          { name: 'Uni Bologna', short: 'UNIBO' },
          { name: 'Uni Padova', short: 'UNIPD' }
        ].map((uni) => (
          <div key={uni.name} className="group relative flex items-center justify-center p-2">
            <img 
              src={`https://placehold.co/180x60/ffffff/1a1a2e?text=${uni.short}&font=playfair`}
              alt={`${uni.name} Logo`}
              title={uni.name}
              className="h-10 md:h-14 w-auto object-contain opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
            />
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Program = () => (
  <section id="program" className="py-20 bg-white">
     <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
           <h2 className="text-3xl md:text-4xl font-display font-bold text-primary mb-4">Our Methodology</h2>
           <p className="text-gray-600 max-w-2xl mx-auto">We don't just teach you facts; we teach you how to think like an architect.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
           {[
             { title: 'Study Materials', desc: '250+ pages of concise notes. No fluff.' },
             { title: 'Video Lectures', desc: 'Expert explanations of complex topics.' },
             { title: 'Practice Bank', desc: 'Thousands of questions in English.' }
           ].map((item, i) => (
             <div key={i} className="p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all border border-gray-100">
                <div className="w-12 h-12 bg-accent/20 rounded-lg mb-4 flex items-center justify-center text-accent-dark font-bold text-xl">{i+1}</div>
                <h3 className="text-xl font-bold text-primary mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
             </div>
           ))}
        </div>
     </div>
  </section>
);

const Team = () => (
  <section id="team" className="py-20 bg-white">
    <div className="max-w-7xl mx-auto px-4">
      <h2 className="text-3xl md:text-4xl font-display font-bold text-primary text-center mb-16">Meet Your Mentors</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {[
          { name: 'Diana N.', role: 'Co-founder, PoliMi', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop' },
          { name: 'Renata R.', role: 'Co-founder, PoliMi', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop' },
          { name: 'Diana K.', role: 'Art History Expert', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop' },
          { name: 'Egor P.', role: 'Student Success', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop' },
          { name: 'Mikhail C.', role: 'History Teacher', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop' }
        ].map((member, i) => (
          <div key={i} className="text-center group">
            <div className="w-full aspect-square bg-gray-200 rounded-xl mb-4 overflow-hidden relative">
               <img src={member.img} alt={member.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <h4 className="font-bold text-primary">{member.name}</h4>
            <p className="text-xs text-gray-500">{member.role}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FAQ = () => (
    <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-display font-bold text-primary text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-4">
                {[
                    { q: "What language is the course taught in?", a: "English, with Russian support available." },
                    { q: "Do you help with documents?", a: "Yes! We guide you through the entire application process." },
                    { q: "How long is the course?", a: "4 months, timed perfectly for the summer exams." }
                ].map((item, i) => (
                    <details key={i} className="group bg-white rounded-lg p-6 cursor-pointer border border-gray-200">
                        <summary className="font-bold text-primary flex justify-between items-center list-none">
                            {item.q}
                            <span className="group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <p className="mt-4 text-gray-600">{item.a}</p>
                    </details>
                ))}
            </div>
        </div>
    </section>
);

const Footer = () => (
    <footer className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-2xl font-display font-bold">PONTEA</div>
            <div className="text-gray-400 text-sm">© 2024 Pontea School. All rights reserved.</div>
            <div className="flex gap-4">
                <a href="#" className="hover:text-accent transition-colors">Instagram</a>
                <a href="#" className="hover:text-accent transition-colors">Email</a>
            </div>
        </div>
    </footer>
);

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <MethodologyPreview />
      <Universities />
      <Program />
      <Pricing />
      <Team />
      <FAQ />
      <section className="py-24 bg-primary relative overflow-hidden text-center px-4">
         {/* Background decoration */}
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
         </div>

         <div className="relative z-10 max-w-4xl mx-auto">
             <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">Ready to start your journey?</h2>
             <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
                Join 500+ students who have successfully navigated the ARCHED and TIL-A exams.
             </p>
             <Link to="/assessment">
                <Button size="lg" className="bg-accent text-primary hover:bg-yellow-400 shadow-xl shadow-accent/20 border-transparent font-bold transform hover:scale-105 transition-transform duration-200">
                    Start Free Assessment
                </Button>
             </Link>
             <p className="mt-6 text-sm text-blue-300">No credit card required • 5-minute analysis</p>
         </div>
      </section>
      <Footer />
    </div>
  );
};

export default LandingPage;
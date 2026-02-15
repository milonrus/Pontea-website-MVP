import React from 'react';
import { Star, Check, Zap } from 'lucide-react';

const FeaturesGrid: React.FC = () => {
   return (
      <section className="section-padding bg-white relative overflow-hidden">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Header */}
            <div className="text-center mb-20">
               <div className="inline-flex items-center gap-2 text-primary font-bold mb-4 uppercase tracking-widest text-xs">
                  <Star className="w-4 h-4 text-accent fill-accent" />
                  Premium Features
               </div>
               <h2 className="text-4xl md:text-5xl font-display font-bold text-primary mb-6">
                  More proof we're the best deal <br /> in Architecture Prep
               </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
               {/* Card 1: Practice Tests */}
               <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
                  <div className="bg-gray-50 rounded-2xl p-6 mb-8 h-56 relative overflow-hidden flex flex-col justify-center items-center group-hover:bg-blue-50/50 transition-colors">
                     <div className="w-full max-w-[240px] space-y-3 relative z-10">
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center transform translate-x-4 transition-transform group-hover:translate-x-2">
                           <span className="font-bold text-gray-700 text-xs">Logic</span>
                           <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="bg-primary w-[85%] h-full rounded-full"></div>
                           </div>
                           <span className="font-bold text-primary text-xs">8.5</span>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center transform -translate-x-2 transition-transform group-hover:translate-x-0">
                           <span className="font-bold text-gray-700 text-xs">History</span>
                           <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="bg-teal-400 w-[92%] h-full rounded-full"></div>
                           </div>
                           <span className="font-bold text-teal-500 text-xs">9.2</span>
                        </div>
                        <div className="bg-primary text-white p-3 rounded-lg shadow-lg flex justify-between items-center scale-105 z-20 relative">
                           <span className="font-bold text-xs">Total Score</span>
                           <span className="font-bold text-base">44.1</span>
                        </div>
                     </div>
                  </div>
                  <h3 className="text-xl font-display font-bold text-primary mb-3">Full Length Practice Tests</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">
                     Take up to 5 full-length simulation exams that mimic the exact interface, timing, and stress of the real test.
                  </p>
               </div>

               {/* Card 2: Schedules */}
               <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
                  <div className="bg-gray-50 rounded-2xl p-6 mb-8 h-56 flex items-center justify-center group-hover:bg-blue-50/50 transition-colors">
                     <div className="space-y-2 w-full max-w-[220px]">
                        <div className="bg-white border border-gray-200 py-3 px-4 rounded-xl text-xs text-gray-400 font-medium">One-Month: Cram</div>
                        <div className="bg-white border-2 border-accent py-3 px-4 rounded-xl text-xs font-bold text-primary flex justify-between items-center shadow-md scale-105">
                           Three-Month: Standard
                           <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary" strokeWidth={3} />
                           </div>
                        </div>
                        <div className="bg-white border border-gray-200 py-3 px-4 rounded-xl text-xs text-gray-400 font-medium">Six-Month: Mastery</div>
                     </div>
                  </div>
                  <h3 className="text-xl font-display font-bold text-primary mb-3">Flexible Study Schedules</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">
                     Follow expert-made study plans tailored to your timeline. Whether you have 1 month or 6, we have a structured path for you.
                  </p>
               </div>

               {/* Card 3: Predictor */}
               <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
                  <div className="bg-gray-50 rounded-2xl p-6 mb-8 h-56 flex items-center justify-center group-hover:bg-blue-50/50 transition-colors">
                     <div className="relative w-36 h-36 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                           <circle cx="72" cy="72" r="60" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-200" />
                           <circle cx="72" cy="72" r="60" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="376.99" strokeDashoffset="100" className="text-primary transition-all duration-1000 ease-out group-hover:stroke-accent" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <span className="text-4xl font-bold text-primary">82%</span>
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Probability</span>
                        </div>
                     </div>
                  </div>
                  <h3 className="text-xl font-display font-bold text-primary mb-3">Admission Predictor</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">
                     Check your predicted admission probability anytime based on your quiz performance and historical cutoff scores.
                  </p>
               </div>

               {/* Card 4: Real Human Help */}
               <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
                  <div className="bg-gray-50 rounded-2xl p-6 mb-8 h-56 flex items-center justify-center relative group-hover:bg-blue-50/50 transition-colors">
                     <div className="absolute top-10 right-6 animate-pulse" style={{ animationDuration: '3s' }}>
                        <div className="bg-white p-3 rounded-2xl rounded-tr-none shadow-lg border border-gray-100 max-w-[180px]">
                           <p className="text-xs text-gray-600 font-medium">How do I calculate moment of inertia?</p>
                        </div>
                     </div>
                     <div className="absolute bottom-10 left-6">
                        <div className="flex items-end gap-2">
                           <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                              <img
                                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100"
                                alt="Mentor profile photo"
                                className="w-full h-full object-cover"
                              />
                           </div>
                           <div className="bg-primary p-3 rounded-2xl rounded-bl-none shadow-lg max-w-[180px]">
                              <p className="text-xs text-white font-medium">It's the integral of mass times radius squared...</p>
                           </div>
                        </div>
                     </div>
                  </div>
                  <h3 className="text-xl font-display font-bold text-primary mb-3">Get Help from a Real Human</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">
                     Hit a tough question? Chat with our expert tutors directly on the platform and get a breakdown within 24 hours.
                  </p>
               </div>

               {/* Card 5: Analytics */}
               <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
                  <div className="bg-gray-50 rounded-2xl p-6 mb-8 h-56 flex items-center justify-center gap-4 group-hover:bg-blue-50/50 transition-colors">
                     {[63, 45, 88].map((val, i) => (
                        <div key={i} className={`relative w-16 h-16 transition-transform duration-500 ${i === 1 ? 'scale-110' : 'scale-90'}`}>
                           <svg className="w-full h-full transform -rotate-90">
                              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-200" />
                              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="175.9" strokeDashoffset={175.9 - (175.9 * val) / 100} className={i === 0 ? "text-primary" : i === 1 ? "text-accent" : "text-teal-400"} strokeLinecap="round" />
                           </svg>
                           <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">
                              {val}%
                           </div>
                        </div>
                     ))}
                  </div>
                  <h3 className="text-xl font-display font-bold text-primary mb-3">Personalized Analytics</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">
                     See which exam sections matter most, how you're doing in each, and precisely where you need to improve to reach your target.
                  </p>
               </div>

               {/* Card 6: Drills */}
               <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
                  <div className="bg-gray-50 rounded-2xl p-6 mb-8 h-56 flex items-center justify-center group-hover:bg-blue-50/50 transition-colors">
                     <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 w-48 relative transform rotate-3 group-hover:rotate-0 transition-transform duration-300">
                        <div className="absolute -top-3 -right-3 bg-accent text-primary p-2 rounded-lg shadow-sm">
                           <Zap className="w-4 h-4" fill="currentColor" />
                        </div>
                        <div className="font-bold text-primary mb-1">Daily Drills</div>
                        <div className="text-xs text-gray-400 mb-4 font-medium">5 questions • Mixed Topics</div>
                        <div className="w-full bg-accent text-primary text-center py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-yellow-400 transition-colors">Start Session</div>
                     </div>
                  </div>
                  <h3 className="text-xl font-display font-bold text-primary mb-3">Targeted Drills</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">
                     Test your understanding after each lesson with targeted multiple-choice question sets generated from your weak spots.
                  </p>
               </div>

            </div>
         </div>
      </section>
   );
};

export default FeaturesGrid;

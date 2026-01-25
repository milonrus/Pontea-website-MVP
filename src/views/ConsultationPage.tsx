import React, { useEffect } from 'react';
import Header from '@/components/shared/Header';
import { CheckCircle2, Star, Trophy, ShieldCheck, Clock, Video, Map, Target, MonitorPlay, HelpCircle } from 'lucide-react';

const ConsultationPage: React.FC = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script is tricky with Calendly widget as it modifies DOM, 
      // but removing the script tag prevents double loading on re-renders
      const scriptTag = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');
      if (scriptTag) {
        document.body.removeChild(scriptTag);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* 1. Header Section - Centered */}
          <div className="text-center max-w-4xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-primary text-xs font-bold uppercase tracking-wider mb-6 border border-blue-200">
              <Star className="w-3 h-3 fill-primary" />
              Free 30-Minute Strategy Session
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-primary mb-6">
              Stop Guessing. <span className="text-accent">Start Strategizing.</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              The architecture entrance exam is a strategic game. Get a personalized roadmap for the PoliMi or PoliTo admission exam in this free session.
            </p>
          </div>

          {/* 2. Custom Split-Card Layout */}
          {/* 
              We wrap Calendly in our own styled container.
              - Left Side: Custom HTML sidebar (Matches site design perfecty).
              - Right Side: Calendly Grid Only (hide_event_type_details=1 removes the gray wrapper).
          */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row max-w-5xl mx-auto h-auto md:h-[700px] mb-20">
            
            {/* Custom Sidebar - Fully Customizable React Component */}
            <div className="md:w-1/3 bg-gray-50/50 p-8 border-r border-gray-100 flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                   <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      MM
                   </div>
                   <div>
                      <h4 className="text-gray-400 font-bold text-xs uppercase tracking-wider">Admissions Expert</h4>
                      <div className="text-primary font-bold">Mikhail Mulyar</div>
                   </div>
              </div>

              <h2 className="text-xl font-display font-bold text-primary mb-6">What happens in this call?</h2>
              
              <div className="space-y-6 mb-8 flex-1">
                  <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-2 bg-white rounded-lg border border-gray-100 shadow-sm shrink-0 text-accent">
                        <Target className="w-4 h-4" />
                      </div>
                      <div>
                         <span className="font-bold text-gray-800 block text-sm">Discuss level & goals</span>
                         <span className="text-xs text-gray-500 leading-snug">We'll analyze your starting point and university targets.</span>
                      </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-2 bg-white rounded-lg border border-gray-100 shadow-sm shrink-0 text-accent">
                        <Map className="w-4 h-4" />
                      </div>
                      <div>
                         <span className="font-bold text-gray-800 block text-sm">Identify roadmap</span>
                         <span className="text-xs text-gray-500 leading-snug">Create a step-by-step plan for the months ahead.</span>
                      </div>
                  </div>

                  <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-2 bg-white rounded-lg border border-gray-100 shadow-sm shrink-0 text-accent">
                        <MonitorPlay className="w-4 h-4" />
                      </div>
                      <div>
                         <span className="font-bold text-gray-800 block text-sm">Show our school</span>
                         <span className="text-xs text-gray-500 leading-snug">A quick tour of the platform and methodology.</span>
                      </div>
                  </div>

                  <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-2 bg-white rounded-lg border border-gray-100 shadow-sm shrink-0 text-accent">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div>
                         <span className="font-bold text-gray-800 block text-sm">Answer your questions</span>
                         <span className="text-xs text-gray-500 leading-snug">Clear up any doubts about the exam process.</span>
                      </div>
                  </div>
              </div>
              
              <div className="mt-auto bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-accent" />
                      <span className="font-bold">30 min</span>
                  </div>
                  <div className="w-px h-4 bg-gray-200"></div>
                  <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-accent" />
                      <span className="font-bold">Online</span>
                  </div>
              </div>
            </div>

            {/* Calendly Embed - Calendar Grid Only */}
            <div className="md:w-2/3 relative bg-white">
               <div 
                 className="calendly-inline-widget" 
                 data-url="https://calendly.com/my-mulyar/consulation?hide_gdpr_banner=1&background_color=ffffff&text_color=01278b&hide_event_type_details=1" 
                 style={{ minWidth: '320px', height: '100%', width: '100%' }} 
               />
            </div>
          </div>

          {/* 3. Value Proposition Grid */}
          <div className="max-w-6xl mx-auto">
             <div className="text-center mb-10">
                <h3 className="text-2xl font-bold text-primary">Why students book this call</h3>
             </div>
             
             <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                   <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                   </div>
                   <h4 className="text-lg font-bold text-primary mb-3">Skill Diagnosis</h4>
                   <p className="text-gray-600 leading-relaxed">
                     We'll analyze your mock test scores to find your "Knowledge Level" (KL) gaps in Math & Logic.
                   </p>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                   <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                      <Trophy className="w-6 h-6 text-primary" />
                   </div>
                   <h4 className="text-lg font-bold text-primary mb-3">Custom Timeline</h4>
                   <p className="text-gray-600 leading-relaxed">
                     Receive a month-by-month study schedule tailored to the remaining days before the ARCHED/TIL-A dates.
                   </p>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                   <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mb-6">
                      <ShieldCheck className="w-6 h-6 text-yellow-700" />
                   </div>
                   <h4 className="text-lg font-bold text-primary mb-3">Risk Free</h4>
                   <p className="text-gray-600 leading-relaxed">
                     No pressure to buy. Just honest, actionable advice from alumni who ranked in the top 1%.
                   </p>
                </div>
             </div>
             
             {/* Social Proof Footer */}
             <div className="mt-16 pt-8 border-t border-gray-200 text-center">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Trusted by students from</p>
                <div className="flex justify-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all">
                  <span className="font-display font-bold text-2xl text-primary">PoliMi</span>
                  <span className="font-display font-bold text-2xl text-primary">PoliTo</span>
                  <span className="font-display font-bold text-2xl text-primary">IUAV</span>
                </div>
              </div>
          </div>

        </div>
      </main>

      <footer className="bg-primary text-white py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-2xl font-display font-bold">PONTEA</div>
            <div className="text-gray-400 text-sm">© 2024 Pontea School. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default ConsultationPage;
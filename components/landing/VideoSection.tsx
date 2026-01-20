
import React from 'react';
import { Play } from 'lucide-react';

const VideoSection: React.FC = () => {
  return (
    <section className="py-24 bg-secondary overflow-hidden relative">
       {/* Background decorations */}
       <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary rounded-full blur-[120px] opacity-40 -mr-40 -mt-40"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary rounded-full blur-[100px] opacity-40 -ml-32 -mb-32"></div>
       </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-accent text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">
            <Play className="w-3 h-3 fill-accent" />
            Exam Strategy Breakdown
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
            Mastering the 2025 Exam Structure
          </h2>
          <p className="text-lg text-blue-100 leading-relaxed">
            Understand the rules of the game. Watch our deep dive into the admission criteria, negative marking strategy, and how to allocate your 100 minutes effectively.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black group">
             {/* Decorative colored glow behind the video */}
             <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/30 to-primary/50 blur-lg group-hover:opacity-75 transition-opacity opacity-50"></div>
             
             {/* Using a verified embeddable video ID for Politecnico di Milano */}
             <iframe 
                className="absolute inset-0 w-full h-full relative z-10 rounded-2xl"
                src="https://www.youtube.com/embed/zEkgJkF1q2c" 
                title="Architecture Entrance Exam Strategy" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
             ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, ArrowRight, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

const TESTIMONIALS = [
  {
    id: 1,
    name: "Рената",
    role: "Студентка PoliMi",
    image: "/testimonials/renata.jpg",
    quote: "Сами курсы были организованы невероятно качественно и удобно, с интерактивной платформой, очень интересными лекциями и большим количеством практических заданий. Кроме огромного объема материалов, курсы сильно помогали и с мотивацией. Готовиться в разы легче, когда знаешь, что готовишься не один.",
    rating: 5
  },
  {
    id: 2,
    name: "Дарья",
    role: "Выпускница PoliMi",
    image: "/testimonials/darya.jpg",
    quote: "Девочки, спасибо большое! Я готовилась и до курса, но было очень тяжело из-за итальянского. Вебинары и конспекты супер структурированные и даже я, с ужасными знаниями по истории, смогла разобраться и многое выучить!!! Спасибо большое за этот курс!!!!!",
    rating: 5
  },
  {
    id: 3,
    name: "Милана",
    role: "Студентка PoliMi",
    image: "/testimonials/milana.jpg",
    quote: "Самое полезное это сразу здесь и сейчас окунаться в ту лексику, в язык и атмосферу без такого времени на акклиматизацию. Но самое полезное, что это постоянные повторяющиеся действия по подготовке в течение всего курса, а не за 1 месяц весь объем.",
    rating: 5
  },
  {
    id: 4,
    name: "Rusty",
    role: "Студент PoliMi",
    image: "/testimonials/rusty.jpg",
    quote: "This course is an essential tool in any effort to prepare for the entry exam. It structured the process and syllabus in a way I couldn't, and gave me all the knowledge and confidence to pass the test. Shoutout to the caring and supportive teachers!",
    rating: 5
  },
  {
    id: 5,
    name: "Марина",
    role: "Студентка PoliMi",
    image: "/testimonials/marina.png",
    quote: "Что касается курса подготовки в ПолиМи, могу сказать, что абсолютно все было полезно. Каждый предмет и каждая тема дали мне новые знания и навыки, которые я использую в учебе и в жизни. В планах — продолжить обучение на магистратуре и затем на PhD.",
    rating: 5
  }
];

const TestimonialCard = ({ testimonial, index }: { testimonial: typeof TESTIMONIALS[0], index: number }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="relative w-[340px] h-[480px] perspective-1000 snap-center flex-shrink-0 group cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{
          duration: 0.6,
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        style={{ transformStyle: "preserve-3d" }}
        className="w-full h-full relative"
      >
        {/* FRONT SIDE */}
        <div
          className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-xl"
        >
          {/* Background Image */}
          <img
            src={testimonial.image}
            alt={testimonial.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
            <h3 className="text-3xl font-display font-bold mb-2">{testimonial.name}</h3>
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold border border-white/20 shadow-sm">
                {testimonial.role}
              </span>
            </div>

            <p className="text-gray-200 text-base line-clamp-3 mb-6 italic leading-relaxed opacity-90 font-light">
              "{testimonial.quote}"
            </p>

            <div className="flex items-center gap-2 text-sm font-bold text-accent uppercase tracking-wider group-hover:gap-3 transition-all">
              Read Full Review <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* BACK SIDE */}
        <div
          className="absolute inset-0 backface-hidden rounded-2xl bg-white p-8 flex flex-col shadow-2xl border border-gray-100 rotate-y-180"
          style={{ transform: "rotateY(180deg)" }}
        >
          {/* Decorative Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-accent fill-accent" />
              ))}
            </div>
            <div className="text-xs font-bold text-gray-300 uppercase tracking-widest">Verified Student</div>
          </div>

          <div className="relative flex-1 overflow-y-auto custom-scrollbar pr-2">
            <Quote className="absolute top-0 right-0 w-12 h-12 text-blue-50 -z-10" />
            <p className="text-gray-600 italic leading-relaxed text-base font-light">
              "{testimonial.quote}"
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                <img src={testimonial.image} alt={testimonial.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-bold text-primary text-sm">{testimonial.name}</div>
                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{testimonial.role}</div>
              </div>
            </div>
            <button className="p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-primary hover:text-white transition-all shadow-sm">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Testimonials = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 360; // card width + gap
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="pt-0 pb-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex flex-col md:flex-row justify-center items-end mb-8 gap-6">

          {/* Desktop Navigation Buttons */}
          <div className="hidden md:flex gap-3">
            <button
              onClick={() => scroll('left')}
              className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="relative group -mx-4 px-4 sm:px-0">

          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-12 sm:pb-16 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {TESTIMONIALS.map((testimonial, i) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} index={i} />
            ))}
          </div>
        </div>

      </div>

      {/* 3D Utility Classes check */}
      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}</style>
    </section>
  );
};

export default Testimonials;

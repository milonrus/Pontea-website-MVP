import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/shared/Header';
import Button from '../../components/shared/Button';
import { useAuth } from '../../contexts/AuthContext';
import { getExerciseSet, getQuestionsByIds, submitAnswer, completeExercise } from '../../services/exercise';
import { ExerciseSet, QuestionModel, OptionId } from '../../types';
import LaTeXRenderer from '../../components/shared/LaTeXRenderer';
import { Clock, CheckCircle, XCircle, ArrowRight, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ExerciseSessionPage: React.FC = () => {
  const { setId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [exercise, setExercise] = useState<ExerciseSet | null>(null);
  const [questions, setQuestions] = useState<QuestionModel[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Session State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<OptionId | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  
  useEffect(() => {
    const init = async () => {
        if (!setId) return;
        try {
            const exData = await getExerciseSet(setId);
            if (!exData) {
                alert("Exercise not found");
                navigate('/dashboard');
                return;
            }
            if (exData.status === 'completed') {
                navigate('/dashboard'); // Or results
                return;
            }
            
            setExercise(exData);
            
            // Fetch question data
            const qData = await getQuestionsByIds(exData.questionIds);
            // Re-sort to match the order in exercise.questionIds
            const sortedQ = exData.questionIds.map(id => qData.find(q => q.id === id)!);
            
            setQuestions(sortedQ);
            setCurrentIndex(exData.currentIndex);
            setLoading(false);
            setStartTime(Date.now());
        } catch (e) {
            console.error(e);
        }
    };
    init();
  }, [setId, navigate]);

  const handleOptionSelect = (id: OptionId) => {
    if (!isSubmitted) setSelectedOption(id);
  };

  const handleSubmit = async () => {
    if (!selectedOption || !exercise || !currentUser) return;
    
    const timeSpent = Math.floor((Date.now() - startTime) / 1000); // seconds
    const currentQ = questions[currentIndex];
    const isCorrect = selectedOption === currentQ.correctAnswer;
    
    setIsSubmitted(true);
    
    // Save to backend
    await submitAnswer(
        currentUser.uid, 
        exercise.id, 
        currentQ.id, 
        selectedOption, 
        timeSpent, 
        isCorrect
    );
  };

  const handleNext = async () => {
    if (!exercise) return;
    
    if (currentIndex >= questions.length - 1) {
        // Finish
        await completeExercise(exercise.id);
        navigate('/dashboard'); // Ideally go to results page
    } else {
        setCurrentIndex(prev => prev + 1);
        setIsSubmitted(false);
        setSelectedOption(null);
        setStartTime(Date.now());
    }
  };

  if (loading || !exercise) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;

  const currentQ = questions[currentIndex];
  if (!currentQ) return <div>Error loading question</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
       {/* Simplified Header for focus */}
       <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 justify-between fixed top-0 w-full z-10">
          <div className="font-bold text-gray-500 text-sm">
             Question {currentIndex + 1} / {questions.length}
          </div>
          <div className="flex items-center gap-2 text-primary font-mono font-bold">
             <Clock className="w-4 h-4" />
             <span>--:--</span> {/* Could implement actual timer hook */}
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>Exit</Button>
       </header>

       <main className="flex-1 pt-24 pb-20 px-4 max-w-3xl mx-auto w-full">
           
           {/* Progress Bar */}
           <div className="w-full h-1 bg-gray-200 rounded-full mb-8">
              <div 
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
              />
           </div>

           <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-200 mb-6">
               <div className="flex justify-between items-start mb-6">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-500 uppercase tracking-wide">
                    {currentQ.difficulty}
                  </span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <Flag className="w-4 h-4" />
                  </button>
               </div>
               
               <div className="prose max-w-none mb-8">
                   <LaTeXRenderer text={currentQ.questionText} className="text-xl md:text-2xl font-bold text-gray-900 leading-relaxed" />
               </div>

               <div className="space-y-3">
                  {currentQ.options.map((opt) => {
                      const isSelected = selectedOption === opt.id;
                      const isCorrect = currentQ.correctAnswer === opt.id;
                      
                      let styles = "border-gray-200 hover:border-blue-300 hover:bg-blue-50";
                      
                      if (isSubmitted) {
                          if (isCorrect) styles = "border-green-500 bg-green-50 text-green-800";
                          else if (isSelected && !isCorrect) styles = "border-red-500 bg-red-50 text-red-800";
                          else styles = "border-gray-100 opacity-50";
                      } else if (isSelected) {
                          styles = "border-primary bg-blue-50 ring-1 ring-primary";
                      }

                      return (
                          <button
                            key={opt.id}
                            onClick={() => handleOptionSelect(opt.id)}
                            disabled={isSubmitted}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center group ${styles}`}
                          >
                             <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 ${
                                 isSelected || (isSubmitted && isCorrect) ? 'bg-white shadow-sm' : 'bg-gray-100'
                             }`}>
                                 {opt.id.toUpperCase()}
                             </span>
                             <div className="flex-1">
                                <LaTeXRenderer text={opt.text} />
                             </div>
                             {isSubmitted && isCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
                             {isSubmitted && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600" />}
                          </button>
                      )
                  })}
               </div>
           </div>

           <AnimatePresence>
               {isSubmitted && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className={`p-6 rounded-xl border mb-6 ${
                         selectedOption === currentQ.correctAnswer ? 'bg-green-50 border-green-100' : 'bg-white border-gray-200 shadow-sm'
                     }`}
                   >
                       <h4 className="font-bold mb-2">Explanation:</h4>
                       <div className="text-sm text-gray-700 leading-relaxed">
                           <LaTeXRenderer text={currentQ.explanation} />
                       </div>
                   </motion.div>
               )}
           </AnimatePresence>

       </main>

       <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 p-4 z-10">
           <div className="max-w-3xl mx-auto flex justify-end">
               {!isSubmitted ? (
                   <Button onClick={handleSubmit} disabled={!selectedOption} size="lg">
                       Submit Answer
                   </Button>
               ) : (
                   <Button onClick={handleNext} size="lg" className="group">
                       {currentIndex === questions.length - 1 ? 'Finish' : 'Next Question'}
                       <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                   </Button>
               )}
           </div>
       </div>
    </div>
  );
};

export default ExerciseSessionPage;
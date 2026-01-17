import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Question, UserInfo, QuestionResult } from '../../types';
import { QUESTIONS } from '../../data/questions';
import IntroScreen from './IntroScreen';
import UserInfoForm from './UserInfoForm';
import QuestionCard from './QuestionCard';
import ProgressBar from './ProgressBar';

const AssessmentFlow: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'intro' | 'info' | 'quiz'>('intro');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  
  // Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [history, setHistory] = useState<QuestionResult[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  
  // Feedback State
  const [isFeedbackMode, setIsFeedbackMode] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  const activeQuestion = QUESTIONS[currentQuestionIndex];

  const handleOptionSelect = (optionIndex: number) => {
    if (isFeedbackMode || !activeQuestion) return;
    
    const timeTaken = Date.now() - questionStartTime;
    setSelectedOption(optionIndex);
    setIsFeedbackMode(true);

    const isCorrect = optionIndex === activeQuestion.correctAnswer;
    
    // Record history immediately
    setHistory(prev => [...prev, { 
      questionId: activeQuestion.id, 
      correct: isCorrect, 
      difficulty: activeQuestion.difficulty,
      category: activeQuestion.category,
      timeTaken: timeTaken
    }]);
  };

  const handleNext = () => {
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex < QUESTIONS.length) {
      setCurrentQuestionIndex(nextIndex);
      setQuestionStartTime(Date.now()); // Reset timer for next Q
      setIsFeedbackMode(false);
      setSelectedOption(null);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = (finalHistory = history) => {
    // Calculate Webhook Payload using new structure
    const score = finalHistory.filter(h => h.correct).length;
    const total = QUESTIONS.length;

    // Calculate Median Time (ESL Indicator)
    const times = finalHistory.map(h => h.timeTaken).sort((a, b) => a - b);
    const medianTimeMs = times[Math.floor(times.length / 2)] || 0;

    const payload = {
      userInfo: userInfo || { name: 'Anonymous', email: '', targetUniversity: '' },
      score,
      total,
      medianTimeSeconds: Math.round(medianTimeMs / 1000),
      breakdown: {
        readingComp: finalHistory.filter(h => h.category === 'Reading Comprehension' && h.correct).length,
        logic: finalHistory.filter(h => h.category === 'Logical Reasoning' && h.correct).length,
        knowledge: finalHistory.filter(h => h.category === 'Knowledge & History' && h.correct).length,
        drawing: finalHistory.filter(h => h.category === 'Drawing & Representation' && h.correct).length,
        math: finalHistory.filter(h => h.category === 'Math & Physics' && h.correct).length,
      },
      history: finalHistory,
      submittedAt: new Date().toISOString()
    };

    // Send to webhook
    fetch('https://shumiha.app.n8n.cloud/webhook/f501c972-35ca-4300-83bf-dca634f20fb2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(err => console.error('Failed to send results to webhook:', err));

    // Save state to localStorage
    const results = {
      userInfo,
      history: finalHistory,
      score,
      total,
      medianTimeMs
    };
    localStorage.setItem('pontea_results', JSON.stringify(results));
    navigate('/results');
  };

  if (step === 'intro') {
    return <IntroScreen onStart={() => setStep('info')} />;
  }

  if (step === 'info') {
    return <UserInfoForm onSubmit={(info) => { setUserInfo(info); setStep('quiz'); setQuestionStartTime(Date.now()); }} />;
  }

  if (step === 'quiz' && activeQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <ProgressBar current={currentQuestionIndex + 1} total={QUESTIONS.length} />
          
          <QuestionCard 
            question={activeQuestion}
            onAnswer={handleOptionSelect}
            onNext={handleNext}
            currentNumber={currentQuestionIndex + 1}
            isFeedbackMode={isFeedbackMode}
            selectedAnswer={selectedOption}
            isLastQuestion={currentQuestionIndex === QUESTIONS.length - 1}
          />
        </div>
      </div>
    );
  }

  return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
};

export default AssessmentFlow;

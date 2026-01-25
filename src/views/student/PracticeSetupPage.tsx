import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/shared/Header';
import Button from '@/components/shared/Button';
import { useAuth } from '@/contexts/AuthContext';
import { generateExerciseSet } from '@/lib/test';
import { BrainCircuit, Sliders } from 'lucide-react';
import { QuestionDifficulty } from '@/types';

const NewExercisePage: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [config, setConfig] = useState({
    subjectId: 'all',
    difficulty: 'any',
    count: 10
  });

  const handleStart = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError('');
    
    try {
        const filters = {
            subjectId: config.subjectId,
            count: config.count,
            difficulty: config.difficulty === 'any' ? undefined : (config.difficulty as QuestionDifficulty)
        };
        const { id } = await generateExerciseSet(currentUser.id, filters);
        router.push(`/test/${id}`);
    } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to generate exercise. Try fewer questions or different filters.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        
        <div className="text-center mb-8">
            <div className="inline-flex justify-center items-center w-12 h-12 bg-primary/10 rounded-full mb-4 text-primary">
                <BrainCircuit className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Practice Session</h1>
            <p className="text-gray-500">Customize your drill to focus on weak spots.</p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="space-y-6">
                
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-accent" /> Subject
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {['all', 'math', 'physics', 'logic', 'history', 'drawing'].map(sub => (
                             <button
                                key={sub}
                                onClick={() => setConfig({...config, subjectId: sub})}
                                className={`py-3 px-4 rounded-lg text-sm font-medium border transition-all capitalize
                                    ${config.subjectId === sub 
                                        ? 'bg-primary text-white border-primary shadow-md' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'}
                                `}
                             >
                                {sub === 'all' ? 'All Subjects' : sub}
                             </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty</label>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {['any', 'easy', 'medium', 'hard'].map(diff => (
                            <button
                                key={diff}
                                onClick={() => setConfig({...config, difficulty: diff})}
                                className={`flex-1 py-2 text-sm font-medium rounded-md capitalize transition-all
                                    ${config.difficulty === diff 
                                        ? 'bg-white text-primary shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-700'}
                                `}
                            >
                                {diff}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2">Number of Questions: {config.count}</label>
                     <input 
                        type="range" 
                        min="5" 
                        max="50" 
                        step="5"
                        value={config.count}
                        onChange={e => setConfig({...config, count: parseInt(e.target.value)})}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                     />
                     <div className="flex justify-between text-xs text-gray-400 mt-2">
                        <span>5</span>
                        <span>25</span>
                        <span>50</span>
                     </div>
                </div>
                
                {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                        {error}
                    </div>
                )}

                <Button 
                    onClick={handleStart} 
                    fullWidth 
                    size="lg" 
                    isLoading={loading}
                    className="mt-4"
                >
                    Start Exercise
                </Button>
            </div>
        </div>
      </main>
    </div>
  );
};

export default NewExercisePage;

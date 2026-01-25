import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../components/shared/Header';
import Button from '../../components/shared/Button';
import { getQuestions, deleteQuestion } from '../../services/db';
import { QuestionModel } from '../../types';
import { Plus, Upload, Edit, Trash2, Search, Filter } from 'lucide-react';
import LaTeXRenderer from '../../components/shared/LaTeXRenderer';

const QuestionsPage: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionModel[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const data = await getQuestions(100);
      setQuestions(data);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      await deleteQuestion(id);
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Questions Bank</h1>
            <p className="text-gray-500">Manage your exercise content.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/questions/import">
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="w-4 h-4" /> Import CSV
              </Button>
            </Link>
            <Link href="/admin/questions/new">
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Question
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Filters Bar - Placeholder for future implementation */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex gap-4">
             <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search questions..." 
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
             </div>
             <Button variant="ghost" size="sm" className="text-gray-500">
               <Filter className="w-4 h-4 mr-2" /> Filters
             </Button>
          </div>

          {loading ? (
             <div className="p-12 text-center text-gray-500">Loading questions...</div>
          ) : questions.length === 0 ? (
             <div className="p-12 text-center text-gray-500">
                <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                   <Search className="w-6 h-6 text-gray-400" />
                </div>
                <p>No questions found.</p>
                <p className="text-sm">Add a new question or import a CSV to get started.</p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">Question</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Difficulty</th>
                    <th className="px-6 py-4">Stats</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {questions.map((q) => (
                    <tr key={q.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 max-w-md">
                        <div className="line-clamp-2 font-medium text-gray-900">
                            <LaTeXRenderer text={q.questionText} />
                        </div>
                        <div className="text-xs text-gray-400 mt-1 flex gap-2">
                            {q.tags?.map(t => <span key={t} className="bg-gray-100 px-1.5 py-0.5 rounded">#{t}</span>)}
                        </div>
                      </td>
                      <td className="px-6 py-4 capitalize text-gray-600">
                         {q.subjectId}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`
                          px-2 py-1 rounded text-xs font-bold uppercase
                          ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700' : ''}
                          ${q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : ''}
                          ${q.difficulty === 'hard' ? 'bg-red-100 text-red-700' : ''}
                        `}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                         <div>Attempts: {q.stats?.totalAttempts || 0}</div>
                         <div>Correct: {q.stats?.correctCount || 0}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => router.push(`/admin/questions/${q.id}/edit`)}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-primary transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(q.id)}
                            className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default QuestionsPage;

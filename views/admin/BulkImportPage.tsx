import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/shared/Header';
import Button from '../../components/shared/Button';
import { parseQuestionsCSV } from '../../utils/csvParser';
import { batchCreateQuestions } from '../../services/db';
import { ParsedQuestion } from '../../types';
import { Upload, FileText, AlertCircle, CheckCircle2, ArrowLeft, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const BulkImportPage: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedQuestion[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const [error, setError] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setError('');
    
    try {
      const data = await parseQuestionsCSV(selectedFile);
      setParsedData(data);
      setStep('preview');
    } catch (err: any) {
      setError("Failed to parse CSV: " + err.message);
    }
  };

  const handleImport = async () => {
    if (!currentUser) return;
    
    const validQuestions = parsedData.filter(q => q.isValid).map(q => ({
      ...q.data,
      createdBy: currentUser.id
    }));

    if (validQuestions.length === 0) {
      setError("No valid questions to import.");
      return;
    }

    setStep('importing');
    try {
      await batchCreateQuestions(validQuestions);
      router.push('/admin/questions');
    } catch (err: any) {
      console.error(err);
      setError("Import failed: " + err.message);
      setStep('preview');
    }
  };

  const validCount = parsedData.filter(q => q.isValid).length;
  const invalidCount = parsedData.length - validCount;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        
        <div className="flex items-center gap-4 mb-8">
            <button onClick={() => router.push('/admin/questions')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Bulk Import Questions</h1>
        </div>

        {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
            </div>
        )}

        {step === 'upload' && (
           <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-gray-300 text-center">
               <div className="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                   <Upload className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold text-gray-900 mb-2">Upload CSV File</h3>
               <p className="text-gray-500 mb-8 max-w-md mx-auto">
                   Drag and drop your CSV file here, or click to browse. Ensure your CSV follows the required format.
               </p>
               
               <div className="flex justify-center gap-4">
                  <label className="cursor-pointer">
                      <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                      <Button as="div" size="lg">Select File</Button>
                  </label>
                  <Button variant="outline" size="lg" className="flex items-center gap-2" onClick={() => {
                      // Trigger download of template (simulated)
                      const csvContent = "subjectId,topicId,difficulty,tags,questionText,optionA,optionB,optionC,optionD,correctAnswer,explanation\nmath,algebra,medium,\"linear,equations\",\"Solve for x: 2x=4\",1,2,3,4,b,\"Divide by 2\"";
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = "pontea_template.csv";
                      a.click();
                  }}>
                      <Download className="w-4 h-4" /> Template
                  </Button>
               </div>
           </div>
        )}

        {step === 'preview' && (
            <div className="space-y-6">
                <div className="flex gap-4">
                    <div className="flex-1 bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-primary font-bold">
                            {parsedData.length}
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Total Rows</div>
                            <div className="font-bold">Found</div>
                        </div>
                    </div>
                    <div className="flex-1 bg-white p-4 rounded-xl border border-green-100 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 font-bold">
                            {validCount}
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Valid</div>
                            <div className="font-bold text-green-600">Ready to Import</div>
                        </div>
                    </div>
                    <div className="flex-1 bg-white p-4 rounded-xl border border-red-100 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-bold">
                            {invalidCount}
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Invalid</div>
                            <div className="font-bold text-red-600">Will be skipped</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="px-4 py-3">Row</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Subject</th>
                                    <th className="px-4 py-3">Question</th>
                                    <th className="px-4 py-3">Issues</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {parsedData.map((row) => (
                                    <tr key={row.rowNumber} className={row.isValid ? 'hover:bg-gray-50' : 'bg-red-50/30'}>
                                        <td className="px-4 py-3 font-mono text-gray-500">#{row.rowNumber}</td>
                                        <td className="px-4 py-3">
                                            {row.isValid ? (
                                                <span className="inline-flex items-center gap-1 text-green-600 font-bold text-xs">
                                                    <CheckCircle2 className="w-3 h-3" /> Valid
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-red-600 font-bold text-xs">
                                                    <AlertCircle className="w-3 h-3" /> Invalid
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">{row.data.subjectId}</td>
                                        <td className="px-4 py-3 max-w-xs truncate" title={row.data.questionText}>{row.data.questionText}</td>
                                        <td className="px-4 py-3 text-red-500 text-xs">
                                            {row.errors.join(', ')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Button variant="outline" onClick={() => setStep('upload')}>Cancel</Button>
                    <Button onClick={handleImport} disabled={validCount === 0}>
                        Import {validCount} Questions
                    </Button>
                </div>
            </div>
        )}

        {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-bold text-primary mb-2">Importing Questions...</h3>
                <p className="text-gray-500">Please wait while we save to Firestore.</p>
            </div>
        )}

      </main>
    </div>
  );
};

export default BulkImportPage;

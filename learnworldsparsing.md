LearnWorlds CSV Format Support Implementation Plan                                                                                                                            
                                                                                                                                                                               
 Overview                                                                                                                                                                      
                                                                                                                                                                               
 Add support for LearnWorlds CSV format alongside existing Pontea format, with automatic format detection, AI-based difficulty detection, and 5-option question support.       
                                                                                                                                                                               
 User Requirements                                                                                                                                                             
                                                                                                                                                                               
 - 5 Options: Use all 5 answer options (Answer1-5), map numeric answers 1-5 to a-e                                                                                             
 - Group Field: Ignore for Subject mapping (will be stored in tags for reference)                                                                                              
 - Difficulty: AI auto-detect from question text using OpenAI                                                                                                                  
 - Explanations: Combine CorrectExplanation and IncorrectExplanation with labels                                                                                               
                                                                                                                                                                               
 Format Comparison                                                                                                                                                             
                                                                                                                                                                               
 Current Pontea Format                                                                                                                                                         
                                                                                                                                                                               
 subjectId,topicId,difficulty,tags,questionText,optionA,optionB,optionC,optionD,correctAnswer,explanation                                                                      
                                                                                                                                                                               
 LearnWorlds Format                                                                                                                                                            
                                                                                                                                                                               
 Group,Type,Question,CorrectAns,Answer1,Answer2,Answer3,Answer4,Answer5,CorrectExplanation,IncorrectExplanation                                                                
                                                                                                                                                                               
 Key Mapping Strategy                                                                                                                                                          
 ┌───────────────────────────────────────────┬─────────────────────┬────────────────────────────────────────────┐                                                              
 │                LearnWorlds                │       Pontea        │                  Handling                  │                                                              
 ├───────────────────────────────────────────┼─────────────────────┼────────────────────────────────────────────┤                                                              
 │ Question                                  │ questionText        │ Direct mapping                             │                                                              
 ├───────────────────────────────────────────┼─────────────────────┼────────────────────────────────────────────┤                                                              
 │ Answer1-5                                 │ options[a-e]        │ Map to 5-option array                      │                                                              
 ├───────────────────────────────────────────┼─────────────────────┼────────────────────────────────────────────┤                                                              
 │ CorrectAns (1-5)                          │ correctAnswer (a-e) │ Numeric to letter: 1→a, 2→b, 3→c, 4→d, 5→e │                                                              
 ├───────────────────────────────────────────┼─────────────────────┼────────────────────────────────────────────┤                                                              
 │ Group                                     │ tags                │ Store as group:${Group} in tags array      │                                                              
 ├───────────────────────────────────────────┼─────────────────────┼────────────────────────────────────────────┤                                                              
 │ Type                                      │ tags                │ Store as type:${Type} in tags array        │                                                              
 ├───────────────────────────────────────────┼─────────────────────┼────────────────────────────────────────────┤                                                              
 │ CorrectExplanation + IncorrectExplanation │ explanation         │ Combine: "Correct: ... | Incorrect: ..."   │                                                              
 ├───────────────────────────────────────────┼─────────────────────┼────────────────────────────────────────────┤                                                              
 │ (missing)                                 │ difficulty          │ AI auto-detect using OpenAI API            │                                                              
 ├───────────────────────────────────────────┼─────────────────────┼────────────────────────────────────────────┤                                                              
 │ (missing)                                 │ subjectId           │ Required: User must select default Subject │                                                              
 ├───────────────────────────────────────────┼─────────────────────┼────────────────────────────────────────────┤                                                              
 │ (missing)                                 │ topicId             │ Set to null (general)                      │                                                              
 └───────────────────────────────────────────┴─────────────────────┴────────────────────────────────────────────┘                                                              
 Implementation Steps                                                                                                                                                          
                                                                                                                                                                               
 1. Create Format Detector (src/utils/csvFormatDetector.ts)                                                                                                                    
                                                                                                                                                                               
 New file to detect CSV format from column headers.                                                                                                                            
                                                                                                                                                                               
 export type CSVFormat = 'pontea' | 'learnworlds' | 'unknown';                                                                                                                 
                                                                                                                                                                               
 export const detectCSVFormat = (headers: string[]): CSVFormat => {                                                                                                            
   const headerSet = new Set(headers.map(h => h.toLowerCase().trim()));                                                                                                        
                                                                                                                                                                               
   // LearnWorlds signature: Group, CorrectAns, Answer1                                                                                                                        
   if (headerSet.has('group') && headerSet.has('correctans') && headerSet.has('answer1')) {                                                                                    
     return 'learnworlds';                                                                                                                                                     
   }                                                                                                                                                                           
                                                                                                                                                                               
   // Pontea signature: subjectId, optionA, optionB                                                                                                                            
   if (headerSet.has('subjectid') && headerSet.has('optiona') && headerSet.has('optionb')) {                                                                                   
     return 'pontea';                                                                                                                                                          
   }                                                                                                                                                                           
                                                                                                                                                                               
   return 'unknown';                                                                                                                                                           
 };                                                                                                                                                                            
                                                                                                                                                                               
 Testing: Create unit tests with sample headers from both formats.                                                                                                             
                                                                                                                                                                               
 ---                                                                                                                                                                           
 2. Add LearnWorlds Parser (src/utils/csvParser.ts)                                                                                                                            
                                                                                                                                                                               
 Extend existing file with new parser function.                                                                                                                                
                                                                                                                                                                               
 Add LearnWorlds Row Interface                                                                                                                                                 
                                                                                                                                                                               
 interface LearnWorldsCSVRow {                                                                                                                                                 
   Group: string;                                                                                                                                                              
   Type: string;                                                                                                                                                               
   Question: string;                                                                                                                                                           
   CorrectAns: string;                                                                                                                                                         
   Answer1: string;                                                                                                                                                            
   Answer2: string;                                                                                                                                                            
   Answer3: string;                                                                                                                                                            
   Answer4: string;                                                                                                                                                            
   Answer5: string;                                                                                                                                                            
   CorrectExplanation: string;                                                                                                                                                 
   IncorrectExplanation: string;                                                                                                                                               
 }                                                                                                                                                                             
                                                                                                                                                                               
 Add LearnWorlds Parser Function                                                                                                                                               
                                                                                                                                                                               
 export const parseLearnWorldsCSV = async (                                                                                                                                    
   file: File,                                                                                                                                                                 
   defaultSubjectId: string,                                                                                                                                                   
   defaultTopicId: string | null = null                                                                                                                                        
 ): Promise<ParsedQuestion[]> => {                                                                                                                                             
   return new Promise((resolve, reject) => {                                                                                                                                   
     Papa.parse<LearnWorldsCSVRow>(file, {                                                                                                                                     
       header: true,                                                                                                                                                           
       skipEmptyLines: true,                                                                                                                                                   
       complete: async (results) => {                                                                                                                                          
         const questions: ParsedQuestion[] = [];                                                                                                                               
                                                                                                                                                                               
         for (const [index, row] of results.data.entries()) {                                                                                                                  
           const errors: string[] = [];                                                                                                                                        
                                                                                                                                                                               
           // Validation                                                                                                                                                       
           if (!row.Question?.trim()) errors.push('Missing Question');                                                                                                         
           if (!row.Answer1?.trim()) errors.push('Missing Answer1');                                                                                                           
           if (!row.Answer2?.trim()) errors.push('Missing Answer2');                                                                                                           
           if (!row.Answer3?.trim()) errors.push('Missing Answer3');                                                                                                           
           if (!row.Answer4?.trim()) errors.push('Missing Answer4');                                                                                                           
           if (!row.Answer5?.trim()) errors.push('Missing Answer5');                                                                                                           
                                                                                                                                                                               
           // Map numeric answer (1-5) to letter (a-e)                                                                                                                         
           const numericAnswer = parseInt(row.CorrectAns?.trim());                                                                                                             
           const answerMap: Record<number, OptionId> = { 1: 'a', 2: 'b', 3: 'c', 4: 'd', 5: 'e' };                                                                             
           const correctAnswer = answerMap[numericAnswer];                                                                                                                     
                                                                                                                                                                               
           if (!correctAnswer) {                                                                                                                                               
             errors.push('Invalid CorrectAns (must be 1, 2, 3, 4, or 5)');                                                                                                     
           }                                                                                                                                                                   
                                                                                                                                                                               
           // Combine explanations                                                                                                                                             
           const correctExpl = row.CorrectExplanation?.trim();                                                                                                                 
           const incorrectExpl = row.IncorrectExplanation?.trim();                                                                                                             
           let explanation = 'No explanation provided.';                                                                                                                       
                                                                                                                                                                               
           if (correctExpl && incorrectExpl) {                                                                                                                                 
             explanation = `Correct: ${correctExpl} | Incorrect: ${incorrectExpl}`;                                                                                            
           } else if (correctExpl) {                                                                                                                                           
             explanation = correctExpl;                                                                                                                                        
           } else if (incorrectExpl) {                                                                                                                                         
             explanation = incorrectExpl;                                                                                                                                      
           }                                                                                                                                                                   
                                                                                                                                                                               
           // Build tags array                                                                                                                                                 
           const tags: string[] = [];                                                                                                                                          
           if (row.Group?.trim()) tags.push(`group:${row.Group.trim()}`);                                                                                                      
           if (row.Type?.trim()) tags.push(`type:${row.Type.trim()}`);                                                                                                         
                                                                                                                                                                               
           // AI-detect difficulty (placeholder - will be filled in step 3)                                                                                                    
           const difficulty = 'medium' as QuestionDifficulty; // Temporary default                                                                                             
                                                                                                                                                                               
           questions.push({                                                                                                                                                    
             rowNumber: index + 2,                                                                                                                                             
             data: {                                                                                                                                                           
               subjectId: defaultSubjectId,                                                                                                                                    
               topicId: defaultTopicId,                                                                                                                                        
               difficulty,                                                                                                                                                     
               tags,                                                                                                                                                           
               questionText: row.Question?.trim(),                                                                                                                             
               questionImageUrl: null,                                                                                                                                         
               options: [                                                                                                                                                      
                 { id: 'a', text: row.Answer1?.trim() },                                                                                                                       
                 { id: 'b', text: row.Answer2?.trim() },                                                                                                                       
                 { id: 'c', text: row.Answer3?.trim() },                                                                                                                       
                 { id: 'd', text: row.Answer4?.trim() },                                                                                                                       
                 { id: 'e', text: row.Answer5?.trim() }                                                                                                                        
               ],                                                                                                                                                              
               correctAnswer,                                                                                                                                                  
               explanation,                                                                                                                                                    
               explanationImageUrl: null,                                                                                                                                      
               isActive: true,                                                                                                                                                 
               stats: { totalAttempts: 0, totalTimeSpent: 0, correctCount: 0 }                                                                                                 
             },                                                                                                                                                                
             isValid: errors.length === 0,                                                                                                                                     
             errors,                                                                                                                                                           
             sourceFormat: 'learnworlds',                                                                                                                                      
             metadata: {                                                                                                                                                       
               originalGroup: row.Group?.trim(),                                                                                                                               
               questionType: row.Type?.trim()                                                                                                                                  
             }                                                                                                                                                                 
           });                                                                                                                                                                 
         }                                                                                                                                                                     
                                                                                                                                                                               
         resolve(questions);                                                                                                                                                   
       },                                                                                                                                                                      
       error: (error) => reject(error)                                                                                                                                         
     });                                                                                                                                                                       
   });                                                                                                                                                                         
 };                                                                                                                                                                            
                                                                                                                                                                               
 ---                                                                                                                                                                           
 3. Create AI Difficulty Detection API (src/app/api/admin/questions/detect-difficulty/route.ts)                                                                                
                                                                                                                                                                               
 New API endpoint to detect difficulty using OpenAI.                                                                                                                           
                                                                                                                                                                               
 import { NextRequest, NextResponse } from 'next/server';                                                                                                                      
 import OpenAI from 'openai';                                                                                                                                                  
 import { getAuthUser } from '@/lib/supabase/server';                                                                                                                          
                                                                                                                                                                               
 const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });                                                                                                            
                                                                                                                                                                               
 interface DifficultyDetectRequest {                                                                                                                                           
   questions: Array<{                                                                                                                                                          
     id: string; // Row ID for tracking                                                                                                                                        
     questionText: string;                                                                                                                                                     
   }>;                                                                                                                                                                         
 }                                                                                                                                                                             
                                                                                                                                                                               
 interface DifficultyResult {                                                                                                                                                  
   id: string;                                                                                                                                                                 
   difficulty: 'easy' | 'medium' | 'hard';                                                                                                                                     
 }                                                                                                                                                                             
                                                                                                                                                                               
 export async function POST(request: NextRequest) {                                                                                                                            
   try {                                                                                                                                                                       
     const user = await getAuthUser(request);                                                                                                                                  
     if (!user || user.role !== 'admin') {                                                                                                                                     
       return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });                                                                                                   
     }                                                                                                                                                                         
                                                                                                                                                                               
     const body: DifficultyDetectRequest = await request.json();                                                                                                               
                                                                                                                                                                               
     if (!body.questions || body.questions.length === 0) {                                                                                                                     
       return NextResponse.json({ error: 'No questions provided' }, { status: 400 });                                                                                          
     }                                                                                                                                                                         
                                                                                                                                                                               
     // Process in batches of 10                                                                                                                                               
     const results: DifficultyResult[] = [];                                                                                                                                   
     const batchSize = 10;                                                                                                                                                     
                                                                                                                                                                               
     for (let i = 0; i < body.questions.length; i += batchSize) {                                                                                                              
       const batch = body.questions.slice(i, i + batchSize);                                                                                                                   
       const batchResults = await Promise.all(                                                                                                                                 
         batch.map(q => detectDifficulty(q.questionText, q.id))                                                                                                                
       );                                                                                                                                                                      
       results.push(...batchResults);                                                                                                                                          
     }                                                                                                                                                                         
                                                                                                                                                                               
     return NextResponse.json({ results });                                                                                                                                    
   } catch (error) {                                                                                                                                                           
     console.error('Difficulty detection error:', error);                                                                                                                      
     return NextResponse.json(                                                                                                                                                 
       { error: 'Failed to detect difficulty' },                                                                                                                               
       { status: 500 }                                                                                                                                                         
     );                                                                                                                                                                        
   }                                                                                                                                                                           
 }                                                                                                                                                                             
                                                                                                                                                                               
 async function detectDifficulty(                                                                                                                                              
   questionText: string,                                                                                                                                                       
   id: string                                                                                                                                                                  
 ): Promise<DifficultyResult> {                                                                                                                                                
   try {                                                                                                                                                                       
     const completion = await openai.chat.completions.create({                                                                                                                 
       model: 'gpt-4o-mini',                                                                                                                                                   
       messages: [                                                                                                                                                             
         {                                                                                                                                                                     
           role: 'system',                                                                                                                                                     
           content: `You are an expert at analyzing educational question difficulty.                                                                                           
 Analyze the question and respond with ONLY one word: "easy", "medium", or "hard".                                                                                             
                                                                                                                                                                               
 Criteria:                                                                                                                                                                     
 - easy: Basic recall, simple definitions, straightforward concepts                                                                                                            
 - medium: Application of concepts, moderate reasoning, standard problems                                                                                                      
 - hard: Complex analysis, multi-step reasoning, advanced synthesis`                                                                                                           
         },                                                                                                                                                                    
         {                                                                                                                                                                     
           role: 'user',                                                                                                                                                       
           content: questionText                                                                                                                                               
         }                                                                                                                                                                     
       ],                                                                                                                                                                      
       temperature: 0.3,                                                                                                                                                       
       max_tokens: 10                                                                                                                                                          
     });                                                                                                                                                                       
                                                                                                                                                                               
     const difficulty = completion.choices[0].message.content                                                                                                                  
       ?.toLowerCase()                                                                                                                                                         
       .trim() as 'easy' | 'medium' | 'hard';                                                                                                                                  
                                                                                                                                                                               
     if (!['easy', 'medium', 'hard'].includes(difficulty)) {                                                                                                                   
       return { id, difficulty: 'medium' }; // Fallback                                                                                                                        
     }                                                                                                                                                                         
                                                                                                                                                                               
     return { id, difficulty };                                                                                                                                                
   } catch (error) {                                                                                                                                                           
     console.error(`Difficulty detection failed for question ${id}:`, error);                                                                                                  
     return { id, difficulty: 'medium' }; // Fallback to medium on error                                                                                                       
   }                                                                                                                                                                           
 }                                                                                                                                                                             
                                                                                                                                                                               
 ---                                                                                                                                                                           
 4. Update Types (src/types/index.ts)                                                                                                                                          
                                                                                                                                                                               
 Extend existing interfaces to support format metadata.                                                                                                                        
                                                                                                                                                                               
 // Add to existing file                                                                                                                                                       
 export interface ParsedQuestion {                                                                                                                                             
   rowNumber: number;                                                                                                                                                          
   data: Omit<QuestionModel, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;                                                                                                  
   isValid: boolean;                                                                                                                                                           
   errors: string[];                                                                                                                                                           
   sourceFormat?: 'pontea' | 'learnworlds';  // NEW                                                                                                                            
   metadata?: {                                // NEW                                                                                                                          
     originalGroup?: string;                                                                                                                                                   
     questionType?: string;                                                                                                                                                    
   };                                                                                                                                                                          
 }                                                                                                                                                                             
                                                                                                                                                                               
 export interface CSVImportConfig {          // NEW                                                                                                                            
   format: 'pontea' | 'learnworlds';                                                                                                                                           
   defaultSubjectId?: string;                                                                                                                                                  
   defaultTopicId?: string | null;                                                                                                                                             
   detectDifficulty?: boolean;                                                                                                                                                 
 }                                                                                                                                                                             
                                                                                                                                                                               
 ---                                                                                                                                                                           
 5. Create Configuration Component (src/components/admin/CSVImportConfig.tsx)                                                                                                  
                                                                                                                                                                               
 New component for LearnWorlds-specific configuration.                                                                                                                         
                                                                                                                                                                               
 'use client';                                                                                                                                                                 
                                                                                                                                                                               
 import { useState } from 'react';                                                                                                                                             
 import { SubjectModel, TopicModel } from '@/types';                                                                                                                           
 import { Button } from '@/components/shared/Button';                                                                                                                          
                                                                                                                                                                               
 interface CSVImportConfigProps {                                                                                                                                              
   subjects: SubjectModel[];                                                                                                                                                   
   topics: TopicModel[];                                                                                                                                                       
   onConfigComplete: (config: {                                                                                                                                                
     defaultSubjectId: string;                                                                                                                                                 
     defaultTopicId: string | null;                                                                                                                                            
   }) => void;                                                                                                                                                                 
   onCancel: () => void;                                                                                                                                                       
 }                                                                                                                                                                             
                                                                                                                                                                               
 export default function CSVImportConfig({                                                                                                                                     
   subjects,                                                                                                                                                                   
   topics,                                                                                                                                                                     
   onConfigComplete,                                                                                                                                                           
   onCancel                                                                                                                                                                    
 }: CSVImportConfigProps) {                                                                                                                                                    
   const [selectedSubject, setSelectedSubject] = useState<string>('');                                                                                                         
   const [selectedTopic, setSelectedTopic] = useState<string>('');                                                                                                             
                                                                                                                                                                               
   const filteredTopics = topics.filter(t => t.subjectId === selectedSubject);                                                                                                 
                                                                                                                                                                               
   const handleContinue = () => {                                                                                                                                              
     if (!selectedSubject) return;                                                                                                                                             
                                                                                                                                                                               
     onConfigComplete({                                                                                                                                                        
       defaultSubjectId: selectedSubject,                                                                                                                                      
       defaultTopicId: selectedTopic || null                                                                                                                                   
     });                                                                                                                                                                       
   };                                                                                                                                                                          
                                                                                                                                                                               
   return (                                                                                                                                                                    
     <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">                                                                                                     
       <div className="mb-6">                                                                                                                                                  
         <h2 className="text-2xl font-bold text-gray-900 mb-2">                                                                                                                
           LearnWorlds Format Detected                                                                                                                                         
         </h2>                                                                                                                                                                 
         <p className="text-gray-600">                                                                                                                                         
           Configure default settings for imported questions. Difficulty will be                                                                                               
           automatically detected using AI.                                                                                                                                    
         </p>                                                                                                                                                                  
       </div>                                                                                                                                                                  
                                                                                                                                                                               
       <div className="space-y-4">                                                                                                                                             
         {/* Subject Selection */}                                                                                                                                             
         <div>                                                                                                                                                                 
           <label className="block text-sm font-medium text-gray-700 mb-2">                                                                                                    
             Default Subject <span className="text-red-500">*</span>                                                                                                           
           </label>                                                                                                                                                            
           <select                                                                                                                                                             
             value={selectedSubject}                                                                                                                                           
             onChange={(e) => {                                                                                                                                                
               setSelectedSubject(e.target.value);                                                                                                                             
               setSelectedTopic(''); // Reset topic when subject changes                                                                                                       
             }}                                                                                                                                                                
             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"                                                 
           >                                                                                                                                                                   
             <option value="">Select a subject...</option>                                                                                                                     
             {subjects.map((subject) => (                                                                                                                                      
               <option key={subject.id} value={subject.id}>                                                                                                                    
                 {subject.name}                                                                                                                                                
               </option>                                                                                                                                                       
             ))}                                                                                                                                                               
           </select>                                                                                                                                                           
         </div>                                                                                                                                                                
                                                                                                                                                                               
         {/* Topic Selection (Optional) */}                                                                                                                                    
         <div>                                                                                                                                                                 
           <label className="block text-sm font-medium text-gray-700 mb-2">                                                                                                    
             Default Topic (Optional)                                                                                                                                          
           </label>                                                                                                                                                            
           <select                                                                                                                                                             
             value={selectedTopic}                                                                                                                                             
             onChange={(e) => setSelectedTopic(e.target.value)}                                                                                                                
             disabled={!selectedSubject}                                                                                                                                       
             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"                            
           >                                                                                                                                                                   
             <option value="">None (General)</option>                                                                                                                          
             {filteredTopics.map((topic) => (                                                                                                                                  
               <option key={topic.id} value={topic.id}>                                                                                                                        
                 {topic.name}                                                                                                                                                  
               </option>                                                                                                                                                       
             ))}                                                                                                                                                               
           </select>                                                                                                                                                           
         </div>                                                                                                                                                                
                                                                                                                                                                               
         {/* Info Box */}                                                                                                                                                      
         <div className="bg-blue-50 border border-blue-200 rounded-md p-4">                                                                                                    
           <h4 className="text-sm font-semibold text-blue-900 mb-2">                                                                                                           
             Auto-Detection Features:                                                                                                                                          
           </h4>                                                                                                                                                               
           <ul className="text-sm text-blue-800 space-y-1">                                                                                                                    
             <li>✓ Difficulty levels will be analyzed using AI</li>                                                                                                            
             <li>✓ Group values will be stored in tags</li>                                                                                                                    
             <li>✓ Type values will be stored in tags</li>                                                                                                                     
             <li>✓ All 5 answer options will be imported</li>                                                                                                                  
           </ul>                                                                                                                                                               
         </div>                                                                                                                                                                
       </div>                                                                                                                                                                  
                                                                                                                                                                               
       {/* Actions */}                                                                                                                                                         
       <div className="flex gap-3 mt-6">                                                                                                                                       
         <Button onClick={onCancel} variant="outline" className="flex-1">                                                                                                      
           Cancel                                                                                                                                                              
         </Button>                                                                                                                                                             
         <Button                                                                                                                                                               
           onClick={handleContinue}                                                                                                                                            
           disabled={!selectedSubject}                                                                                                                                         
           className="flex-1"                                                                                                                                                  
         >                                                                                                                                                                     
           Continue to Preview                                                                                                                                                 
         </Button>                                                                                                                                                             
       </div>                                                                                                                                                                  
     </div>                                                                                                                                                                    
   );                                                                                                                                                                          
 }                                                                                                                                                                             
                                                                                                                                                                               
 ---                                                                                                                                                                           
 6. Update BulkImportPage (src/views/admin/BulkImportPage.tsx)                                                                                                                 
                                                                                                                                                                               
 Major modifications to integrate format detection and configuration step.                                                                                                     
                                                                                                                                                                               
 Add State for Format Detection                                                                                                                                                
                                                                                                                                                                               
 const [detectedFormat, setDetectedFormat] = useState<CSVFormat | null>(null);                                                                                                 
 const [importConfig, setImportConfig] = useState<CSVImportConfig | null>(null);                                                                                               
 const [isDifficultyDetecting, setIsDifficultyDetecting] = useState(false);                                                                                                    
                                                                                                                                                                               
 Modify handleFileUpload Function                                                                                                                                              
                                                                                                                                                                               
 const handleFileUpload = async (file: File) => {                                                                                                                              
   setIsLoading(true);                                                                                                                                                         
   setError(null);                                                                                                                                                             
                                                                                                                                                                               
   try {                                                                                                                                                                       
     // Read first line to get headers                                                                                                                                         
     const text = await file.text();                                                                                                                                           
     const firstLine = text.split('\n')[0];                                                                                                                                    
     const headers = firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));                                                                                            
                                                                                                                                                                               
     // Detect format                                                                                                                                                          
     const format = detectCSVFormat(headers);                                                                                                                                  
     setDetectedFormat(format);                                                                                                                                                
                                                                                                                                                                               
     if (format === 'unknown') {                                                                                                                                               
       setError('Unrecognized CSV format. Please use Pontea or LearnWorlds format.');                                                                                          
       setIsLoading(false);                                                                                                                                                    
       return;                                                                                                                                                                 
     }                                                                                                                                                                         
                                                                                                                                                                               
     // If LearnWorlds, show config step                                                                                                                                       
     if (format === 'learnworlds') {                                                                                                                                           
       setStep('config'); // New step                                                                                                                                          
       setUploadedFile(file); // Store file for later parsing                                                                                                                  
     } else {                                                                                                                                                                  
       // Pontea format - parse immediately                                                                                                                                    
       const questions = await parseQuestionsCSV(file);                                                                                                                        
       setParsedQuestions(questions);                                                                                                                                          
       setStep('preview');                                                                                                                                                     
     }                                                                                                                                                                         
   } catch (err) {                                                                                                                                                             
     setError('Failed to process CSV file');                                                                                                                                   
   } finally {                                                                                                                                                                 
     setIsLoading(false);                                                                                                                                                      
   }                                                                                                                                                                           
 };                                                                                                                                                                            
                                                                                                                                                                               
 Add Config Completion Handler                                                                                                                                                 
                                                                                                                                                                               
 const handleConfigComplete = async (config: {                                                                                                                                 
   defaultSubjectId: string;                                                                                                                                                   
   defaultTopicId: string | null;                                                                                                                                              
 }) => {                                                                                                                                                                       
   setIsLoading(true);                                                                                                                                                         
   setError(null);                                                                                                                                                             
                                                                                                                                                                               
   try {                                                                                                                                                                       
     // Parse LearnWorlds CSV with config                                                                                                                                      
     const questions = await parseLearnWorldsCSV(                                                                                                                              
       uploadedFile!,                                                                                                                                                          
       config.defaultSubjectId,                                                                                                                                                
       config.defaultTopicId                                                                                                                                                   
     );                                                                                                                                                                        
                                                                                                                                                                               
     // Detect difficulty for all questions                                                                                                                                    
     setIsDifficultyDetecting(true);                                                                                                                                           
     const difficultyResults = await detectDifficulties(questions);                                                                                                            
                                                                                                                                                                               
     // Update questions with detected difficulties                                                                                                                            
     const updatedQuestions = questions.map(q => {                                                                                                                             
       const result = difficultyResults.find(r => r.id === `${q.rowNumber}`);                                                                                                  
       if (result) {                                                                                                                                                           
         q.data.difficulty = result.difficulty;                                                                                                                                
       }                                                                                                                                                                       
       return q;                                                                                                                                                               
     });                                                                                                                                                                       
                                                                                                                                                                               
     setParsedQuestions(updatedQuestions);                                                                                                                                     
     setStep('preview');                                                                                                                                                       
   } catch (err) {                                                                                                                                                             
     setError('Failed to parse LearnWorlds CSV');                                                                                                                              
   } finally {                                                                                                                                                                 
     setIsLoading(false);                                                                                                                                                      
     setIsDifficultyDetecting(false);                                                                                                                                          
   }                                                                                                                                                                           
 };                                                                                                                                                                            
                                                                                                                                                                               
 const detectDifficulties = async (questions: ParsedQuestion[]) => {                                                                                                           
   const response = await fetch('/api/admin/questions/detect-difficulty', {                                                                                                    
     method: 'POST',                                                                                                                                                           
     headers: { 'Content-Type': 'application/json' },                                                                                                                          
     body: JSON.stringify({                                                                                                                                                    
       questions: questions.map(q => ({                                                                                                                                        
         id: `${q.rowNumber}`,                                                                                                                                                 
         questionText: q.data.questionText                                                                                                                                     
       }))                                                                                                                                                                     
     })                                                                                                                                                                        
   });                                                                                                                                                                         
                                                                                                                                                                               
   if (!response.ok) throw new Error('Difficulty detection failed');                                                                                                           
                                                                                                                                                                               
   const data = await response.json();                                                                                                                                         
   return data.results;                                                                                                                                                        
 };                                                                                                                                                                            
                                                                                                                                                                               
 Update Render Logic                                                                                                                                                           
                                                                                                                                                                               
 return (                                                                                                                                                                      
   <div className="container mx-auto px-4 py-8">                                                                                                                               
     {/* Format Badge */}                                                                                                                                                      
     {detectedFormat && (                                                                                                                                                      
       <div className="mb-4">                                                                                                                                                  
         <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${                                                                                          
           detectedFormat === 'pontea'                                                                                                                                         
             ? 'bg-blue-100 text-blue-800'                                                                                                                                     
             : 'bg-green-100 text-green-800'                                                                                                                                   
         }`}>                                                                                                                                                                  
           {detectedFormat === 'pontea' ? 'Pontea Format' : 'LearnWorlds Format'}                                                                                              
         </span>                                                                                                                                                               
       </div>                                                                                                                                                                  
     )}                                                                                                                                                                        
                                                                                                                                                                               
     {/* Step Content */}                                                                                                                                                      
     {step === 'upload' && <UploadStep />}                                                                                                                                     
                                                                                                                                                                               
     {step === 'config' && (                                                                                                                                                   
       <CSVImportConfig                                                                                                                                                        
         subjects={subjects}                                                                                                                                                   
         topics={topics}                                                                                                                                                       
         onConfigComplete={handleConfigComplete}                                                                                                                               
         onCancel={() => setStep('upload')}                                                                                                                                    
       />                                                                                                                                                                      
     )}                                                                                                                                                                        
                                                                                                                                                                               
     {step === 'preview' && (                                                                                                                                                  
       <>                                                                                                                                                                      
         {isDifficultyDetecting && (                                                                                                                                           
           <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">                                                                                             
             <div className="flex items-center gap-2">                                                                                                                         
               <Loader className="w-5 h-5 animate-spin text-blue-600" />                                                                                                       
               <span className="text-blue-800">                                                                                                                                
                 Detecting difficulty levels with AI...                                                                                                                        
               </span>                                                                                                                                                         
             </div>                                                                                                                                                            
           </div>                                                                                                                                                              
         )}                                                                                                                                                                    
         <PreviewStep questions={parsedQuestions} />                                                                                                                           
       </>                                                                                                                                                                     
     )}                                                                                                                                                                        
   </div>                                                                                                                                                                      
 );                                                                                                                                                                            
                                                                                                                                                                               
 ---                                                                                                                                                                           
 7. Update Preview Table                                                                                                                                                       
                                                                                                                                                                               
 Enhance preview to show format-specific metadata.                                                                                                                             
                                                                                                                                                                               
 Add columns to preview table in BulkImportPage:                                                                                                                               
 - Show "Format" badge per row                                                                                                                                                 
 - Display Group value if LearnWorlds format                                                                                                                                   
 - Show AI-detected difficulty with badge                                                                                                                                      
 - Display 5 options (a-e) for LearnWorlds questions                                                                                                                           
                                                                                                                                                                               
 <td className="px-4 py-2">                                                                                                                                                    
   {question.sourceFormat === 'learnworlds' && question.metadata?.originalGroup && (                                                                                           
     <span className="text-xs text-gray-500 block">                                                                                                                            
       Group: {question.metadata.originalGroup}                                                                                                                                
     </span>                                                                                                                                                                   
   )}                                                                                                                                                                          
   {/* Display difficulty with AI badge */}                                                                                                                                    
   <span className="inline-flex items-center gap-1">                                                                                                                           
     {question.data.difficulty}                                                                                                                                                
     {question.sourceFormat === 'learnworlds' && (                                                                                                                             
       <span className="text-xs bg-purple-100 text-purple-700 px-1 rounded">AI</span>                                                                                          
     )}                                                                                                                                                                        
   </span>                                                                                                                                                                     
 </td>                                                                                                                                                                         
                                                                                                                                                                               
 ---                                                                                                                                                                           
 Critical Files Modified                                                                                                                                                       
                                                                                                                                                                               
 New Files (3)                                                                                                                                                                 
                                                                                                                                                                               
 1. src/utils/csvFormatDetector.ts - Format detection logic                                                                                                                    
 2. src/components/admin/CSVImportConfig.tsx - Configuration UI for LearnWorlds                                                                                                
 3. src/app/api/admin/questions/detect-difficulty/route.ts - AI difficulty detection API                                                                                       
                                                                                                                                                                               
 Modified Files (3)                                                                                                                                                            
                                                                                                                                                                               
 4. src/utils/csvParser.ts - Add parseLearnWorldsCSV() function                                                                                                                
 5. src/types/index.ts - Add format metadata to ParsedQuestion                                                                                                                 
 6. src/views/admin/BulkImportPage.tsx - Add format detection, config step, difficulty detection                                                                               
                                                                                                                                                                               
 Verification Steps                                                                                                                                                            
                                                                                                                                                                               
 End-to-End Test                                                                                                                                                               
                                                                                                                                                                               
 1. Navigate to /admin/questions/import                                                                                                                                        
 2. Upload sample LearnWorlds CSV (2026-01-27_text-comprehension.csv)                                                                                                          
 3. Verify "LearnWorlds Format" badge appears                                                                                                                                  
 4. See configuration screen with Subject/Topic dropdowns                                                                                                                      
 5. Select a Subject and click "Continue to Preview"                                                                                                                           
 6. Watch AI difficulty detection progress indicator                                                                                                                           
 7. Verify preview table shows:                                                                                                                                                
   - All 5 options (a-e) for each question                                                                                                                                     
   - AI-detected difficulty with purple "AI" badge                                                                                                                             
   - Group values displayed in table                                                                                                                                           
   - Combined explanations                                                                                                                                                     
 8. Click "Import Questions"                                                                                                                                                   
 9. Verify questions are inserted into database with:                                                                                                                          
   - Correct 5 options                                                                                                                                                         
   - AI-detected difficulties                                                                                                                                                  
   - Group and Type in tags array                                                                                                                                              
   - Combined explanations                                                                                                                                                     
                                                                                                                                                                               
 Database Verification                                                                                                                                                         
                                                                                                                                                                               
 SELECT                                                                                                                                                                        
   question_text,                                                                                                                                                              
   difficulty,                                                                                                                                                                 
   tags,                                                                                                                                                                       
   options,                                                                                                                                                                    
   explanation                                                                                                                                                                 
 FROM questions                                                                                                                                                                
 WHERE tags @> ARRAY['group:Section 1']                                                                                                                                        
 LIMIT 5;                                                                                                                                                                      
                                                                                                                                                                               
 Expected results:                                                                                                                                                             
 - options array has 5 elements (a-e)                                                                                                                                          
 - tags contains ["group:Section 1", "type:TMC"]                                                                                                                               
 - explanation contains both correct and incorrect explanations                                                                                                                
 - difficulty is 'easy', 'medium', or 'hard' (AI-detected)                                                                                                                     
                                                                                                                                                                               
 Edge Cases to Test                                                                                                                                                            
                                                                                                                                                                               
 1. Empty CSV - Should show error                                                                                                                                              
 2. Invalid format - Should show "Unrecognized format" error                                                                                                                   
 3. Missing Answer5 - Should mark question as invalid                                                                                                                          
 4. Invalid CorrectAns (0 or 6) - Should show validation error                                                                                                                 
 5. API failure during difficulty detection - Should fallback to 'medium'                                                                                                      
 6. Long question text - AI should still detect difficulty                                                                                                                     
 7. Special characters in Group/Type - Should be stored correctly in tags                                                                                                      
                                                                                                                                                                               
 Performance Considerations                                                                                                                                                    
                                                                                                                                                                               
 - Difficulty Detection: ~2-3 seconds per 10 questions with GPT-4o-mini                                                                                                        
 - Large Files: For 100+ questions, show progress bar during AI detection                                                                                                      
 - API Rate Limits: Batch processing in groups of 10 prevents rate limit issues                                                                                                
 - Fallback: If AI detection fails, defaults to 'medium' difficulty                                                                                                            
                                                                                                                                                                               
 Environment Requirements                                                                                                                                                      
                                                                                                                                                                               
 Ensure .env.local has:                                                                                                                                                        
 OPENAI_API_KEY=sk-...                                                                                                                                                         
 NEXT_PUBLIC_SUPABASE_URL=...                                                                                                                                                  
 NEXT_PUBLIC_SUPABASE_ANON_KEY=...                                                                                                                                             
                                                                                                                                                                               
 Success Criteria                                                                                                                                                              
                                                                                                                                                                               
 ✅ LearnWorlds CSV files are automatically detected                                                                                                                           
 ✅ All 5 answer options are imported correctly                                                                                                                                
 ✅ Numeric answers (1-5) map to letters (a-e)                                                                                                                                 
 ✅ Difficulties are auto-detected via AI                                                                                                                                      
 ✅ Group and Type values stored in tags                                                                                                                                       
 ✅ Both explanations are combined                                                                                                                                             
 ✅ Existing Pontea format still works                                                                                                                                         
 ✅ No breaking changes to database schema                                                                                                                                     
 ✅ Admin can import 50+ question LearnWorlds files successfully                                                                                                               
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
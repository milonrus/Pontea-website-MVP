import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/shared/Header';
import Button from '../components/shared/Button';
import { UserInfo, QuestionResult, Category, KnowledgeLevel } from '../types';
import { CheckCircle2, AlertCircle, BookOpen, Calendar, Brain, Clock, PenTool, Calculator, Layers, Info } from 'lucide-react';

interface StoredResults {
  userInfo: UserInfo;
  history: QuestionResult[];
  score: number;
  total: number;
  medianTimeMs: number;
}

// Matrix definition for the visualization
const MATRIX_COLS = ['KL0', 'KL1.1', 'KL1.2', 'KL2.1', 'KL2.2', 'KL3.1', 'KL3.2'];
const DOMAINS: { id: Category; icon: any }[] = [
  { id: 'Reading Comprehension', icon: BookOpen },
  { id: 'Logical Reasoning', icon: Brain },
  { id: 'Knowledge & History', icon: Clock },
  { id: 'Drawing & Representation', icon: PenTool },
  { id: 'Math & Physics', icon: Calculator },
];

const MATRIX_DEFINITIONS: Record<Category, { level: string; title: string; desc: string }[]> = {
  'Reading Comprehension': [
      { level: 'KL0', title: 'Passage map', desc: 'Spot topic vs detail' },
      { level: 'KL1.1', title: 'Main idea', desc: 'State main claim' },
      { level: 'KL1.2', title: 'Inference basics', desc: 'Answer implied Qs' },
      { level: 'KL2.1', title: 'Logic in text', desc: 'Track argument steps' },
      { level: 'KL2.2', title: 'Tone & intent', desc: 'Infer purpose' },
      { level: 'KL3.1', title: '20-min pacing', desc: 'Finish w/ accuracy' },
      { level: 'KL3.2', title: 'Trap-proof', desc: 'Resilient to traps' }
  ],
  'Logical Reasoning': [
      { level: 'KL0', title: 'Logic symbols', desc: 'Translate words→logic' },
      { level: 'KL1.1', title: 'Conditionals', desc: 'Apply if/only-if' },
      { level: 'KL1.2', title: 'Patterns', desc: 'Solve sequences' },
      { level: 'KL2.1', title: 'Argument tests', desc: 'Find assumptions' },
      { level: 'KL2.2', title: 'Hybrid reasoning', desc: 'Switch methods' },
      { level: 'KL3.1', title: '20-min pacing', desc: 'Control skip/attempt' },
      { level: 'KL3.2', title: 'Accuracy lock', desc: 'Avoid near-misses' }
  ],
  'Knowledge & History': [
      { level: 'KL0', title: 'Timeline anchors', desc: 'Place eras roughly' },
      { level: 'KL1.1', title: 'Institutions', desc: 'Identify key bodies' },
      { level: 'KL1.2', title: 'Art styles', desc: 'Recognize styles' },
      { level: 'KL2.1', title: 'History context', desc: 'Connect events' },
      { level: 'KL2.2', title: 'Mixed culture', desc: 'Retrieve fast' },
      { level: 'KL3.1', title: 'Rapid recall', desc: 'Answer under time' },
      { level: 'KL3.2', title: 'Precision', desc: 'Avoid look-alikes' }
  ],
  'Drawing & Representation': [
      { level: 'KL0', title: 'View vocabulary', desc: 'Name plan/elevation' },
      { level: 'KL1.1', title: 'Orthographic', desc: 'Interpret views' },
      { level: 'KL1.2', title: 'Axonometric', desc: 'Infer 3D from 2D' },
      { level: 'KL2.1', title: 'Perspective', desc: 'Vanishing points' },
      { level: 'KL2.2', title: 'Scale & measure', desc: 'Compute from drawing' },
      { level: 'KL3.1', title: '20-min sprint', desc: 'Solve visual sets' },
      { level: 'KL3.2', title: 'Trap control', desc: 'Catch rotation traps' }
  ],
  'Math & Physics': [
      { level: 'KL0', title: 'Number sense', desc: 'Manage units/signs' },
      { level: 'KL1.1', title: 'Algebra fluency', desc: 'Simplify & solve' },
      { level: 'KL1.2', title: 'Geometry', desc: 'Area/angle rules' },
      { level: 'KL2.1', title: 'Functions', desc: 'Read/transform graphs' },
      { level: 'KL2.2', title: 'Physics models', desc: 'F=ma, Ohm, etc.' },
      { level: 'KL3.1', title: '20-min pacing', desc: 'Pick battles' },
      { level: 'KL3.2', title: 'Resilience', desc: 'Keep points' }
  ]
};

const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<StoredResults | null>(null);
  const [hoveredInfo, setHoveredInfo] = useState<{ title: string; desc: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const data = localStorage.getItem('pontea_results');
    if (!data) {
      navigate('/assessment');
      return;
    }
    setResults(JSON.parse(data));
  }, [navigate]);

  if (!results) return null;

  // --- ANALYSIS LOGIC ---

  // 1. Calculate Knowledge Level (KL) per domain
  const calculateDomainLevel = (category: Category): { level: KnowledgeLevel, correct: number } => {
    const items = results.history.filter(h => h.category === category);
    const correctCount = items.filter(h => h.correct).length;
    
    // Mapping from screener score (0-2) to Matrix Level
    // 0/2 -> KL0
    // 1/2 -> KL1.1
    // 2/2 -> KL1.2 (Conservative start)
    let level: KnowledgeLevel = 'KL0';
    if (correctCount === 1) level = 'KL1.1';
    if (correctCount === 2) level = 'KL1.2';
    
    return { level, correct: correctCount };
  };

  const domainAnalysis = DOMAINS.map(d => ({
    ...d,
    ...calculateDomainLevel(d.id)
  }));

  // 2. Calculate Exam Skill Level (ESL) - Pacing
  // ESL Rules from text:
  // ESL0: >45s/item
  // ESL1.1: 35-45s/item
  // ESL1.2: 25-35s/item
  // ESL2.1: <25s/item
  const avgSeconds = results.medianTimeMs / 1000;
  let eslLevel = 'ESL0';
  let eslDesc = 'Format Awareness Needed';
  let eslColor = 'text-red-500';

  if (avgSeconds <= 25) {
     eslLevel = 'ESL2.1';
     eslDesc = 'Competitive Pacing';
     eslColor = 'text-green-600';
  } else if (avgSeconds <= 35) {
     eslLevel = 'ESL1.2';
     eslDesc = 'Stable Pacing';
     eslColor = 'text-yellow-600';
  } else if (avgSeconds <= 45) {
     eslLevel = 'ESL1.1';
     eslDesc = 'Developing Rhythm';
     eslColor = 'text-blue-600';
  }

  // 3. Identify Weakest Link for Roadmap
  // Sort by correctness (asc), then prioritize LR/RC for tie-breaking
  const sortedWeakest = [...domainAnalysis].sort((a, b) => {
    if (a.correct !== b.correct) return a.correct - b.correct;
    // Tie-breaker logic: LR/RC are more critical/foundational
    if (a.id === 'Logical Reasoning' || a.id === 'Reading Comprehension') return -1;
    if (b.id === 'Logical Reasoning' || b.id === 'Reading Comprehension') return 1;
    return 0;
  });

  const weakestDomain = sortedWeakest[0];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="pt-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Intro */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-primary mb-4">
            Analysis Complete, {results.userInfo.name.split(' ')[0]}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We've mapped your performance onto the <strong>Knowledge Matrix</strong>. 
            This dictates exactly where you should start.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* LEFT COL: Matrix Visualization */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* The Matrix Card */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 relative">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                        <Layers className="w-5 h-5 text-accent" />
                        Your Knowledge Matrix Position
                    </h3>
                    <div className="text-xs font-semibold bg-gray-100 px-3 py-1 rounded-full text-gray-500">
                        Target: KL3.1
                    </div>
                </div>

                <div className="overflow-x-auto pb-4">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left py-2 min-w-[140px]">Domain</th>
                                {MATRIX_COLS.map(col => (
                                    <th key={col} className="text-center py-2 text-gray-400 font-medium px-2">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {domainAnalysis.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-4 font-semibold text-primary flex items-center gap-2">
                                        <item.icon className={`w-4 h-4 ${item.correct < 2 ? 'text-red-400' : 'text-green-500'}`} />
                                        {item.id.replace('Reading Comprehension', 'Reading Comp')}
                                    </td>
                                    {MATRIX_COLS.map((col, idx) => {
                                        // Determine if this cell is active based on calculated level
                                        // Simple logic: KL0 is idx 0. KL1.1 is idx 1...
                                        // Map level string to index
                                        const levelMap: Record<string, number> = {'KL0': 0, 'KL1.1': 1, 'KL1.2': 2, 'KL2.1': 3, 'KL2.2': 4, 'KL3.1': 5, 'KL3.2': 6};
                                        const myLevelIdx = levelMap[item.level];
                                        const isCurrent = idx === myLevelIdx;
                                        const isPast = idx < myLevelIdx;
                                        
                                        // Get details for tooltip
                                        const cellDetails = MATRIX_DEFINITIONS[item.id]?.find(c => c.level === col);

                                        return (
                                            <td 
                                              key={col} 
                                              className="text-center p-1 relative cursor-help"
                                              onMouseEnter={(e) => {
                                                if (cellDetails) {
                                                  const rect = e.currentTarget.getBoundingClientRect();
                                                  setHoveredInfo({
                                                    title: cellDetails.title,
                                                    desc: cellDetails.desc,
                                                    x: rect.left + rect.width / 2,
                                                    y: rect.top
                                                  });
                                                }
                                              }}
                                              onMouseLeave={() => setHoveredInfo(null)}
                                            >
                                                <div className={`
                                                    w-full h-8 rounded flex items-center justify-center transition-all
                                                    ${isCurrent ? 'bg-accent text-primary font-bold shadow-md scale-110' : 
                                                      isPast ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-300 hover:bg-gray-100'}
                                                `}>
                                                    {isCurrent && "YOU"}
                                                    {isPast && "✓"}
                                                    {!isCurrent && !isPast && (
                                                      <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                    <Info className="w-4 h-4" />
                    <span>Hover over any cell to see specific competency requirements.</span>
                </div>
            </div>

            {/* ESL / Skills Card */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                 <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-accent" />
                    Exam Skill Analysis (ESL)
                </h3>
                
                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                        <div className="text-gray-500 text-sm mb-2 font-semibold uppercase">Pacing Score</div>
                        <div className={`text-3xl font-bold mb-1 ${eslColor}`}>{eslLevel}</div>
                        <div className="text-primary font-medium">{eslDesc}</div>
                        <p className="text-xs text-gray-500 mt-2">
                            Avg response: {Math.round(results.medianTimeMs/1000)}s per item
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                        <div className="text-gray-500 text-sm mb-2 font-semibold uppercase">Section Gating</div>
                        <div className="text-3xl font-bold mb-1 text-primary">Critical</div>
                        <div className="text-primary font-medium">Methodology Focus</div>
                        <p className="text-xs text-gray-500 mt-2">
                           Since ARCHED prevents going back, we must train your "Skip Trigger" reflex.
                        </p>
                    </div>
                </div>
            </div>

          </div>

          {/* RIGHT COL: Roadmap & CTA */}
          <div className="space-y-6">
            
            <div className="bg-primary text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
                    <Calendar className="w-5 h-5 text-accent" />
                    Your Adaptive Roadmap
                </h3>

                <div className="space-y-6 relative z-10">
                     {/* Phase 1 */}
                     <div className="relative pl-8 border-l border-white/20">
                        <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-accent"></div>
                        {/* CHANGED: text-accent -> text-white to reduce contrast vibration */}
                        <h4 className="font-bold text-white text-sm uppercase tracking-wide mb-1">Month 1: The Weakest Link</h4>
                        <p className="text-sm text-gray-300">
                            Your matrix shows a gap in <strong>{weakestDomain.id}</strong>. 
                            We prioritize this first because {weakestDomain.id === 'Logical Reasoning' || weakestDomain.id === 'Reading Comprehension' ? 'it is a tie-breaker domain.' : 'it caps your total score ceiling.'}
                        </p>
                     </div>

                     {/* Phase 2 */}
                     <div className="relative pl-8 border-l border-white/20">
                        <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-blue-400"></div>
                        <h4 className="font-bold text-white text-sm uppercase tracking-wide mb-1">Month 2: Core Competence</h4>
                        <p className="text-sm text-gray-300">
                            Push all domains to <strong>KL2.2</strong>. Begin timed mini-sets to improve your ESL from {eslLevel} to ESL2.1.
                        </p>
                     </div>

                     {/* Phase 3 */}
                     <div className="relative pl-8 border-l border-white/20">
                        <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-blue-300"></div>
                        <h4 className="font-bold text-white text-sm uppercase tracking-wide mb-1">Month 3: Rank Optimization</h4>
                        <p className="text-sm text-gray-300">
                            Full-length simulations with <strong>Section Gating</strong> enforced. Trap-proofing your Logic and History knowledge.
                        </p>
                     </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-white/10">
                    <p className="text-sm text-gray-300 mb-4">
                        Based on your KL profile, we recommend the <strong>Full Course</strong> to ensure you reach KL3.1.
                    </p>
                    <Button fullWidth className="shadow-lg shadow-accent/20">
                        Unlock Full Roadmap
                    </Button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                <h4 className="font-bold text-primary mb-2">Want a professional opinion?</h4>
                <p className="text-sm text-gray-500 mb-4">Book a free 15-min strategy call with our PoliMi alumni.</p>
                <Link to="/consultation">
                  <Button variant="outline" fullWidth size="sm">
                    Book Consultation
                  </Button>
                </Link>
            </div>

          </div>

        </div>
      </main>

      {/* Floating Tooltip */}
      {hoveredInfo && (
        <div 
          className="fixed z-50 bg-primary text-white p-4 rounded-xl shadow-2xl pointer-events-none w-56 text-sm transform -translate-x-1/2 -translate-y-full border border-gray-700/50"
          style={{ left: hoveredInfo.x, top: hoveredInfo.y - 12 }}
        >
          <div className="font-bold text-accent mb-1 text-base">{hoveredInfo.title}</div>
          <div className="text-gray-300 leading-snug">{hoveredInfo.desc}</div>
          {/* Arrow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-8 border-transparent border-t-primary"></div>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
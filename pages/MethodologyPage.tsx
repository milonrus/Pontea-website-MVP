import React from 'react';
import Header from '../components/shared/Header';
import Button from '../components/shared/Button';
import { CheckCircle2, AlertTriangle, Clock, Brain, Calculator, PenTool, BookOpen, Layers, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const MATRIX_ROWS = [
  {
    domain: 'Reading Comp',
    icon: BookOpen,
    cells: [
      { level: 'KL0', title: 'Passage map', desc: 'Spot topic vs detail' },
      { level: 'KL1.1', title: 'Main idea', desc: 'State main claim' },
      { level: 'KL1.2', title: 'Inference basics', desc: 'Answer implied Qs' },
      { level: 'KL2.1', title: 'Logic in text', desc: 'Track argument steps' },
      { level: 'KL2.2', title: 'Tone & intent', desc: 'Infer purpose' },
      { level: 'KL3.1', title: '20-min pacing', desc: 'Finish w/ accuracy' },
      { level: 'KL3.2', title: 'Trap-proof', desc: 'Resilient to traps' }
    ]
  },
  {
    domain: 'Logical Reasoning',
    icon: Brain,
    cells: [
      { level: 'KL0', title: 'Logic symbols', desc: 'Translate words→logic' },
      { level: 'KL1.1', title: 'Conditionals', desc: 'Apply if/only-if' },
      { level: 'KL1.2', title: 'Patterns', desc: 'Solve sequences' },
      { level: 'KL2.1', title: 'Argument tests', desc: 'Find assumptions' },
      { level: 'KL2.2', title: 'Hybrid reasoning', desc: 'Switch methods' },
      { level: 'KL3.1', title: '20-min pacing', desc: 'Control skip/attempt' },
      { level: 'KL3.2', title: 'Accuracy lock', desc: 'Avoid near-misses' }
    ]
  },
  {
    domain: 'Knowledge & History',
    icon: Clock,
    cells: [
      { level: 'KL0', title: 'Timeline anchors', desc: 'Place eras roughly' },
      { level: 'KL1.1', title: 'Institutions', desc: 'Identify key bodies' },
      { level: 'KL1.2', title: 'Art styles', desc: 'Recognize styles' },
      { level: 'KL2.1', title: 'History context', desc: 'Connect events' },
      { level: 'KL2.2', title: 'Mixed culture', desc: 'Retrieve fast' },
      { level: 'KL3.1', title: 'Rapid recall', desc: 'Answer under time' },
      { level: 'KL3.2', title: 'Precision', desc: 'Avoid look-alikes' }
    ]
  },
  {
    domain: 'Drawing & Rep',
    icon: PenTool,
    cells: [
      { level: 'KL0', title: 'View vocabulary', desc: 'Name plan/elevation' },
      { level: 'KL1.1', title: 'Orthographic', desc: 'Interpret views' },
      { level: 'KL1.2', title: 'Axonometric', desc: 'Infer 3D from 2D' },
      { level: 'KL2.1', title: 'Perspective', desc: 'Vanishing points' },
      { level: 'KL2.2', title: 'Scale & measure', desc: 'Compute from drawing' },
      { level: 'KL3.1', title: '20-min sprint', desc: 'Solve visual sets' },
      { level: 'KL3.2', title: 'Trap control', desc: 'Catch rotation traps' }
    ]
  },
  {
    domain: 'Math & Physics',
    icon: Calculator,
    cells: [
      { level: 'KL0', title: 'Number sense', desc: 'Manage units/signs' },
      { level: 'KL1.1', title: 'Algebra fluency', desc: 'Simplify & solve' },
      { level: 'KL1.2', title: 'Geometry', desc: 'Area/angle rules' },
      { level: 'KL2.1', title: 'Functions', desc: 'Read/transform graphs' },
      { level: 'KL2.2', title: 'Physics models', desc: 'F=ma, Ohm, etc.' },
      { level: 'KL3.1', title: '20-min pacing', desc: 'Pick battles' },
      { level: 'KL3.2', title: 'Resilience', desc: 'Keep points' }
    ]
  }
];

const MethodologyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-primary text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-accent/10 -skew-x-12 transform origin-top translate-x-1/2 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-accent text-sm font-semibold mb-6 border border-accent/20">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              ARCHED & TIL-A Preparation
            </div>
            <h1 className="text-4xl lg:text-6xl font-display font-bold mb-6">
              The Science of <span className="text-accent">Admission</span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed mb-8">
              Preparation isn't just about reading books. It's about mastering the exam's unique constraints: section gating, negative marking, and the rigorous Knowledge Matrix.
            </p>
            <Link to="/assessment">
              <Button size="lg" variant="primary">Identify Your Level</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Exam Structure Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-bold text-primary mb-4">The ARCHED Exam Structure</h2>
            <p className="text-gray-600">
              For the 2025/2026 cycle, Politecnico di Milano uses a rigorous 50-question format. 
              Crucially, this is a <strong>ranking exam</strong> with strict penalties and timing rules.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="px-6 py-4 font-display font-bold text-lg">Section</th>
                    <th className="px-6 py-4 font-display font-bold text-lg">Items</th>
                    <th className="px-6 py-4 font-display font-bold text-lg">Time</th>
                    <th className="px-6 py-4 font-display font-bold text-lg">Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-primary">Reading Comprehension</td>
                    <td className="px-6 py-4 text-gray-600">10</td>
                    <td className="px-6 py-4 text-gray-600">20 min</td>
                    <td className="px-6 py-4 text-gray-600">20%</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-primary">Logical Reasoning</td>
                    <td className="px-6 py-4 text-gray-600">10</td>
                    <td className="px-6 py-4 text-gray-600">20 min</td>
                    <td className="px-6 py-4 text-gray-600">20%</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-primary">Knowledge & History</td>
                    <td className="px-6 py-4 text-gray-600">10</td>
                    <td className="px-6 py-4 text-gray-600">20 min</td>
                    <td className="px-6 py-4 text-gray-600">20%</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-primary">Drawing & Representation</td>
                    <td className="px-6 py-4 text-gray-600">10</td>
                    <td className="px-6 py-4 text-gray-600">20 min</td>
                    <td className="px-6 py-4 text-gray-600">20%</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-primary">Physics & Mathematics</td>
                    <td className="px-6 py-4 text-gray-600">10</td>
                    <td className="px-6 py-4 text-gray-600">20 min</td>
                    <td className="px-6 py-4 text-gray-600">20%</td>
                  </tr>
                  <tr className="bg-accent/10 font-semibold text-primary">
                    <td className="px-6 py-4">TOTAL</td>
                    <td className="px-6 py-4">50 Questions</td>
                    <td className="px-6 py-4">100 Minutes</td>
                    <td className="px-6 py-4">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-green-600">+1.0</span> Correct
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-500">0.0</span> Blank
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-red-500">-0.25</span> Incorrect
                </div>
                <div className="flex items-center gap-2 ml-auto text-primary font-bold">
                    <AlertTriangle className="w-4 h-4 text-accent" />
                    Section Gating Enforced
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Knowledge Levels Explanation */}
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-bold text-primary mb-4">Decoding Knowledge Levels (KL)</h2>
            <p className="text-gray-600">
              We track progress not just by score, but by cognitive depth. 
              To pass ARCHED, you need to reach <strong>KL3.1</strong> in at least 3 domains.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="group p-6 rounded-2xl border border-gray-100 bg-gray-50 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold text-gray-300 group-hover:text-gray-400 transition-colors">KL0</span>
                <span className="px-2 py-1 rounded text-xs font-bold bg-gray-200 text-gray-600">Beginner</span>
              </div>
              <h3 className="font-bold text-primary text-lg mb-2">Pre-Foundation</h3>
              <p className="text-sm text-gray-600 mb-4 min-h-[60px]">
                Concepts are unfamiliar. You rely on intuition or guessing. High risk of negative marking.
              </p>
              <div className="text-xs font-bold text-red-500 uppercase tracking-wide flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Needs Immersion
              </div>
            </div>

            <div className="group p-6 rounded-2xl border border-blue-100 bg-blue-50/30 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold text-blue-200 group-hover:text-blue-300 transition-colors">KL1</span>
                <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">Foundation</span>
              </div>
              <h3 className="font-bold text-primary text-lg mb-2">Conceptual</h3>
              <p className="text-sm text-gray-600 mb-4 min-h-[60px]">
                You understand the rules but work slowly. You often fall for "distractor" answers.
              </p>
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wide flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                Untimed Drills
              </div>
            </div>

            <div className="group p-6 rounded-2xl border border-accent/20 bg-amber-50/50 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold text-accent/40 group-hover:text-accent transition-colors">KL2</span>
                <span className="px-2 py-1 rounded text-xs font-bold bg-accent/20 text-yellow-800">Competence</span>
              </div>
              <h3 className="font-bold text-primary text-lg mb-2">Operational</h3>
              <p className="text-sm text-gray-600 mb-4 min-h-[60px]">
                Reliable accuracy on standard questions. You can explain the "why", but speed is average.
              </p>
              <div className="text-xs font-bold text-yellow-700 uppercase tracking-wide flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
                Timed Sets
              </div>
            </div>

            <div className="group p-6 rounded-2xl border border-primary/10 bg-primary text-white hover:shadow-xl hover:scale-105 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold text-white/20 group-hover:text-accent transition-colors">KL3</span>
                <span className="px-2 py-1 rounded text-xs font-bold bg-white/20 text-white">Mastery</span>
              </div>
              <h3 className="font-bold text-white text-lg mb-2">Fluency</h3>
              <p className="text-sm text-gray-300 mb-4 min-h-[60px]">
                Automatic recognition. Resistant to traps. You can solve harder questions in under 45s.
              </p>
              <div className="text-xs font-bold text-accent uppercase tracking-wide flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent"></div>
                Exam Ready
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Full Knowledge Matrix Section */}
      <section className="py-20 bg-white">
        <div className="max-w-[95%] mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
                <h2 className="text-3xl font-display font-bold text-primary mb-4">The Complete Knowledge Matrix</h2>
                <p className="text-gray-600">
                    Your roadmap from beginner to admission-ready. We measure "Knowledge Mastery" separately from "Exam Skills".
                </p>
            </div>

            <div className="overflow-x-auto pb-6">
                <div className="min-w-[1200px] border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {/* Header Row */}
                    <div className="grid grid-cols-8 bg-primary text-white text-sm font-bold divide-x divide-primary-light">
                        <div className="p-4 flex items-center justify-center bg-secondary sticky left-0 z-10 shadow-lg">Domain</div>
                        <div className="p-3 text-center bg-gray-700">KL0<div className="text-[10px] opacity-70 font-normal">Pre-foundation</div></div>
                        <div className="p-3 text-center bg-gray-600">KL1.1<div className="text-[10px] opacity-70 font-normal">Foundation Concepts</div></div>
                        <div className="p-3 text-center bg-gray-600">KL1.2<div className="text-[10px] opacity-70 font-normal">Foundation Fluency</div></div>
                        <div className="p-3 text-center bg-accent text-primary">KL2.1<div className="text-[10px] opacity-70 font-normal text-primary/80">Core Competence</div></div>
                        <div className="p-3 text-center bg-accent text-primary">KL2.2<div className="text-[10px] opacity-70 font-normal text-primary/80">Transfer</div></div>
                        <div className="p-3 text-center bg-blue-600">KL3.1<div className="text-[10px] opacity-70 font-normal">Section Ready</div></div>
                        <div className="p-3 text-center bg-blue-700">KL3.2<div className="text-[10px] opacity-70 font-normal">Competitive</div></div>
                    </div>

                    {/* Matrix Rows */}
                    <div className="bg-white divide-y divide-gray-200">
                        {MATRIX_ROWS.map((row, i) => (
                            <div key={row.domain} className="grid grid-cols-8 divide-x divide-gray-100 hover:bg-gray-50 transition-colors">
                                <div className="p-4 font-bold text-primary text-sm flex items-center gap-2 bg-gray-50 sticky left-0 z-10 border-r border-gray-200">
                                    <row.icon className="w-4 h-4 text-accent" />
                                    {row.domain}
                                </div>
                                {row.cells.map((cell) => (
                                    <div key={cell.level} className="p-3 flex flex-col justify-center h-full">
                                        <div className="text-xs font-bold text-primary mb-1">{cell.title}</div>
                                        <div className="text-[10px] text-gray-500 leading-tight">{cell.desc}</div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Matrix Legend/Info */}
            <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-gray-600 rounded-sm"></span>
                    <span className="text-gray-600">Foundation (Untimed)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-accent rounded-sm"></span>
                    <span className="text-gray-800 font-medium">Core Mastery (Mixed)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-600 rounded-sm"></span>
                    <span className="text-gray-600">Exam Ready (Timed)</span>
                </div>
            </div>
        </div>
      </section>

      {/* Exam Skill Levels (ESL) */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                    <h3 className="text-3xl font-display font-bold text-primary mb-6 flex items-center gap-3">
                        <Brain className="w-8 h-8 text-accent" />
                        The Other Axis: Exam Skills (ESL)
                    </h3>
                    <p className="text-lg text-gray-600 mb-6">
                        Knowing the answer is only half the battle. Our course specifically trains "Test Execution" as a separate skill set to ensure you don't panic on exam day.
                    </p>
                    
                    <div className="space-y-4">
                        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                            <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-accent" /> Pacing Strategy
                            </h4>
                            <p className="text-sm text-gray-600">
                                <strong>The 2-Minute Rule:</strong> Training your internal clock to abandon "time-sink" questions immediately.
                            </p>
                        </div>
                        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                            <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-accent" /> Penalty Discipline
                            </h4>
                            <p className="text-sm text-gray-600">
                                <strong>Calculated Risk:</strong> Learning when to skip (0 pts) vs. when to guess (-0.25 pts) based on probability thresholds.
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-primary p-8 rounded-2xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-2xl -mr-16 -mt-16"></div>
                    <h4 className="text-xl font-bold mb-6 font-display">Typical Student Progression</h4>
                    
                    <div className="space-y-6 relative border-l border-white/20 ml-3 pl-8">
                        <div className="relative">
                            <span className="absolute -left-[39px] top-1 w-5 h-5 bg-gray-700 rounded-full border-2 border-primary flex items-center justify-center text-[10px]">1</span>
                            <h5 className="font-bold text-accent">Foundation Sprint (Weeks 1-4)</h5>
                            <p className="text-sm text-gray-300 mt-1">Bring every domain to KL1.2. Learn the test format.</p>
                        </div>
                        <div className="relative">
                            <span className="absolute -left-[39px] top-1 w-5 h-5 bg-gray-700 rounded-full border-2 border-primary flex items-center justify-center text-[10px]">2</span>
                            <h5 className="font-bold text-accent">Core Build (Weeks 5-10)</h5>
                            <p className="text-sm text-gray-300 mt-1">Push weakest domains to KL2.2. Begin timed mini-sets.</p>
                        </div>
                        <div className="relative">
                            <span className="absolute -left-[39px] top-1 w-5 h-5 bg-gray-700 rounded-full border-2 border-primary flex items-center justify-center text-[10px]">3</span>
                            <h5 className="font-bold text-accent">Section Mastery (Weeks 11-16)</h5>
                            <p className="text-sm text-gray-300 mt-1">Reach KL3.1. Master section-gating discipline.</p>
                        </div>
                        <div className="relative">
                            <span className="absolute -left-[39px] top-1 w-5 h-5 bg-accent text-primary rounded-full border-2 border-primary flex items-center justify-center text-[10px] font-bold">4</span>
                            <h5 className="font-bold text-white">Rank Optimization (Weeks 17+)</h5>
                            <p className="text-sm text-gray-300 mt-1">Stabilize scores. Focus on tie-breaker domains (Logic & Reading).</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-accent text-center px-4">
         <h2 className="text-3xl md:text-5xl font-display font-bold text-primary mb-6">Don't guess your level. Measure it.</h2>
         <p className="text-primary/80 mb-8 max-w-xl mx-auto">
            Take our free adaptive assessment to see exactly where you stand on the Knowledge Matrix.
         </p>
         <Link to="/assessment">
            <Button size="lg" className="bg-primary text-white hover:bg-gray-900 shadow-xl">
                Start Free Assessment
            </Button>
         </Link>
      </section>

      <footer className="bg-primary text-white py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-2xl font-display font-bold">PONTEA</div>
            <div className="text-gray-400 text-sm">© 2024 Pontea School. All rights reserved.</div>
            <div className="flex gap-4">
                <a href="#" className="hover:text-accent transition-colors">Instagram</a>
                <a href="#" className="hover:text-accent transition-colors">Email</a>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default MethodologyPage;
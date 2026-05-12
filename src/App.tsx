/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Circle,
  BarChart3, 
  Layers, 
  Layout, 
  Code2, 
  ShieldCheck, 
  FileText,
  Search,
  Filter,
  ArrowRight
} from 'lucide-react';

// --- Types ---

type Phase = 'BRD' | 'UX' | 'API' | 'Dev' | 'QC';
type Status = 'not-started' | 'in-progress' | 'completed';

interface Task {
  id: string;
  title: string;
  phases: Record<Phase, Status>;
  createdAt: number;
}

const PHASES: Phase[] = ['BRD', 'UX', 'API', 'Dev', 'QC'];

const INITIAL_TASKS_TITLES = [
  'صوتك مسموع',
  'الموردين',
  'المكتبة الرقمية',
  'إدامة',
  'طلبات الدعم',
  'إنصاف',
  'تقييم الكفاءات',
  'التحقق من الشهادات',
  'معادلة الشهادات',
  'سنابل',
  'تكافل',
  'المسح الميداني',
  'عبور',
  'الإيفاد الخارجي',
  'الإسكان',
  'الحج'
];

// --- Helpers ---

const getNextStatus = (current: Status): Status => {
  if (current === 'not-started') return 'in-progress';
  if (current === 'in-progress') return 'completed';
  return 'not-started';
};

const getStatusColor = (status: Status) => {
  switch (status) {
    case 'not-started': return 'bg-slate-100 text-slate-400 border-slate-200';
    case 'in-progress': return 'bg-amber-50 text-amber-600 border-amber-200';
    case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
  }
};

const getStatusIcon = (status: Status, size = 16) => {
  switch (status) {
    case 'not-started': return <Circle size={size} />;
    case 'in-progress': return <Clock size={size} />;
    case 'completed': return <CheckCircle2 size={size} />;
  }
};

// --- Components ---

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [appTitle, setAppTitle] = useState('مصفوفة مراحل العمليات');
  const [appDescription, setAppDescription] = useState('Enterprise Status Tracker - تتبع حالة المشاريع بدقة');

  // Load from local storage
  useEffect(() => {
    const savedTasks = localStorage.getItem('phase_tracker_v4');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      const initial = INITIAL_TASKS_TITLES.map((title, idx) => ({
        id: crypto.randomUUID(),
        title,
        phases: { 
          BRD: 'not-started',
          UX: 'not-started',
          API: 'not-started', 
          Dev: 'not-started', 
          QC: 'not-started' 
        },
        createdAt: Date.now() - idx * 1000,
      }));
      setTasks(initial);
      localStorage.setItem('phase_tracker_v4', JSON.stringify(initial));
    }

    const savedTitle = localStorage.getItem('phase_tracker_title');
    const savedDesc = localStorage.getItem('phase_tracker_desc');
    if (savedTitle) setAppTitle(savedTitle);
    if (savedDesc) setAppDescription(savedDesc);

    setIsInitialized(true);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('phase_tracker_v4', JSON.stringify(tasks));
      localStorage.setItem('phase_tracker_title', appTitle);
      localStorage.setItem('phase_tracker_desc', appDescription);
    }
  }, [tasks, appTitle, appDescription, isInitialized]);

  const addTask = (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle,
      phases: { 
        BRD: 'not-started', UX: 'not-started', API: 'not-started', Dev: 'not-started', QC: 'not-started' 
      },
      createdAt: Date.now(),
    };
    
    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
  };

  const cycleStatus = (taskId: string, phase: Phase) => {
    setTasks(tasks.map(t => 
      t.id === taskId 
        ? { ...t, phases: { ...t.phases, [phase]: getNextStatus(t.phases[phase]) } }
        : t
    ));
  };

  const deleteTask = (id: string) => {
    if (confirm('Delete this task?')) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateCompletion = (task: Task) => {
    const values = { 'not-started': 0, 'in-progress': 0.5, 'completed': 1 };
    const total = PHASES.reduce((acc, p) => acc + values[task.phases[p]], 0);
    return Math.round((total / PHASES.length) * 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Panel */}
      <nav className="bg-white border-b border-slate-200 px-8 py-2 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 shrink-0">
              <Layers size={20} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col min-w-[200px]">
              <input 
                value={appTitle}
                onChange={(e) => setAppTitle(e.target.value)}
                className="text-xl font-black tracking-tight text-slate-900 leading-none bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-100 rounded px-1 -mx-1 outline-none transition-all"
                placeholder="أدخل عنوان الصفحة..."
              />
              <input 
                value={appDescription}
                onChange={(e) => setAppDescription(e.target.value)}
                className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-100 rounded px-1 -mx-1 outline-none transition-all"
                placeholder="أدخل الوصف..."
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="البحث في المهام..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
            
            <form onSubmit={addTask} className="flex gap-2">
              <input 
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="مهمة جديدة..."
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Plus size={18} strokeWidth={3} /> إضافة
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main Table Container */}
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-[1800px] mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="matrix-header text-right pr-8 w-[350px] min-w-[350px] sticky right-0 z-30 ring-1 ring-slate-200 bg-slate-50">المهمة / المتطلب</th>
                  <th className="matrix-header text-center w-[120px]">الإنجاز</th>
                  {PHASES.map(phase => (
                    <th key={phase} className="matrix-header text-center w-[150px]">
                      <div className="flex flex-col items-center gap-1">
                        <PhaseIcon phase={phase} className="w-4 h-4 text-indigo-500" />
                        <span>{phase}</span>
                      </div>
                    </th>
                  ))}
                  <th className="matrix-header w-[80px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence mode="popLayout" initial={false}>
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => {
                      const completion = calculateCompletion(task);
                      return (
                        <motion.tr 
                          key={task.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="group hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="matrix-cell pr-8 sticky right-0 z-10 bg-white group-hover:bg-slate-50 transition-colors border-l border-slate-200 shadow-[-4px_0_10px_rgba(0,0,0,0.02)]">
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 group-hover:scale-150 transition-transform" />
                              <span className="font-bold text-slate-700 truncate" dir="auto">{task.title}</span>
                            </div>
                          </td>
                          <td className="matrix-cell text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${completion}%` }} />
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">{completion}%</span>
                            </div>
                          </td>
                          {PHASES.map(phase => (
                            <td key={phase} className="matrix-cell p-0">
                              <button 
                                onClick={() => cycleStatus(task.id, phase)}
                                className={`w-full h-full min-h-[40px] flex items-center justify-center gap-2 transition-all hover:bg-white active:scale-[0.98]
                                  ${task.phases[phase] === 'completed' ? 'bg-emerald-50/50 text-emerald-700' : 
                                    task.phases[phase] === 'in-progress' ? 'bg-amber-50/50 text-amber-700' : 
                                    'text-slate-300 hover:text-slate-400'}
                                `}
                              >
                                {getStatusIcon(task.phases[phase], 18)}
                                <span className="text-[10px] font-black uppercase hidden 2xl:block opacity-60">
                                  {task.phases[phase].replace('-', ' ')}
                                </span>
                              </button>
                            </td>
                          ))}
                          <td className="matrix-cell text-center">
                            <button 
                              onClick={() => deleteTask(task.id)}
                              className="w-8 h-8 rounded-lg text-slate-200 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 mx-auto"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={PHASES.length + 3} className="py-24 text-center">
                        <div className="flex flex-col items-center opacity-30">
                          <Search size={48} className="mb-4" />
                          <p className="font-bold uppercase tracking-widest text-sm">No operational data found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer System Bar */}
      <footer className="bg-slate-900 text-white/50 px-8 py-3 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] border-t border-white/5">
        <div className="flex gap-8">
          <span className="flex items-center gap-2 text-indigo-400"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" /> النظام نشط</span>
          <span>السجلات: {tasks.length}</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              const data = {
                tasks,
                appTitle,
                appDescription,
                version: '3.0'
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `matrix-data-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="hover:text-indigo-400 transition-colors"
          >
            تصدير البيانات (JSON)
          </button>
          <button 
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'application/json';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (re) => {
                  try {
                    const data = JSON.parse(re.target?.result as string);
                    if (data.tasks) {
                      setTasks(data.tasks);
                      if (data.appTitle) setAppTitle(data.appTitle);
                      if (data.appDescription) setAppDescription(data.appDescription);
                      alert('تم استيراد البيانات بنجاح');
                    }
                  } catch (err) {
                    alert('خطأ في ملف البيانات');
                  }
                };
                reader.readAsText(file);
              };
              input.click();
            }}
            className="hover:text-indigo-400 transition-colors"
          >
            استيراد البيانات
          </button>
          <button 
            onClick={() => {
              if(confirm('هل أنت متأكد من مسح جميع البيانات؟')) {
                localStorage.removeItem('phase_tracker_v4');
                window.location.reload();
              }
            }}
            className="hover:text-red-400 transition-colors"
          >
            إعادة ضبط المصفوفة
          </button>
          <span>Operational Registry v3.0</span>
        </div>
      </footer>
    </div>
  );
}

function PhaseIcon({ phase, className }: { phase: Phase, className?: string }) {
  switch (phase) {
    case 'BRD': return <FileText size={16} className={className} />;
    case 'UX': return <Layout size={16} className={className} />;
    case 'API': return <Code2 size={16} className={className} />;
    case 'Dev': return <Layers size={16} className={className} />;
    case 'QC': return <ShieldCheck size={16} className={className} />;
  }
}

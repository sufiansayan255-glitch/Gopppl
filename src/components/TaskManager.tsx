import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Trash2,
  Plus,
  ListTodo,
  Check,
  X,
  Sparkles,
  Calendar,
  Layers,
  Filter
} from 'lucide-react';
import { AppLanguage } from '../types';

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  priority?: 'high' | 'normal' | 'low';
}

interface TaskManagerProps {
  language: AppLanguage;
  theme?: 'light' | 'dark';
}

const STORAGE_KEY = 'sparkflow_daily_tasks';

export const TaskManager: React.FC<TaskManagerProps> = ({ language, theme = 'dark' }) => {
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load tasks from localStorage', e);
    }
    return [
      { id: '1', text: 'Review customer feedback and comment logs', completed: false, createdAt: Date.now() - 3600000, priority: 'high' },
      { id: '2', text: 'Convert marketing banners to modern WebP format', completed: true, createdAt: Date.now() - 7200000, priority: 'normal' },
      { id: '3', text: 'Generate new secure master passwords for credentials', completed: false, createdAt: Date.now() - 10800000, priority: 'normal' }
    ];
  });

  const [inputVal, setInputVal] = useState<string>('');
  const [priority, setPriority] = useState<'high' | 'normal' | 'low'>('normal');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const isUrdu = language === 'ur';
  const isDark = theme === 'dark';

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to persist tasks to localStorage', e);
    }
  }, [tasks]);

  const addTask = () => {
    if (!inputVal.trim()) return;
    const newTask: TaskItem = {
      id: Date.now().toString(),
      text: inputVal.trim(),
      completed: false,
      createdAt: Date.now(),
      priority
    };
    setTasks((prev) => [newTask, ...prev]);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const clearCompleted = () => {
    setTasks((prev) => prev.filter((t) => !t.completed));
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.length - completedCount;

  return (
    <div id="tasks-manager-container" className="space-y-5 animate-in fade-in duration-200">
      {/* Header & Stats Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <label
          htmlFor="taskInput"
          className={`text-sm font-semibold flex items-center gap-2 ${
            isDark ? 'text-slate-200' : 'text-slate-800'
          }`}
        >
          <ListTodo className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          {isUrdu ? 'نیا یومیہ کام / ٹاسک شامل کریں:' : 'Add New Daily Task / Goal:'}
        </label>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-300'
                : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            {tasks.length} {isUrdu ? 'کل ٹاسکس' : 'Total'} • {pendingCount} {isUrdu ? 'باقی' : 'Pending'}
          </span>
          {completedCount > 0 && (
            <button
              onClick={clearCompleted}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium px-2 py-1 transition-colors cursor-pointer"
            >
              {isUrdu ? 'مکمل شدہ صاف کریں' : 'Clear Done'}
            </button>
          )}
        </div>
      </div>

      {/* Task Input Group */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            id="taskInput"
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isUrdu
                ? 'آج آپ کو کیا کام مکمل کرنا ہے؟ (Enter دبائیں)'
                : language === 'roman_ur'
                ? 'Aaj konsa task complete karna hai? (Enter dabayen)'
                : 'What needs to be done today? (Type & press Enter)'
            }
            className={`w-full border rounded-xl px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 ${
              isDark
                ? 'bg-[#070b12] border-slate-800 focus:border-blue-500 text-slate-100 placeholder:text-slate-500 focus:ring-blue-500/20'
                : 'bg-slate-50 border-slate-300 focus:border-blue-600 text-slate-800 placeholder:text-slate-400 focus:ring-blue-500/20'
            }`}
          />
        </div>

        {/* Priority Selector */}
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as any)}
          className={`border rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none transition-all cursor-pointer ${
            isDark
              ? 'bg-[#070b12] border-slate-800 text-slate-300'
              : 'bg-slate-50 border-slate-300 text-slate-700'
          }`}
          title="Priority"
        >
          <option value="high">{isUrdu ? '🔥 اہم ترجیح' : '🔥 High'}</option>
          <option value="normal">{isUrdu ? '⚡ معمول' : '⚡ Normal'}</option>
          <option value="low">{isUrdu ? '🌱 ثانوی' : '🌱 Low'}</option>
        </select>

        {/* Add Button */}
        <button
          id="add-task-btn"
          onClick={addTask}
          disabled={!inputVal.trim()}
          className={`px-6 py-3 font-semibold rounded-xl text-xs sm:text-sm text-white shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            isDark
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/20'
              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{isUrdu ? 'شامل کریں' : 'Add Task'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 pt-1">
        {(['all', 'active', 'completed'] as const).map((f) => {
          const isActive = filter === f;
          const labels = {
            all: isUrdu ? 'تمام' : 'All',
            active: isUrdu ? 'جاری' : 'Active',
            completed: isUrdu ? 'مکمل شدہ' : 'Completed'
          };
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                isActive
                  ? isDark
                    ? 'bg-blue-950/80 border-blue-500/50 text-blue-300 shadow-sm'
                    : 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                  : isDark
                  ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {labels[f]}
            </button>
          );
        })}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div
            className={`border rounded-xl p-8 text-center transition-colors ${
              isDark ? 'border-slate-800/80 bg-[#070b12]/50' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {filter === 'completed'
                ? isUrdu
                  ? 'ابھی تک کوئی ٹاسک مکمل نہیں ہوا۔'
                  : 'No completed tasks yet.'
                : filter === 'active'
                ? isUrdu
                  ? 'سب کام مکمل ہو چکے ہیں! زبردست۔'
                  : 'All active tasks are complete! Great work.'
                : isUrdu
                ? 'ابھی تک کوئی کام شامل نہیں کیا گیا۔ اوپر دیے گئے باکس میں نیا کام لکھیں!'
                : 'No tasks added yet. Add your goals and daily to-dos above!'}
            </p>
          </div>
        ) : (
          <ul id="taskList" className="space-y-2 max-h-[380px] overflow-y-auto pe-1">
            {filteredTasks.map((task, idx) => (
              <li
                key={task.id}
                className={`task-item group border rounded-xl p-3.5 flex items-center justify-between gap-3 transition-all ${
                  task.completed
                    ? isDark
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-65'
                      : 'bg-slate-100/70 border-slate-200 opacity-70'
                    : isDark
                    ? 'bg-[#070b12] border-slate-800/80 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div
                  onClick={() => toggleTask(task.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer select-none"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTask(task.id);
                    }}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      task.completed
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : isDark
                        ? 'border-slate-700 bg-slate-900 group-hover:border-blue-500'
                        : 'border-slate-300 bg-white group-hover:border-blue-500'
                    }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <span
                    className={`text-sm font-medium transition-all truncate ${
                      task.completed
                        ? 'line-through text-slate-400'
                        : isDark
                        ? 'text-slate-100'
                        : 'text-slate-800'
                    }`}
                  >
                    {task.text}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {task.priority === 'high' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase">
                      High
                    </span>
                  )}
                  {task.priority === 'low' && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase">
                      Low
                    </span>
                  )}

                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      task.completed
                        ? 'text-emerald-500 hover:bg-emerald-500/10'
                        : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                    }`}
                    title={task.completed ? 'Mark Active' : 'Mark Complete'}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

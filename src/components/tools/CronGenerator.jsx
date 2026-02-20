import React, { useState, useEffect } from 'react';
// import cronstrue from 'cronstrue/i18n'; // Removed static import
// import parser from 'cron-parser'; // Removed static import
import { Clock, Calendar, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';

const CronGenerator = () => {
  const [expression, setExpression] = useState('* * * * *');
  const [humanReadable, setHumanReadable] = useState('');
  const [nextRuns, setNextRuns] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('minute'); // minute, hour, day, month, week
  const [copied, setCopied] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Builder State
  const [minute, setMinute] = useState({ type: 'every', start: 0, step: 1, specific: [] });
  const [hour, setHour] = useState({ type: 'every', start: 0, step: 1, specific: [] });
  const [day, setDay] = useState({ type: 'every', start: 1, step: 1, specific: [] });
  const [month, setMonth] = useState({ type: 'every', start: 1, step: 1, specific: [] });
  const [week, setWeek] = useState({ type: 'every', specific: [] });

  // Update expression when builder state changes
  useEffect(() => {
    const buildPart = (state, min, max) => {
      if (state.type === 'every') return '*';
      if (state.type === 'step') return `${state.start}/${state.step}`;
      if (state.type === 'specific') {
        return state.specific.length > 0 ? state.specific.sort((a,b)=>a-b).join(',') : '*'; // Default to * if empty to prevent error
      }
      return '*';
    };

    const m = buildPart(minute, 0, 59);
    const h = buildPart(hour, 0, 23);
    const d = buildPart(day, 1, 31);
    const mo = buildPart(month, 1, 12);
    const w = buildPart(week, 0, 6);

    // If both day and week are specified, one usually needs to be ? in Quartz, but standard cron allows both (union).
    // For simplicity, we'll stick to standard 5-part cron: min hour day month week
    // If user wants Quartz (6 parts with seconds), we can add seconds tab later.
    // Let's stick to standard 5-part Linux cron for broad compatibility.
    
    setExpression(`${m} ${h} ${d} ${mo} ${w}`);
  }, [minute, hour, day, month, week]);

  // Parse expression with dynamic imports
  useEffect(() => {
    let mounted = true;
    const parseCron = async () => {
      setIsCalculating(true);
      try {
        const cronstrue = (await import('cronstrue/i18n')).default;
        const parser = (await import('cron-parser')).default;

        if (!mounted) return;

        // Human readable
        const desc = cronstrue.toString(expression, { locale: "zh_CN" });
        setHumanReadable(desc);

        // Next runs
        const interval = parser.parseExpression(expression);
        const runs = [];
        for (let i = 0; i < 5; i++) {
          runs.push(interval.next().toDate());
        }
        setNextRuns(runs);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setHumanReadable('');
        setNextRuns([]);
        // Don't show error for "invalid" cron while typing if it's just incomplete
        // But cron-parser throws on invalid.
        // We can show error only if it's not empty?
        setError("无效的 Cron 表达式");
      } finally {
        if (mounted) setIsCalculating(false);
      }
    };

    // Debounce to avoid too many imports/calcs
    const timer = setTimeout(parseCron, 500);
    return () => {
        clearTimeout(timer);
        mounted = false;
    };
  }, [expression]);

  const handleCopy = () => {
    navigator.clipboard.writeText(expression);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const TabContent = ({ type, state, setState, range, label }) => {
    const toggleSpecific = (val) => {
      const newSpecific = state.specific.includes(val)
        ? state.specific.filter(v => v !== val)
        : [...state.specific, val];
      setState({ ...state, type: 'specific', specific: newSpecific });
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <input 
              type="radio" 
              checked={state.type === 'every'} 
              onChange={() => setState({ ...state, type: 'every' })}
              className="w-5 h-5 text-theme-primary border-gray-300 focus:ring-theme-primary"
            />
            <span className="text-gray-700 dark:text-gray-200">每{label}</span>
          </label>

          {type !== 'week' && (
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <input 
                type="radio" 
                checked={state.type === 'step'} 
                onChange={() => setState({ ...state, type: 'step' })}
                className="w-5 h-5 text-theme-primary border-gray-300 focus:ring-theme-primary"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-700 dark:text-gray-200">从第</span>
                <input 
                  type="number" 
                  min={range[0]} 
                  max={range[1]} 
                  value={state.start}
                  onChange={(e) => setState({ ...state, type: 'step', start: parseInt(e.target.value) })}
                  className="w-16 p-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-800"
                />
                <span className="text-gray-700 dark:text-gray-200">{label}开始，每隔</span>
                <input 
                  type="number" 
                  min="1" 
                  max={range[1]} 
                  value={state.step}
                  onChange={(e) => setState({ ...state, type: 'step', step: parseInt(e.target.value) })}
                  className="w-16 p-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-800"
                />
                <span className="text-gray-700 dark:text-gray-200">{label}执行一次</span>
              </div>
            </label>
          )}

          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <input 
              type="radio" 
              checked={state.type === 'specific'} 
              onChange={() => setState({ ...state, type: 'specific' })}
              className="w-5 h-5 text-theme-primary border-gray-300 focus:ring-theme-primary mt-1"
            />
            <div className="flex-1">
              <span className="text-gray-700 dark:text-gray-200 block mb-2">指定{label}</span>
              <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-2">
                {Array.from({ length: range[1] - range[0] + 1 }, (_, i) => i + range[0]).map(val => (
                  <button
                    key={val}
                    onClick={(e) => { e.preventDefault(); toggleSpecific(val); }}
                    className={`px-2 py-1 text-xs rounded border transition-all ${
                      state.type === 'specific' && state.specific.includes(val)
                        ? 'bg-theme-primary text-white border-theme-primary'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-theme-primary text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </label>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'minute', label: '分钟', state: minute, setState: setMinute, range: [0, 59] },
    { id: 'hour', label: '小时', state: hour, setState: setHour, range: [0, 23] },
    { id: 'day', label: '日期', state: day, setState: setDay, range: [1, 31] },
    { id: 'month', label: '月份', state: month, setState: setMonth, range: [1, 12] },
    { id: 'week', label: '星期', state: week, setState: setWeek, range: [0, 6] },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Result Display */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 mb-8 text-center relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
         
         <div className="mb-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">CRON 表达式</h2>
            <div className="flex items-center justify-center gap-4">
               <input 
                 type="text" 
                 value={expression} 
                 onChange={(e) => setExpression(e.target.value)}
                 className="text-4xl md:text-5xl font-mono font-bold text-center bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-theme-primary outline-none w-full max-w-2xl text-gray-800 dark:text-gray-100 py-2 transition-colors"
               />
               <button 
                 onClick={handleCopy}
                 className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors text-gray-600 dark:text-gray-300"
                 title="复制"
               >
                 {copied ? <Check size={24} className="text-green-500" /> : <Copy size={24} />}
               </button>
            </div>
         </div>

         {error ? (
            <div className="text-red-500 flex items-center justify-center gap-2">
               <AlertCircle size={18} />
               {error}
            </div>
         ) : (
            <div className="text-xl text-theme-primary font-medium min-h-[1.75rem]">
               {isCalculating ? <Loader2 className="animate-spin inline-block" size={20}/> : humanReadable}
            </div>
         )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Builder */}
         <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="flex border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
               {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-4 px-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                       activeTab === tab.id 
                         ? 'border-theme-primary text-theme-primary bg-theme-primary/5' 
                         : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                     {tab.label}
                  </button>
               ))}
            </div>
            <div className="p-6">
               {tabs.map(tab => (
                  activeTab === tab.id && (
                     <TabContent 
                        key={tab.id}
                        type={tab.id}
                        state={tab.state}
                        setState={tab.setState}
                        range={tab.range}
                        label={tab.label}
                     />
                  )
               ))}
            </div>
         </div>

         {/* Next Runs */}
         <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
               <Clock size={18} />
               接下来 5 次运行时间
            </h3>
            <div className="space-y-3">
               {isCalculating ? (
                  <div className="text-center py-4 text-gray-400">
                    <Loader2 className="animate-spin mx-auto mb-2" />
                    计算中...
                  </div>
               ) : (
                 <>
                   {nextRuns.map((date, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                         <div className="w-6 h-6 bg-theme-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-theme-primary">
                            {i + 1}
                         </div>
                         <div className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                            {date.toLocaleString('zh-CN')}
                         </div>
                      </div>
                   ))}
                   {nextRuns.length === 0 && !error && (
                      <div className="text-center text-gray-400 py-8">
                         等待计算...
                      </div>
                   )}
                 </>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default CronGenerator;

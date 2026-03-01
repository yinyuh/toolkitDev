import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Copy, Check, AlertCircle, Loader2, Zap, BookOpen, Lightbulb } from 'lucide-react';

const CronGenerator = () => {
  const [expression, setExpression] = useState('* * * * *');
  const [humanReadable, setHumanReadable] = useState('');
  const [nextRuns, setNextRuns] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('minute');
  const [copied, setCopied] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isManualInput, setIsManualInput] = useState(false);
  const [runCount, setRunCount] = useState(10);

  // Builder State
  const [minute, setMinute] = useState({ type: 'every', start: 0, step: 1, specific: [] });
  const [hour, setHour] = useState({ type: 'every', start: 0, step: 1, specific: [] });
  const [day, setDay] = useState({ type: 'every', start: 1, step: 1, specific: [] });
  const [month, setMonth] = useState({ type: 'every', start: 1, step: 1, specific: [] });
  const [week, setWeek] = useState({ type: 'every', specific: [] });

  // 常用预设
  const presets = [
    { name: '每分钟', expression: '* * * * *', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' },
    { name: '每5分钟', expression: '*/5 * * * *', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200' },
    { name: '每15分钟', expression: '*/15 * * * *', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200' },
    { name: '每30分钟', expression: '*/30 * * * *', color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200' },
    { name: '每小时', expression: '0 * * * *', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' },
    { name: '每2小时', expression: '0 */2 * * *', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200' },
    { name: '每天', expression: '0 0 * * *', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200' },
    { name: '每周', expression: '0 0 * * 0', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200' },
    { name: '每月', expression: '0 0 1 * *', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200' },
    { name: '每年', expression: '0 0 1 1 *', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200' },
    { name: '工作时间', expression: '0 9-18 * * 1-5', color: 'bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-200' },
    { name: '工作日', expression: '0 0 * * 1-5', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200' },
  ];

  // 解析 Cron 表达式并更新状态
  const parseExpressionToState = (expr) => {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) return;

    const parsePart = (part) => {
      if (part === '*') return { type: 'every', start: 0, step: 1, specific: [] };
      if (part.includes('/')) {
        const [start, step] = part.split('/');
        return { type: 'step', start: start === '*' ? 0 : parseInt(start), step: parseInt(step), specific: [] };
      }
      if (part.includes(',')) {
        return { type: 'specific', start: 0, step: 1, specific: part.split(',').map(v => parseInt(v)) };
      }
      if (part.includes('-')) {
        // 范围表达式，暂时转换为specific类型
        const [start, end] = part.split('-');
        const startNum = parseInt(start);
        const endNum = parseInt(end);
        if (!isNaN(startNum) && !isNaN(endNum)) {
          const specific = [];
          for (let i = startNum; i <= endNum; i++) {
            specific.push(i);
          }
          return { type: 'specific', start: 0, step: 1, specific };
        }
      }
      if (!isNaN(parseInt(part))) {
        return { type: 'specific', start: 0, step: 1, specific: [parseInt(part)] };
      }
      return { type: 'every', start: 0, step: 1, specific: [] };
    };

    setMinute(parsePart(parts[0]));
    setHour(parsePart(parts[1]));
    setDay(parsePart(parts[2]));
    setMonth(parsePart(parts[3]));
    setWeek(parsePart(parts[4]));
  };

  // Update expression when builder state changes
  useEffect(() => {
    if (isManualInput) return;
    
    const buildPart = (state, min, max) => {
      if (state.type === 'every') return '*';
      if (state.type === 'step') return `${state.start === 0 ? '*' : state.start}/${state.step}`;
      if (state.type === 'specific') {
        if (state.specific.length === 0) return '*';
        
        // 排序并去重
        const sorted = [...new Set(state.specific)].sort((a, b) => a - b);
        
        // 尝试转换为范围表达式
        const ranges = [];
        let currentStart = sorted[0];
        
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i] !== sorted[i-1] + 1) {
            if (currentStart === sorted[i-1]) {
              ranges.push(currentStart.toString());
            } else {
              ranges.push(`${currentStart}-${sorted[i-1]}`);
            }
            currentStart = sorted[i];
          }
        }
        
        // 处理最后一个范围
        if (currentStart === sorted[sorted.length - 1]) {
          ranges.push(currentStart.toString());
        } else {
          ranges.push(`${currentStart}-${sorted[sorted.length - 1]}`);
        }
        
        return ranges.join(',');
      }
      return '*';
    };

    const m = buildPart(minute, 0, 59);
    const h = buildPart(hour, 0, 23);
    const d = buildPart(day, 1, 31);
    const mo = buildPart(month, 1, 12);
    const w = buildPart(week, 0, 6);

    const newExpression = `${m} ${h} ${d} ${mo} ${w}`;
    if (newExpression !== expression) {
      setExpression(newExpression);
    }
  }, [minute, hour, day, month, week, isManualInput]);

  // Parse expression with dynamic imports
  useEffect(() => {
    let mounted = true;
    const parseCron = async () => {
      if (!expression.trim()) {
        setHumanReadable('');
        setNextRuns([]);
        setError(null);
        return;
      }

      setIsCalculating(true);
      try {
        const cronstrueModule = await import('cronstrue/i18n');
        const cronstrue = cronstrueModule.default || cronstrueModule;
        
        const parserModule = await import('cron-parser');
        const parser = parserModule.default || parserModule;

        if (!mounted) return;

        // 验证表达式格式
        const parts = expression.trim().split(/\s+/);
        if (parts.length !== 5) {
          throw new Error('Cron 表达式必须包含 5 个字段');
        }

        // Human readable
        let desc = cronstrue.toString(expression, { locale: "zh_CN" });
        desc = optimizeChineseDescription(desc);
        setHumanReadable(desc);

        // Next runs
        const interval = parser.parse(expression);
        const runs = [];
        for (let i = 0; i < runCount; i++) {
          runs.push(interval.next().toDate());
        }
        setNextRuns(runs);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setHumanReadable('');
        setNextRuns([]);
        setError("无效的 Cron 表达式: " + (err.message || '格式错误'));
      } finally {
        if (mounted) setIsCalculating(false);
      }
    };

    const timer = setTimeout(parseCron, 300);
    return () => {
        clearTimeout(timer);
        mounted = false;
    };
  }, [expression, runCount]);

  const handleCopy = () => {
    navigator.clipboard.writeText(expression);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyPreset = (preset) => {
    setExpression(preset.expression);
    parseExpressionToState(preset.expression);
    setIsManualInput(false);
  };

  const handleExpressionChange = (e) => {
    const newExpr = e.target.value;
    setExpression(newExpr);
    setIsManualInput(true);
    // 不立即解析到状态，让用户可以自由输入
  };

  // 优化中文描述
  const optimizeChineseDescription = (desc) => {
    // 处理午夜时间
    desc = desc.replace('在上午 12:00', '每天午夜执行');
    desc = desc.replace('在 12:00 AM', '每天午夜执行');
    
    // 处理整点时间
    desc = desc.replace('在下午 12:00', '每天中午执行');
    desc = desc.replace('在 12:00 PM', '每天中午执行');
    
    // 处理每周日
    desc = desc.replace('在星期日', '每周日');
    desc = desc.replace('在周日', '每周日');
    
    // 处理每月1号
    desc = desc.replace('在 1 号', '每月1号');
    
    // 处理每年1月1号
    desc = desc.replace('在 1 月 1 号', '每年1月1号');
    
    // 处理工作日
    desc = desc.replace('在星期一、二、三、四、五', '每个工作日');
    
    // 处理更自然的表达
    desc = desc.replace('每隔 1 分钟', '每分钟');
    desc = desc.replace('每隔 1 小时', '每小时');
    desc = desc.replace('每隔 1 天', '每天');
    
    return desc;
  };

  const TabContent = ({ type, state, setState, range, label }) => {
    const toggleSpecific = (val) => {
      const newSpecific = state.specific.includes(val)
        ? state.specific.filter(v => v !== val)
        : [...state.specific, val];
      setState({ ...state, type: 'specific', specific: newSpecific });
      setIsManualInput(false);
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-div-hover dark:hover:bg-div-hover transition-colors">
            <input 
              type="radio" 
              checked={state.type === 'every'} 
              onChange={() => { setState({ ...state, type: 'every' }); setIsManualInput(false); }}
              className="w-5 h-5 text-accent border-border-theme focus:ring-accent"
            />
            <span className="text-text-secondary">每{label}</span>
          </label>

          {type !== 'week' && (
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-div-hover dark:hover:bg-div-hover transition-colors">
              <input 
                type="radio" 
                checked={state.type === 'step'} 
                onChange={() => { setState({ ...state, type: 'step' }); setIsManualInput(false); }}
                className="w-5 h-5 text-accent border-border-theme focus:ring-accent"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-text-secondary">从第</span>
                <input 
                  type="number" 
                  min={range[0]} 
                  max={range[1]} 
                  value={state.start}
                  onChange={(e) => { setState({ ...state, type: 'step', start: parseInt(e.target.value) || 0 }); setIsManualInput(false); }}
                  className="w-16 p-1 border border-border-theme rounded text-center bg-div-secondary"
                />
                <span className="text-text-secondary">{label}开始，每隔</span>
                <input 
                  type="number" 
                  min="1" 
                  max={range[1]} 
                  value={state.step}
                  onChange={(e) => { setState({ ...state, type: 'step', step: parseInt(e.target.value) || 1 }); setIsManualInput(false); }}
                  className="w-16 p-1 border border-border-theme rounded text-center bg-div-secondary"
                />
                <span className="text-text-secondary">{label}执行一次</span>
              </div>
            </label>
          )}

          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-div-hover dark:hover:bg-div-hover transition-colors">
            <input 
              type="radio" 
              checked={state.type === 'specific'} 
              onChange={() => { setState({ ...state, type: 'specific' }); setIsManualInput(false); }}
              className="w-5 h-5 text-accent border-border-theme focus:ring-accent mt-1"
            />
            <div className="flex-1">
              <span className="text-text-secondary block mb-2">指定{label}</span>
              <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-2">
                {Array.from({ length: range[1] - range[0] + 1 }, (_, i) => i + range[0]).map(val => (
                  <button
                    key={val}
                    onClick={(e) => { e.preventDefault(); toggleSpecific(val); }}
                    className={`px-2 py-1 text-xs rounded border transition-all ${
                      state.type === 'specific' && state.specific.includes(val)
                        ? 'bg-accent text-white border-accent'
                        : 'bg-div-secondary border-border-theme hover:border-accent text-text-secondary'
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
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* Result Display */}
      <div className="bg-div-theme rounded-2xl shadow-sm border border-border-theme p-8 mb-8 text-center relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
         
         <div className="mb-4">
            <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">CRON 表达式</h2>
            <div className="flex items-center justify-center gap-4">
               <input 
                 type="text" 
                 value={expression} 
                 onChange={handleExpressionChange}
                 className="text-4xl md:text-5xl font-mono font-bold text-center bg-transparent border-b-2 border-border-theme focus:border-accent outline-none w-full max-w-2xl text-text-theme py-2 transition-colors"
                 placeholder="* * * * *"
               />
               <button 
                 onClick={handleCopy}
                 className="p-3 bg-div-secondary hover:bg-div-hover dark:hover:bg-div-hover rounded-xl transition-colors text-text-secondary"
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
            <div className="text-xl text-accent font-medium min-h-[1.75rem]">
               {isCalculating ? <Loader2 className="animate-spin inline-block" size={20}/> : humanReadable}
            </div>
         )}
      </div>

      {/* 常用预设 */}
      <div className="bg-div-theme rounded-2xl shadow-sm border border-border-theme p-6 mb-8">
        <h3 className="font-bold text-text-theme mb-4 flex items-center gap-2">
          <Zap size={18} className="text-yellow-500" />
          常用预设
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {presets.map((preset, index) => (
            <button
              key={index}
              onClick={() => applyPreset(preset)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 ${preset.color} ${
                expression === preset.expression ? 'ring-2 ring-offset-2 ring-accent' : ''
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Builder */}
      <div className="bg-div-theme rounded-2xl shadow-sm border border-border-theme overflow-hidden mb-8">
         <div className="flex border-b border-border-theme overflow-x-auto">
            {tabs.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => { setActiveTab(tab.id); setIsManualInput(false); }}
                 className={`flex-1 py-4 px-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'border-accent text-accent bg-accent/5' 
                      : 'border-transparent text-text-secondary hover:text-text-theme'
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
      <div className="bg-div-theme rounded-2xl shadow-sm border border-border-theme p-6">
         <div className="mb-4">
           <h3 className="font-bold text-text-theme flex items-center gap-2 mb-3">
             <Clock size={18} />
             接下来运行时间
           </h3>
           <div className="flex items-center gap-3">
             <span className="text-sm text-text-secondary">显示次数：</span>
             <div className="flex items-center gap-2">
               <select 
                 value={runCount}
                 onChange={(e) => setRunCount(parseInt(e.target.value))}
                 className="px-3 py-1 border border-border-theme rounded text-sm bg-div-secondary focus:outline-none focus:ring-2 focus:ring-accent"
               >
                 <option value="10">10次</option>
                 <option value="20">20次</option>
                 <option value="50">50次</option>
                 <option value="100">100次</option>
               </select>
               <input 
                 type="number" 
                 value={runCount}
                 onChange={(e) => {
                   const value = parseInt(e.target.value) || 10;
                   setRunCount(Math.min(Math.max(value, 1), 100));
                 }}
                 min="1"
                 max="100"
                 className="w-16 px-2 py-1 border border-border-theme rounded text-sm bg-div-secondary focus:outline-none focus:ring-2 focus:ring-accent text-center"
               />
             </div>
           </div>
         </div>
         <div className="max-h-80 overflow-y-auto custom-scrollbar pr-2">
            {isCalculating ? (
               <div className="text-center py-4 text-text-secondary">
                 <Loader2 className="animate-spin mx-auto mb-2" />
                 计算中...
               </div>
            ) : (
              <>
                {nextRuns.map((date, i) => {
                  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
                  const weekDay = weekDays[date.getDay()];
                  const dateStr = date.toLocaleDateString('zh-CN');
                  const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                   
                  return (
                   <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: i < nextRuns.length - 1 ? '1px solid #dfe0e6' : 'none' }}>
                      <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">
                         {i + 1}
                      </div>
                      <div className="text-sm text-text-secondary font-mono text-right">
                         <span>{dateStr}</span>
                         <span className="mx-1"> </span>
                         <span>{timeStr}</span>
                         <span className="ml-2 text-accent">({weekDay})</span>
                      </div>
                   </div>
                  );
                })}
                {nextRuns.length === 0 && !error && (
                   <div className="text-center text-text-secondary py-8">
                      等待计算...
                   </div>
                )}
              </>
            )}
         </div>
      </div>

      {/* 专业解释说明 */}
      <div className="mt-8 bg-div-theme rounded-2xl shadow-sm border border-border-theme p-6">
        <h3 className="font-bold text-text-theme mb-6 flex items-center gap-2">
          <BookOpen size={20} className="text-accent" />
          关于 Cron 表达式生成器
        </h3>
        
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
            <p className="text-text-secondary leading-relaxed">
              Cron 是类 Unix 操作系统中的时间任务调度器。Cron 表达式是由 5 个字段组成的字符串，用于定义计划任务的执行时间。
            </p>
          </div>

          <div>
            <h4 className="font-bold text-text-theme mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-accent/10 rounded flex items-center justify-center text-xs text-accent">1</span>
              Cron 表达式格式
            </h4>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {[
                { name: '分钟', range: '0-59', color: 'bg-green-500' },
                { name: '小时', range: '0-23', color: 'bg-blue-500' },
                { name: '日期', range: '1-31', color: 'bg-purple-500' },
                { name: '月份', range: '1-12', color: 'bg-orange-500' },
                { name: '星期', range: '0-6', color: 'bg-pink-500' },
              ].map((field, i) => (
                <div key={i} className="text-center">
                  <div className={`${field.color} text-white rounded-t-lg py-2 font-bold text-sm`}>*</div>
                  <div className="bg-div-secondary rounded-b-lg py-2">
                    <div className="text-xs text-text-theme font-medium">{field.name}</div>
                    <div className="text-xs text-text-secondary">{field.range}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-text-theme mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-accent/10 rounded flex items-center justify-center text-xs text-accent">2</span>
              特殊字符
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { char: '*', desc: '任意值（通配符）', example: '* * * * * 每分钟执行' },
                { char: ',', desc: '列表分隔符', example: '0 0 1,15 * * 每月1日和15日执行' },
                { char: '-', desc: '范围', example: '0 9-18 * * 1-5 工作时间的每小时执行' },
                { char: '/', desc: '步长值', example: '*/5 * * * * 每5分钟执行' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-div-secondary rounded-lg">
                  <code className="w-8 h-8 bg-accent text-white rounded flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {item.char}
                  </code>
                  <div>
                    <div className="text-sm text-text-theme font-medium">{item.desc}</div>
                    <div className="text-xs text-text-secondary mt-1">{item.example}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-text-theme mb-3 flex items-center gap-2">
              <Lightbulb size={16} className="text-yellow-500" />
              常用示例
            </h4>
            <div className="space-y-2">
              {[
                { expr: '0 0 * * *', desc: '每天午夜执行' },
                { expr: '0 9 * * 1', desc: '每周一上午9点执行' },
                { expr: '0 */4 * * *', desc: '每4小时执行' },
                { expr: '30 4 1,15 * *', desc: '每月1日和15日凌晨4:30执行' },
                { expr: '0 0 * * 0', desc: '每周日午夜执行' },
                { expr: '0 12 1 * *', desc: '每月1日中午12点执行' },
              ].map((example, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-div-secondary rounded-lg hover:bg-div-hover transition-colors cursor-pointer" onClick={() => { setExpression(example.expr); parseExpressionToState(example.expr); }}>
                  <code className="px-3 py-1 bg-accent/10 text-accent rounded font-mono text-sm font-bold">
                    {example.expr}
                  </code>
                  <span className="text-sm text-text-secondary">{example.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CronGenerator;

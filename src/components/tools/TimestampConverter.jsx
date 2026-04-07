import React, { useState, useEffect, useRef } from 'react';
import { format, fromUnixTime, getUnixTime, isValid, parseISO, startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';
import { HiOutlineClock, HiOutlineRefresh, HiOutlineClipboardCopy, HiCheck, HiOutlineSwitchHorizontal, HiOutlineGlobe } from 'react-icons/hi';
import { toast, Toaster } from 'sonner';

const TIMEZONES = [
  { value: 'local', label: '本地时间 (Local)' },
  { value: 'UTC', label: 'UTC (世界协调时)' },
  // Asia
  { value: 'Asia/Shanghai', label: '中国 - 北京 (Shanghai)' },
  { value: 'Asia/Hong_Kong', label: '中国 - 香港 (Hong Kong)' },
  { value: 'Asia/Taipei', label: '中国 - 台北 (Taipei)' },
  { value: 'Asia/Tokyo', label: '日本 - 东京 (Tokyo)' },
  { value: 'Asia/Seoul', label: '韩国 - 首尔 (Seoul)' },
  { value: 'Asia/Singapore', label: '新加坡 (Singapore)' },
  { value: 'Asia/Dubai', label: '阿联酋 - 迪拜 (Dubai)' },
  { value: 'Asia/Bangkok', label: '泰国 - 曼谷 (Bangkok)' },
  { value: 'Asia/Jakarta', label: '印尼 - 雅加达 (Jakarta)' },
  { value: 'Asia/Ho_Chi_Minh', label: '越南 - 胡志明 (Ho Chi Minh)' },
  { value: 'Asia/Kuala_Lumpur', label: '马来西亚 - 吉隆坡 (Kuala Lumpur)' },
  { value: 'Asia/Manila', label: '菲律宾 - 马尼拉 (Manila)' },
  { value: 'Asia/Kolkata', label: '印度 - 孟买 (Mumbai)' },
  { value: 'Asia/Riyadh', label: '沙特 - 利雅得 (Riyadh)' },
  // Europe
  { value: 'Europe/London', label: '英国 - 伦敦 (London)' },
  { value: 'Europe/Paris', label: '法国 - 巴黎 (Paris)' },
  { value: 'Europe/Berlin', label: '德国 - 柏林 (Berlin)' },
  { value: 'Europe/Moscow', label: '俄罗斯 - 莫斯科 (Moscow)' },
  { value: 'Europe/Rome', label: '意大利 - 罗马 (Rome)' },
  { value: 'Europe/Madrid', label: '西班牙 - 马德里 (Madrid)' },
  { value: 'Europe/Amsterdam', label: '荷兰 - 阿姆斯特丹 (Amsterdam)' },
  { value: 'Europe/Brussels', label: '比利时 - 布鲁塞尔 (Brussels)' },
  { value: 'Europe/Stockholm', label: '瑞典 - 斯德哥尔摩 (Stockholm)' },
  { value: 'Europe/Zurich', label: '瑞士 - 苏黎世 (Zurich)' },
  { value: 'Europe/Kiev', label: '乌克兰 - 基辅 (Kiev)' },
  // North America
  { value: 'America/New_York', label: '美国 - 纽约 (New York)' },
  { value: 'America/Los_Angeles', label: '美国 - 洛杉矶 (Los Angeles)' },
  { value: 'America/Chicago', label: '美国 - 芝加哥 (Chicago)' },
  { value: 'America/Denver', label: '美国 - 丹佛 (Denver)' },
  { value: 'America/Phoenix', label: '美国 - 凤凰城 (Phoenix)' },
  { value: 'America/Toronto', label: '加拿大 - 多伦多 (Toronto)' },
  { value: 'America/Vancouver', label: '加拿大 - 温哥华 (Vancouver)' },
  { value: 'America/Mexico_City', label: '墨西哥 - 墨西哥城 (Mexico City)' },
  // South America
  { value: 'America/Sao_Paulo', label: '巴西 - 圣保罗 (Sao Paulo)' },
  { value: 'America/Buenos_Aires', label: '阿根廷 - 布宜诺斯艾利斯 (Buenos Aires)' },
  { value: 'America/Santiago', label: '智利 - 圣地亚哥 (Santiago)' },
  { value: 'America/Bogota', label: '哥伦比亚 - 波哥大 (Bogota)' },
  // Oceania
  { value: 'Australia/Sydney', label: '澳大利亚 - 悉尼 (Sydney)' },
  { value: 'Australia/Melbourne', label: '澳大利亚 - 墨尔本 (Melbourne)' },
  { value: 'Australia/Brisbane', label: '澳大利亚 - 布里斯班 (Brisbane)' },
  { value: 'Australia/Perth', label: '澳大利亚 - 珀斯 (Perth)' },
  { value: 'Pacific/Auckland', label: '新西兰 - 奥克兰 (Auckland)' },
  // Africa
  { value: 'Africa/Cairo', label: '埃及 - 开罗 (Cairo)' },
  { value: 'Africa/Johannesburg', label: '南非 - 约翰内斯堡 (Johannesburg)' },
  { value: 'Africa/Lagos', label: '尼日利亚 - 拉各斯 (Lagos)' },
];

const TimestampConverter = () => {
  // 状态管理
  const [currentTimestamp, setCurrentTimestamp] = useState(Math.floor(Date.now() / 1000));
  const [isPaused, setIsPaused] = useState(false);
  
  // 转换状态
  const [inputTimestamp, setInputTimestamp] = useState('');
  const [convertedDate, setConvertedDate] = useState('');
  const [inputDate, setInputDate] = useState(format(new Date(), "yyyy-MM-dd HH:mm:ss"));
  const [convertedTimestamp, setConvertedTimestamp] = useState('');
  const [unit, setUnit] = useState('seconds'); // seconds | milliseconds
  const [timezone, setTimezone] = useState('local'); // local | utc

  const normalizeTimezone = (value) => {
    if (value === 'Asia/Mumbai') {
      return 'Asia/Kolkata';
    }
    return value;
  };

  // 获取实际使用的时区字符串
  const getActualTimezone = () => {
    if (timezone === 'local') {
      return normalizeTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
    return normalizeTimezone(timezone);
  };

  // 格式化日期字符串 (带时区处理)
  const formatDateString = (date) => {
    const tz = getActualTimezone();
    return formatInTimeZone(date, tz, "yyyy-MM-dd HH:mm:ss");
  };

  // 实时更新当前时间戳
  useEffect(() => {
    let interval;
    if (!isPaused) {
      interval = setInterval(() => {
        setCurrentTimestamp(Math.floor(Date.now() / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused]);

  // 处理时间戳输入变化
  const handleTimestampChange = (e) => {
    const value = e.target.value;
    setInputTimestamp(value);
    
    if (!value) {
      setConvertedDate('');
      return;
    }

    // 尝试转换
    try {
      let ts = parseInt(value);
      if (isNaN(ts)) return;
      
      // 自动检测毫秒
      if (value.length > 11) {
        ts = Math.floor(ts / 1000);
      }
      
      const date = fromUnixTime(ts);
      if (isValid(date)) {
        setConvertedDate(formatDateString(date));
      } else {
        setConvertedDate('无效的时间戳');
      }
    } catch (err) {
      setConvertedDate('转换错误');
    }
  };

  // 处理日期输入变化
  const handleDateChange = (e) => {
    const value = e.target.value;
    setInputDate(value);
    
    if (!value) {
      setConvertedTimestamp('');
      return;
    }

    try {
      // 尝试解析各种格式
      let date;
      // 优先尝试 yyyy-MM-dd HH:mm:ss
      if (value.includes(' ')) {
         const parts = value.split(' ');
         if (parts.length === 2) {
            date = new Date(value.replace(/-/g, '/')); // 简单的浏览器兼容性处理
         }
      }
      
      if (!isValid(date)) {
        date = parseISO(value);
      }
      
      // 如果仍然无效，尝试 date-fns 的 parse
      if (!isValid(date)) {
         date = new Date(value);
      }

      if (isValid(date)) {
        // 使用 fromZonedTime 处理时区
        const tz = getActualTimezone();
        // 如果是 Date 对象，先转为字符串再按时区解析，或者直接调整时区
        // 这里为了准确，我们使用 date-fns-tz 的 fromZonedTime
        // 但 date-fns-tz 的 fromZonedTime 接收 string | number | Date
        // 如果我们已经有了一个 Date 对象 (通常是本地时间解析出来的)，我们需要根据选择的时区重新计算 UTC 时间戳
        
        // 关键点：inputDate 是用户输入的字符串，我们应该将其视为目标时区的时间
        // date 变量是 new Date(inputDate) 解析出来的，它默认使用了浏览器本地时区
        
        // 更好的做法：直接解析字符串 + 时区
        let ts;
        if (timezone === 'local') {
             ts = getUnixTime(date);
        } else {
             // 将输入字符串视为指定时区的时间
             // 注意：fromZonedTime 需要比较标准的 ISO 格式或 date-fns 能解析的格式
             // 简单的 yyyy-MM-dd HH:mm:ss 可能需要处理
             const normalizedDateStr = value.replace(' ', 'T');
             const zonedDate = fromZonedTime(normalizedDateStr, timezone);
             if (isValid(zonedDate)) {
                 ts = getUnixTime(zonedDate);
             } else {
                 // 回退逻辑
                 ts = getUnixTime(date);
             }
        }

        setConvertedTimestamp(unit === 'milliseconds' ? ts * 1000 : ts);
      } else {
        setConvertedTimestamp('无效的日期格式');
      }
    } catch (err) {
      setConvertedTimestamp('转换错误');
    }
  };

  // 复制功能
  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('复制成功！');
  };

  // 获取当前时间
  const getCurrentTime = () => {
    const now = new Date();
    setInputTimestamp(Math.floor(now.getTime() / 1000).toString());
    handleTimestampChange({ target: { value: Math.floor(now.getTime() / 1000).toString() } });
    
    // 使用 formatDateString 处理时区
    const formattedDate = formatDateString(now);
    setInputDate(formattedDate);
    // 这里 handleDateChange 会根据 timezone 重新计算，理论上应该是对的
    // 但为了确保输入框显示正确，我们需要传入正确的字符串
    // handleDateChange 内部会再次解析这个字符串，如果 timezone 不是 local，解析出来的 UTC 时间戳应该和 now.getTime() 一致
    
    // 手动触发一次 date change 逻辑，但为了避免时区转换带来的微小差异，我们直接用 now 更新 inputDate
    // 注意：inputDate 只是 UI 显示，handleDateChange 负责计算 convertedTimestamp
    
    // 重新调用 handleDateChange 确保 convertedTimestamp 更新
    handleDateChange({ target: { value: formattedDate } });
    
    toast.success('已更新为当前时间');
  };

  // 快捷时间设置
  const setShortcutTime = (type) => {
    const now = new Date();
    const tz = getActualTimezone();
    let targetDate;

    // 获取当前时区的 Date 对象（用于计算）
    const zonedNow = toZonedTime(now, tz);

    switch (type) {
      case 'todayStart':
        targetDate = startOfDay(zonedNow);
        break;
      case 'weekStart':
        targetDate = startOfWeek(zonedNow, { weekStartsOn: 1 });
        break;
      case 'monthStart':
        targetDate = startOfMonth(zonedNow);
        break;
      case 'yearStart':
        targetDate = startOfYear(zonedNow);
        break;
      default:
        targetDate = now;
    }

    // 将计算出的 zonedDate 转回 UTC 时间戳
    // 注意：date-fns 的 startOf... 返回的是 Date 对象，保留了原有的时间值，但我们需要将其视为在特定时区的时间
    // 所以我们需要用 fromZonedTime 将其转回 UTC
    
    // date-fns-tz 的 toZonedTime 返回的是一个 Date 对象，其内部时间值被调整过了（看起来像那个时区的时间）
    // startOfDay 会基于这个调整过的时间计算 00:00:00
    // 然后我们需要把这个 00:00:00 (它是 Zoned Time) 转回 UTC Timestamp
    
    const utcDate = fromZonedTime(targetDate, tz);
    const ts = getUnixTime(utcDate);
    
    // 更新 UI
    setInputTimestamp(ts.toString());
    handleTimestampChange({ target: { value: ts.toString() } });
    
    const dateStr = format(targetDate, "yyyy-MM-dd HH:mm:ss");
    setInputDate(dateStr);
    handleDateChange({ target: { value: dateStr } });
    
    toast.success('已应用快捷时间');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <Toaster position="top-center" />
      
      {/* 顶部实时时钟卡片 */}
      <div className="bg-div-theme rounded-xl p-6 shadow-lg border border-theme-border text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x"></div>
        
        <h2 className="text-xl font-semibold text-theme-secondary mb-4 flex items-center justify-center gap-2">
          <HiOutlineClock className="w-6 h-6 text-accent" />
          当前 Unix 时间戳
        </h2>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-4">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-mono font-bold text-accent tracking-wider mb-2">
              {currentTimestamp}
            </span>
            <span className="text-sm text-theme-tertiary">秒 (Seconds)</span>
          </div>
          
          <div className="hidden md:block w-px h-12 bg-theme-border"></div>
          
          <div className="flex flex-col items-center">
            <span className="text-2xl font-mono font-semibold text-theme-primary mb-2">
              {formatDateString(fromUnixTime(currentTimestamp))}
            </span>
            <span className="text-sm text-theme-tertiary flex items-center gap-1">
              <HiOutlineGlobe className="w-3 h-3" />
              {TIMEZONES.find(t => t.value === timezone)?.label.split('(')[0].trim() || '本地时间'}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col gap-4 max-w-xs mx-auto mb-6">
          <div className="relative">
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full appearance-none bg-theme-background border border-theme-border text-theme-primary py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 cursor-pointer text-sm"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-theme-tertiary">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isPaused 
                ? 'bg-green-500/20 text-green-600 hover:bg-green-500/30' 
                : 'bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30'
            }`}
          >
            {isPaused ? '继续运行' : '暂停更新'}
          </button>
          <button
            onClick={() => copyToClipboard(currentTimestamp.toString())}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-div-theme border border-theme-border hover:bg-theme-border/50 transition-colors flex items-center gap-2"
            aria-label="复制当前时间戳"
          >
            <HiOutlineClipboardCopy aria-hidden="true" />
            复制时间戳
          </button>
        </div>
      </div>

      {/* 主要转换区域 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 时间戳转日期 */}
        <div className="bg-div-theme rounded-xl p-6 shadow-lg border border-theme-border">
          <h3 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-sm">1</span>
            时间戳转日期
          </h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="timestamp-input" className="block text-sm font-medium text-theme-secondary mb-2">
                Unix 时间戳
              </label>
              <div className="relative">
                <input
                  id="timestamp-input"
                  type="text"
                  value={inputTimestamp}
                  onChange={handleTimestampChange}
                  placeholder="例如: 1678888888"
                  className="w-full px-4 py-3 bg-theme-background border border-theme-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none font-mono"
                />
                <button
                  onClick={() => copyToClipboard(inputTimestamp)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-tertiary hover:text-accent transition-colors"
                  title="复制"
                  aria-label="复制输入的时间戳"
                >
                  <HiOutlineClipboardCopy className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>
            
            <div className="flex justify-center" aria-hidden="true">
               <HiOutlineSwitchHorizontal className="w-6 h-6 text-theme-tertiary rotate-90 md:rotate-0" />
            </div>

            <div className="bg-theme-background/50 rounded-lg p-4 border border-theme-border">
              <label className="block text-xs font-medium text-theme-tertiary mb-1 uppercase tracking-wider">
                转换结果
              </label>
              <div className="flex items-center justify-between">
                <span className="text-lg font-mono font-medium text-accent break-all">
                  {convertedDate || '等待输入...'}
                </span>
                {convertedDate && (
                  <button
                    onClick={() => copyToClipboard(convertedDate)}
                    className="ml-2 p-2 hover:bg-theme-border rounded-md transition-colors text-theme-tertiary hover:text-accent"
                    aria-label="复制转换后的日期"
                  >
                    <HiOutlineClipboardCopy className="w-5 h-5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={getCurrentTime}
                className="col-span-2 py-2 text-sm text-theme-secondary hover:text-accent transition-colors flex items-center justify-center gap-2 border border-dashed border-theme-border rounded-lg hover:border-accent"
              >
                <HiOutlineRefresh className="w-4 h-4" />
                使用当前时间
              </button>
              <button onClick={() => setShortcutTime('todayStart')} className="py-1.5 text-xs bg-theme-background border border-theme-border rounded hover:bg-theme-border transition-colors text-theme-secondary">
                今天 00:00
              </button>
              <button onClick={() => setShortcutTime('weekStart')} className="py-1.5 text-xs bg-theme-background border border-theme-border rounded hover:bg-theme-border transition-colors text-theme-secondary">
                本周一 00:00
              </button>
              <button onClick={() => setShortcutTime('monthStart')} className="py-1.5 text-xs bg-theme-background border border-theme-border rounded hover:bg-theme-border transition-colors text-theme-secondary">
                本月 1日
              </button>
              <button onClick={() => setShortcutTime('yearStart')} className="py-1.5 text-xs bg-theme-background border border-theme-border rounded hover:bg-theme-border transition-colors text-theme-secondary">
                今年 1月1日
              </button>
            </div>
          </div>
        </div>

        {/* 日期转时间戳 */}
        <div className="bg-div-theme rounded-xl p-6 shadow-lg border border-theme-border">
          <h3 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center text-sm">2</span>
            日期转时间戳
          </h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="date-input" className="block text-sm font-medium text-theme-secondary mb-2">
                日期时间 (YYYY-MM-DD HH:mm:ss)
              </label>
              <input
                id="date-input"
                type="text"
                value={inputDate}
                onChange={handleDateChange}
                placeholder="2024-03-05 10:00:00"
                className="w-full px-4 py-3 bg-theme-background border border-theme-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none font-mono"
              />
            </div>

            <div className="flex justify-center" aria-hidden="true">
               <HiOutlineSwitchHorizontal className="w-6 h-6 text-theme-tertiary rotate-90 md:rotate-0" />
            </div>

            <div className="bg-theme-background/50 rounded-lg p-4 border border-theme-border">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-medium text-theme-tertiary uppercase tracking-wider">
                  转换结果
                </label>
                <div className="flex bg-theme-background rounded-md p-0.5 border border-theme-border">
                  <button
                    onClick={() => { setUnit('seconds'); handleDateChange({ target: { value: inputDate } }); }}
                    className={`px-2 py-0.5 text-xs rounded-sm transition-colors ${unit === 'seconds' ? 'bg-accent text-white' : 'text-theme-tertiary hover:text-theme-primary'}`}
                  >
                    秒 (s)
                  </button>
                  <button
                    onClick={() => { setUnit('milliseconds'); handleDateChange({ target: { value: inputDate } }); }}
                    className={`px-2 py-0.5 text-xs rounded-sm transition-colors ${unit === 'milliseconds' ? 'bg-accent text-white' : 'text-theme-tertiary hover:text-theme-primary'}`}
                  >
                    毫秒 (ms)
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-lg font-mono font-medium text-accent break-all">
                  {convertedTimestamp || '等待输入...'}
                </span>
                {convertedTimestamp && (
                  <button
                    onClick={() => copyToClipboard(convertedTimestamp.toString())}
                    className="ml-2 p-2 hover:bg-theme-border rounded-md transition-colors text-theme-tertiary hover:text-accent"
                    aria-label="复制转换后的时间戳"
                  >
                    <HiOutlineClipboardCopy className="w-5 h-5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={getCurrentTime}
              className="w-full py-2 text-sm text-theme-secondary hover:text-accent transition-colors flex items-center justify-center gap-2 border border-dashed border-theme-border rounded-lg hover:border-accent"
            >
              <HiOutlineRefresh className="w-4 h-4" />
              使用当前时间
            </button>
          </div>
        </div>
      </div>

      {/* 常见问题 / SEO 内容区 */}
      <div className="bg-div-theme rounded-xl p-8 shadow-lg border border-theme-border prose prose-invert max-w-none">
        <h2 className="text-2xl font-bold text-theme-primary mb-6">关于 Unix 时间戳 (Unix Timestamp)</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-accent mb-3">什么是 Unix 时间戳？</h3>
            <p className="text-theme-secondary text-sm leading-relaxed mb-4">
              Unix 时间戳（Unix Timestamp）是指从 <strong>1970年1月1日 00:00:00 UTC</strong>（协调世界时）开始所经过的秒数，不考虑闰秒。它是一种广泛用于计算机系统中的时间表示方式。
            </p>
            <p className="text-theme-secondary text-sm leading-relaxed">
              这种格式具有跨平台、跨时区的特性，使得时间存储和计算变得非常简单高效。无论你在地球的哪个角落，同一时刻的 Unix 时间戳都是相同的。
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-accent mb-3">为什么需要这个转换工具？</h3>
            <ul className="list-disc pl-5 text-theme-secondary text-sm space-y-2">
              <li><strong>开发调试</strong>：快速将数据库中的时间戳转换为可读日期，排查 Bug。</li>
              <li><strong>日志分析</strong>：服务器日志通常记录为时间戳，需要转换后才能理解具体发生时间。</li>
              <li><strong>跨时区协作</strong>：统一使用时间戳沟通，避免“北京时间”与“美东时间”的混淆。</li>
              <li><strong>API 对接</strong>：许多现代 RESTful API 使用时间戳作为时间参数。</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-theme-border">
          <h3 className="text-lg font-semibold text-accent mb-4">常见编程语言获取时间戳的方法</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-theme-background p-4 rounded-lg border border-theme-border">
              <span className="text-xs font-bold text-blue-400 mb-2 block">JavaScript</span>
              <code className="text-xs font-mono text-theme-primary">Math.floor(Date.now() / 1000)</code>
            </div>
            <div className="bg-theme-background p-4 rounded-lg border border-theme-border">
              <span className="text-xs font-bold text-yellow-400 mb-2 block">Python</span>
              <code className="text-xs font-mono text-theme-primary">import time; time.time()</code>
            </div>
            <div className="bg-theme-background p-4 rounded-lg border border-theme-border">
              <span className="text-xs font-bold text-green-400 mb-2 block">Java</span>
              <code className="text-xs font-mono text-theme-primary">System.currentTimeMillis() / 1000</code>
            </div>
            <div className="bg-theme-background p-4 rounded-lg border border-theme-border">
              <span className="text-xs font-bold text-purple-400 mb-2 block">PHP</span>
              <code className="text-xs font-mono text-theme-primary">time()</code>
            </div>
            <div className="bg-theme-background p-4 rounded-lg border border-theme-border">
              <span className="text-xs font-bold text-cyan-400 mb-2 block">Go</span>
              <code className="text-xs font-mono text-theme-primary">time.Now().Unix()</code>
            </div>
            <div className="bg-theme-background p-4 rounded-lg border border-theme-border">
              <span className="text-xs font-bold text-red-400 mb-2 block">Ruby</span>
              <code className="text-xs font-mono text-theme-primary">Time.now.to_i</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimestampConverter;

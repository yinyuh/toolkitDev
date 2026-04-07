import React, { useEffect, useState } from 'react';
import { Clock, Calendar, Copy, Check, AlertCircle, Loader2, Zap, BookOpen, Lightbulb } from 'lucide-react';

const createFieldState = (overrides = {}) => ({
  type: 'every',
  start: 0,
  step: 1,
  specific: [],
  ...overrides,
});

const createInitialBuilder = () => ({
  second: createFieldState(),
  minute: createFieldState(),
  hour: createFieldState(),
  day: createFieldState({ start: 1 }),
  month: createFieldState({ start: 1 }),
  week: createFieldState(),
});

const PRESET_COLORS = [
  'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200',
  'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
  'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
  'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
  'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
  'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200',
  'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
  'bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-200',
  'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200',
];

const CRON_TYPES = {
  linux: {
    id: 'linux',
    label: 'Linux Crontab',
    shortLabel: 'Linux',
    placeholder: '* * * * *',
    defaultExpression: '* * * * *',
    fields: [
      { id: 'minute', label: '分钟', range: [0, 59] },
      { id: 'hour', label: '小时', range: [0, 23] },
      { id: 'day', label: '日期', range: [1, 31] },
      { id: 'month', label: '月份', range: [1, 12] },
      { id: 'week', label: '星期', range: [0, 6], valueLabels: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] },
    ],
    featureTitle: 'Linux 定时任务生成器',
    featureDescription: '适用于 crontab、服务器计划任务、容器作业与大多数运维脚本场景，输出标准 5 段 Cron 表达式。',
    helperText: '格式：分 时 日 月 周。适合 Linux、Unix 服务器和大多数云主机 cron 任务。',
    nextRunsDescription: '根据 Linux 5 段表达式预览接下来会触发的时间。',
    aboutText: 'Linux Crontab 使用经典 5 段格式，不包含“秒”字段，适合服务器脚本、日志清理、数据库备份和系统维护等场景。',
    syntaxItems: [
      { char: '*', desc: '任意值', example: '* * * * * 表示每分钟执行一次' },
      { char: ',', desc: '枚举多个时间点', example: '0 9,18 * * * 表示每天 9 点和 18 点执行' },
      { char: '-', desc: '范围选择', example: '0 9-18 * * 1-5 表示工作时间整点执行' },
      { char: '/', desc: '步长频率', example: '*/5 * * * * 表示每 5 分钟执行一次' },
    ],
    examples: [
      { expr: '*/5 * * * *', desc: '每 5 分钟执行' },
      { expr: '0 2 * * *', desc: '每天凌晨 2 点执行' },
      { expr: '0 9 * * 1-5', desc: '工作日上午 9 点执行' },
      { expr: '30 4 1,15 * *', desc: '每月 1 日和 15 日凌晨 4:30 执行' },
    ],
    presets: [
      { name: '每分钟', expression: '* * * * *' },
      { name: '每5分钟', expression: '*/5 * * * *' },
      { name: '每15分钟', expression: '*/15 * * * *' },
      { name: '每小时', expression: '0 * * * *' },
      { name: '每天凌晨2点', expression: '0 2 * * *' },
      { name: '工作日上午9点', expression: '0 9 * * 1-5' },
      { name: '每周日午夜', expression: '0 0 * * 0' },
      { name: '每月1号', expression: '0 0 1 * *' },
    ],
  },
  spring: {
    id: 'spring',
    label: 'Java (Spring)',
    shortLabel: 'Java(Spring)',
    placeholder: '0 * * * * *',
    defaultExpression: '0 * * * * *',
    fields: [
      { id: 'second', label: '秒', range: [0, 59] },
      { id: 'minute', label: '分钟', range: [0, 59] },
      { id: 'hour', label: '小时', range: [0, 23] },
      { id: 'day', label: '日期', range: [1, 31], allowsNone: true },
      { id: 'month', label: '月份', range: [1, 12] },
      { id: 'week', label: '星期', range: [1, 7], allowsNone: true, valueLabels: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] },
    ],
    featureTitle: 'Spring Cron 任务表达式生成器',
    featureDescription: '适用于 Spring Framework、Spring Boot 的 @Scheduled 场景，默认输出 6 段格式，并支持秒级调度与日期/星期二选一配置。',
    helperText: '格式：秒 分 时 日 月 周。Spring 常见场景会使用 6 段表达式，日期和星期通常二选一。',
    nextRunsDescription: '根据 Spring 6 段表达式实时预览下次运行计划，便于校验秒级任务是否准确。',
    aboutText: 'Spring Cron 表达式比 Linux 多一个“秒”字段，适合接口轮询、缓存刷新、消息扫描、定时补偿等开发场景。',
    syntaxItems: [
      { char: '*', desc: '匹配该字段所有时间', example: '0 * * * * * 表示每分钟的第 0 秒执行' },
      { char: '?', desc: '该字段不指定', example: '0 0 9 ? * 2-6 表示工作日上午 9 点执行，日期字段不参与匹配' },
      { char: ',', desc: '多个离散值', example: '0 0 9,18 * * ? 表示每天 9 点和 18 点执行' },
      { char: '/', desc: '按固定步长递增', example: '0 */10 * * * * 表示每 10 分钟执行一次' },
    ],
    examples: [
      { expr: '0 */10 * * * *', desc: '每 10 分钟执行一次' },
      { expr: '0 0 9 * * *', desc: '每天上午 9 点执行' },
      { expr: '0 0 9 ? * 2-6', desc: '工作日上午 9 点执行' },
      { expr: '0 0/30 9-18 * * *', desc: '每天 9:00-18:59 每 30 分钟执行' },
    ],
    presets: [
      { name: '每10秒', expression: '*/10 * * * * *' },
      { name: '每30秒', expression: '*/30 * * * * *' },
      { name: '每10分钟', expression: '0 */10 * * * *' },
      { name: '每小时整点', expression: '0 0 * * * *' },
      { name: '每天9点', expression: '0 0 9 * * *' },
      { name: '每天9点30', expression: '0 30 9 * * *' },
      { name: '工作日上午9点', expression: '0 0 9 ? * 2-6' },
      { name: '工作时段半小时', expression: '0 0/30 9-18 * * *' },
    ],
  },
  quartz: {
    id: 'quartz',
    label: 'Java (Quartz)',
    shortLabel: 'Java(Quartz)',
    placeholder: '0 * * * * ?',
    defaultExpression: '0 * * * * ?',
    fields: [
      { id: 'second', label: '秒', range: [0, 59] },
      { id: 'minute', label: '分钟', range: [0, 59] },
      { id: 'hour', label: '小时', range: [0, 23] },
      { id: 'day', label: '日期', range: [1, 31], allowsNone: true },
      { id: 'month', label: '月份', range: [1, 12] },
      { id: 'week', label: '星期', range: [1, 7], allowsNone: true, valueLabels: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] },
    ],
    featureTitle: 'Quartz 调度表达式生成器',
    featureDescription: '面向 Java Quartz Job/Trigger 场景，输出常用 6 段表达式，支持秒级规则、? 占位和更贴近企业任务中心的调度习惯。',
    helperText: '格式：秒 分 时 日 月 周。当前工具默认生成 Quartz 常用 6 段表达式，适合大多数业务调度任务。',
    nextRunsDescription: '根据 Quartz 表达式展示未来执行计划，方便校验复杂业务调度是否符合预期。',
    aboutText: 'Quartz 常用于企业调度平台、作业中心与 Java 任务系统。相比 Linux 版本，它更强调秒级触发与日期/星期字段的互斥表达。',
    syntaxItems: [
      { char: '*', desc: '匹配任意值', example: '0 * * * * ? 表示每分钟执行一次' },
      { char: '?', desc: '日期或星期字段不指定', example: '0 0 10 ? * 2-6 表示工作日上午 10 点执行' },
      { char: '-', desc: '时间范围', example: '0 0 9-18 ? * 2-6 表示工作日 9 点到 18 点整点执行' },
      { char: '/', desc: '步长调度', example: '0 0/15 * * * ? 表示每 15 分钟执行一次' },
    ],
    examples: [
      { expr: '0 0/15 * * * ?', desc: '每 15 分钟执行一次' },
      { expr: '0 0 10 ? * 2-6', desc: '工作日上午 10 点执行' },
      { expr: '0 0 0 1 * ?', desc: '每月 1 日零点执行' },
      { expr: '0 0/30 8-20 ? * 2-6', desc: '工作日 8-20 点每 30 分钟执行' },
    ],
    presets: [
      { name: '每10秒', expression: '*/10 * * * * ?' },
      { name: '每分钟', expression: '0 * * * * ?' },
      { name: '每15分钟', expression: '0 0/15 * * * ?' },
      { name: '每小时整点', expression: '0 0 0/1 * * ?' },
      { name: '每天10点', expression: '0 0 10 * * ?' },
      { name: '工作日上午10点', expression: '0 0 10 ? * 2-6' },
      { name: '每月1号零点', expression: '0 0 0 1 * ?' },
      { name: '工作日半小时', expression: '0 0/30 8-20 ? * 2-6' },
    ],
  },
};

const normalizeFieldState = (state, range) => {
  const safeStart = Number.isFinite(state.start) ? state.start : range[0];
  const safeStep = Number.isFinite(state.step) && state.step > 0 ? state.step : 1;
  const specific = Array.isArray(state.specific)
    ? [...new Set(state.specific.filter((value) => Number.isFinite(value) && value >= range[0] && value <= range[1]))].sort((a, b) => a - b)
    : [];

  return {
    type: state.type,
    start: Math.min(Math.max(safeStart, range[0]), range[1]),
    step: safeStep,
    specific,
  };
};

const parsePartToState = (part, fieldConfig) => {
  if (part === '?' && fieldConfig.allowsNone) {
    return createFieldState({ type: 'none', start: fieldConfig.range[0] });
  }

  if (part === '*') {
    return createFieldState({ start: fieldConfig.range[0] });
  }

  if (part.includes('/')) {
    const [start, step] = part.split('/');
    const parsedStart = start === '*' ? fieldConfig.range[0] : Number.parseInt(start, 10);
    const parsedStep = Number.parseInt(step, 10);

    if (!Number.isNaN(parsedStep)) {
      return createFieldState({
        type: 'step',
        start: Number.isNaN(parsedStart) ? fieldConfig.range[0] : parsedStart,
        step: parsedStep,
      });
    }
  }

  const tokens = part.split(',');
  const specific = [];

  for (const token of tokens) {
    if (token.includes('-')) {
      const [start, end] = token.split('-').map((value) => Number.parseInt(value, 10));
      if (!Number.isNaN(start) && !Number.isNaN(end)) {
        for (let current = Math.min(start, end); current <= Math.max(start, end); current += 1) {
          specific.push(current);
        }
      }
    } else {
      const value = Number.parseInt(token, 10);
      if (!Number.isNaN(value)) {
        specific.push(value);
      }
    }
  }

  if (specific.length > 0) {
    return createFieldState({ type: 'specific', specific });
  }

  return createFieldState({ start: fieldConfig.range[0] });
};

const buildSpecificValue = (values) => {
  if (values.length === 0) {
    return '*';
  }

  const ranges = [];
  let start = values[0];
  let previous = values[0];

  for (let index = 1; index < values.length; index += 1) {
    const current = values[index];
    if (current !== previous + 1) {
      ranges.push(start === previous ? `${start}` : `${start}-${previous}`);
      start = current;
    }
    previous = current;
  }

  ranges.push(start === previous ? `${start}` : `${start}-${previous}`);
  return ranges.join(',');
};

const optimizeChineseDescription = (desc) => {
  let result = desc;
  result = result.replace('在上午 12:00', '每天午夜执行');
  result = result.replace('在 12:00 AM', '每天午夜执行');
  result = result.replace('在下午 12:00', '每天中午执行');
  result = result.replace('在 12:00 PM', '每天中午执行');
  result = result.replace('在星期日', '每周日');
  result = result.replace('在周日', '每周日');
  result = result.replace('在星期一、二、三、四、五', '每个工作日');
  result = result.replace('每隔 1 分钟', '每分钟');
  result = result.replace('每隔 1 小时', '每小时');
  result = result.replace('每隔 1 天', '每天');
  result = result.replace('仅在', '仅在每');
  return result;
};

const formatRunDate = (date) => {
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return {
    date: date.toLocaleDateString('zh-CN'),
    time: date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    weekDay: weekDays[date.getDay()],
  };
};

const CronGenerator = () => {
  const [expressionType, setExpressionType] = useState('linux');
  const [expression, setExpression] = useState(CRON_TYPES.linux.defaultExpression);
  const [humanReadable, setHumanReadable] = useState('');
  const [nextRuns, setNextRuns] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(CRON_TYPES.linux.fields[0].id);
  const [copied, setCopied] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isManualInput, setIsManualInput] = useState(false);
  const [runCount, setRunCount] = useState(10);
  const [builder, setBuilder] = useState(createInitialBuilder());

  const currentType = CRON_TYPES[expressionType];
  const presets = currentType.presets.map((preset, index) => ({
    ...preset,
    color: PRESET_COLORS[index % PRESET_COLORS.length],
  }));

  const parseExpressionToState = (expr, type = expressionType) => {
    const targetType = CRON_TYPES[type];
    const parts = expr.trim().split(/\s+/);

    if (parts.length !== targetType.fields.length) {
      return;
    }

    const nextBuilder = createInitialBuilder();

    targetType.fields.forEach((field, index) => {
      nextBuilder[field.id] = normalizeFieldState(parsePartToState(parts[index], field), field.range);
    });

    setBuilder(nextBuilder);
  };

  useEffect(() => {
    if (isManualInput) {
      return;
    }

    const nextExpression = currentType.fields
      .map((field) => {
        const state = normalizeFieldState(builder[field.id], field.range);
        if (state.type === 'none' && field.allowsNone) {
          return '?';
        }
        if (state.type === 'every') {
          return '*';
        }
        if (state.type === 'step') {
          return `${state.start === field.range[0] ? '*' : state.start}/${state.step}`;
        }
        if (state.type === 'specific') {
          return buildSpecificValue(state.specific);
        }
        return '*';
      })
      .join(' ');

    if (nextExpression !== expression) {
      setExpression(nextExpression);
    }
  }, [builder, currentType, expression, isManualInput]);

  useEffect(() => {
    let mounted = true;

    const parseCron = async () => {
      const currentExpression = expression.trim();
      if (!currentExpression) {
        setHumanReadable('');
        setNextRuns([]);
        setError(null);
        return;
      }

      setIsCalculating(true);

      try {
        const parts = currentExpression.split(/\s+/);
        if (parts.length !== currentType.fields.length) {
          throw new Error(`${currentType.shortLabel} 表达式必须包含 ${currentType.fields.length} 个字段`);
        }

        const cronstrueModule = await import('cronstrue/i18n');
        const cronstrue = cronstrueModule.default || cronstrueModule;

        const parserModule = await import('cron-parser');
        const CronExpressionParser =
          parserModule.CronExpressionParser ||
          parserModule.default?.CronExpressionParser;

        if (!mounted) {
          return;
        }

        const description = optimizeChineseDescription(
          cronstrue.toString(currentExpression, { locale: 'zh_CN' })
        );

        if (!CronExpressionParser) {
          throw new Error('Cron 解析器加载失败');
        }

        const interval = CronExpressionParser.parse(currentExpression);
        const runs = [];

        for (let index = 0; index < runCount; index += 1) {
          runs.push(interval.next().toDate());
        }

        setHumanReadable(description);
        setNextRuns(runs);
        setError(null);
      } catch (err) {
        if (!mounted) {
          return;
        }
        setHumanReadable('');
        setNextRuns([]);
        setError(`无效的 ${currentType.shortLabel} 表达式：${err.message || '格式错误'}`);
      } finally {
        if (mounted) {
          setIsCalculating(false);
        }
      }
    };

    const timer = setTimeout(parseCron, 300);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [currentType, expression, runCount]);

  const handleCopy = () => {
    navigator.clipboard.writeText(expression);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyPreset = (preset) => {
    setExpression(preset.expression);
    parseExpressionToState(preset.expression, expressionType);
    setIsManualInput(false);
  };

  const handleExpressionChange = (event) => {
    setExpression(event.target.value);
    setIsManualInput(true);
  };

  const handleTypeChange = (type) => {
    const targetType = CRON_TYPES[type];
    setExpressionType(type);
    setActiveTab(targetType.fields[0].id);
    setIsManualInput(false);
    setExpression(targetType.defaultExpression);
    parseExpressionToState(targetType.defaultExpression, type);
  };

  const updateFieldState = (fieldId, nextState) => {
    const fieldConfig = currentType.fields.find((field) => field.id === fieldId);

    if (!fieldConfig) {
      return;
    }

    const normalized = normalizeFieldState(nextState, fieldConfig.range);

    setBuilder((previous) => {
      const nextBuilder = {
        ...previous,
        [fieldId]: normalized,
      };

      if (expressionType !== 'linux' && (fieldId === 'day' || fieldId === 'week')) {
        const counterpartId = fieldId === 'day' ? 'week' : 'day';
        const counterpartConfig = currentType.fields.find((field) => field.id === counterpartId);
        const counterpartState = nextBuilder[counterpartId];

        if (normalized.type === 'none' && counterpartState.type === 'none') {
          nextBuilder[counterpartId] = createFieldState({
            type: 'every',
            start: counterpartConfig.range[0],
          });
        }

        if (normalized.type !== 'none') {
          nextBuilder[counterpartId] = createFieldState({
            type: 'none',
            start: counterpartConfig.range[0],
          });
        }
      }

      return nextBuilder;
    });

    setIsManualInput(false);
  };

  const renderValueLabel = (field, value) => {
    if (!field.valueLabels) {
      return value;
    }

    const labelIndex = value - field.range[0];
    return field.valueLabels[labelIndex] || value;
  };

  const TabContent = ({ field }) => {
    const state = builder[field.id];
    const values = Array.from(
      { length: field.range[1] - field.range[0] + 1 },
      (_, index) => index + field.range[0]
    );

    const toggleSpecific = (value) => {
      const specific = state.specific.includes(value)
        ? state.specific.filter((item) => item !== value)
        : [...state.specific, value];

      updateFieldState(field.id, { ...state, type: 'specific', specific });
    };

    return (
      <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-div-hover transition-colors">
          <input
            type="radio"
            checked={state.type === 'every'}
            onChange={() => updateFieldState(field.id, { ...state, type: 'every', specific: [] })}
            className="w-5 h-5 text-accent border-border-theme focus:ring-accent"
          />
          <span className="text-text-secondary">每{field.label}</span>
        </label>

        {field.id !== 'week' && (
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-div-hover transition-colors">
            <input
              type="radio"
              checked={state.type === 'step'}
              onChange={() => updateFieldState(field.id, { ...state, type: 'step' })}
              className="w-5 h-5 text-accent border-border-theme focus:ring-accent"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-text-secondary">从</span>
              <input
                type="number"
                min={field.range[0]}
                max={field.range[1]}
                value={state.start}
                onChange={(event) =>
                  updateFieldState(field.id, {
                    ...state,
                    type: 'step',
                    start: Number.parseInt(event.target.value, 10) || field.range[0],
                  })
                }
                className="w-16 p-1 border border-border-theme rounded text-center bg-div-secondary"
              />
              <span className="text-text-secondary">{field.label}开始，每隔</span>
              <input
                type="number"
                min="1"
                max={field.range[1]}
                value={state.step}
                onChange={(event) =>
                  updateFieldState(field.id, {
                    ...state,
                    type: 'step',
                    step: Number.parseInt(event.target.value, 10) || 1,
                  })
                }
                className="w-16 p-1 border border-border-theme rounded text-center bg-div-secondary"
              />
              <span className="text-text-secondary">{field.label}执行一次</span>
            </div>
          </label>
        )}

        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-div-hover transition-colors">
          <input
            type="radio"
            checked={state.type === 'specific'}
            onChange={() => updateFieldState(field.id, { ...state, type: 'specific' })}
            className="w-5 h-5 text-accent border-border-theme focus:ring-accent mt-1"
          />
          <div className="flex-1">
            <span className="text-text-secondary block mb-3">指定{field.label}</span>
            <div className={`grid gap-2 ${field.id === 'month' || field.id === 'week' ? 'grid-cols-4 sm:grid-cols-7' : 'grid-cols-6 sm:grid-cols-10 md:grid-cols-12'}`}>
              {values.map((value) => (
                <button
                  key={value}
                  onClick={(event) => {
                    event.preventDefault();
                    toggleSpecific(value);
                  }}
                  className={`px-2 py-1 text-xs rounded border transition-all cursor-pointer ${
                    state.type === 'specific' && state.specific.includes(value)
                      ? 'bg-accent text-white border-accent'
                      : 'bg-div-secondary border-border-theme hover:border-accent text-text-secondary'
                  }`}
                >
                  {renderValueLabel(field, value)}
                </button>
              ))}
            </div>
          </div>
        </label>

        {field.allowsNone && (
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-div-hover transition-colors">
            <input
              type="radio"
              checked={state.type === 'none'}
              onChange={() => updateFieldState(field.id, { ...state, type: 'none', specific: [] })}
              className="w-5 h-5 text-accent border-border-theme focus:ring-accent"
            />
            <div>
              <div className="text-text-secondary">不指定该字段（?）</div>
              <div className="text-xs text-text-secondary/70 mt-1">Java(Spring) 与 Quartz 中，日期和星期通常需要二选一。</div>
            </div>
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="bg-div-theme rounded-2xl shadow-sm border border-border-theme p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>

        <div className="mb-6">
          <div className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">表达式类型</div>
          <div className="flex flex-wrap gap-3">
            {Object.values(CRON_TYPES).map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeChange(type.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  expressionType === type.id
                    ? 'bg-accent text-white shadow-sm'
                    : 'bg-div-secondary text-text-secondary hover:bg-div-hover'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.3fr_0.9fr] gap-6 items-start">
          <div>
            <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Cron 表达式</h2>
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={expression}
                onChange={handleExpressionChange}
                className="text-3xl md:text-4xl font-mono font-bold bg-transparent border-b-2 border-border-theme focus:border-accent outline-none w-full text-text-theme py-2 transition-colors"
                placeholder={currentType.placeholder}
              />
              <button
                onClick={handleCopy}
                className="p-3 bg-div-secondary hover:bg-div-hover rounded-xl transition-colors text-text-secondary cursor-pointer"
                title="复制"
              >
                {copied ? <Check size={24} className="text-green-500" /> : <Copy size={24} />}
              </button>
            </div>
            <p className="mt-3 text-sm text-text-secondary">{currentType.helperText}</p>
          </div>

          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5">
            <h3 className="font-semibold text-text-theme mb-2">{currentType.featureTitle}</h3>
            <p className="text-sm text-text-secondary leading-6">{currentType.featureDescription}</p>
          </div>
        </div>

        <div className="mt-5 min-h-[1.75rem]">
          {error ? (
            <div className="text-red-500 flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          ) : (
            <div className="text-lg text-accent font-medium">
              {isCalculating ? <Loader2 className="animate-spin inline-block" size={20} /> : humanReadable}
            </div>
          )}
        </div>
      </div>

      <div className="bg-div-theme rounded-2xl shadow-sm border border-border-theme p-6 mb-8">
        <h3 className="font-bold text-text-theme mb-2 flex items-center gap-2">
          <Zap size={18} className="text-yellow-500" />
          {currentType.shortLabel} 常用预设
        </h3>
        <p className="text-sm text-text-secondary mb-4">切换表达式类型后，预设、自定义规则、中文说明和接下来运行时间都会同步切换。</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {presets.map((preset, index) => (
            <button
              key={index}
              onClick={() => applyPreset(preset)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 cursor-pointer ${preset.color} ${
                expression === preset.expression ? 'ring-2 ring-offset-2 ring-accent' : ''
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-div-theme rounded-2xl shadow-sm border border-border-theme overflow-hidden mb-8">
        <div className="flex border-b border-border-theme overflow-x-auto">
          {currentType.fields.map((field) => (
            <button
              key={field.id}
              onClick={() => {
                setActiveTab(field.id);
                setIsManualInput(false);
              }}
              className={`flex-1 py-4 px-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === field.id
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-transparent text-text-secondary hover:text-text-theme'
              }`}
            >
              {field.label}
            </button>
          ))}
        </div>
        <div className="p-6">
          {currentType.fields.map((field) => (
            activeTab === field.id ? <TabContent key={field.id} field={field} /> : null
          ))}
        </div>
      </div>

      <div className="bg-div-theme rounded-2xl shadow-sm border border-border-theme p-6 mb-8">
        <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-end mb-4">
          <div>
            <h3 className="font-bold text-text-theme flex items-center gap-2 mb-2">
              <Clock size={18} />
              {currentType.shortLabel} 接下来运行时间
            </h3>
            <p className="text-sm text-text-secondary">{currentType.nextRunsDescription}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary whitespace-nowrap">显示次数</span>
            <select
              value={runCount}
              onChange={(event) => setRunCount(Number.parseInt(event.target.value, 10))}
              className="px-3 py-2 border border-border-theme rounded text-sm bg-div-secondary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="10">10 次</option>
              <option value="20">20 次</option>
              <option value="50">50 次</option>
              <option value="100">100 次</option>
            </select>
            <input
              type="number"
              value={runCount}
              onChange={(event) => {
                const value = Number.parseInt(event.target.value, 10) || 10;
                setRunCount(Math.min(Math.max(value, 1), 100));
              }}
              min="1"
              max="100"
              className="w-20 px-3 py-2 border border-border-theme rounded text-sm bg-div-secondary focus:outline-none focus:ring-2 focus:ring-accent text-center"
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto custom-scrollbar pr-2">
          {isCalculating ? (
            <div className="text-center py-6 text-text-secondary">
              <Loader2 className="animate-spin mx-auto mb-2" />
              计算中...
            </div>
          ) : nextRuns.length > 0 ? (
            nextRuns.map((date, index) => {
              const formatted = formatRunDate(date);
              return (
                <div
                  key={`${formatted.date}-${formatted.time}-${index}`}
                  className={`flex items-center justify-between py-3 ${index < nextRuns.length - 1 ? 'border-b border-border-theme' : ''}`}
                >
                  <div className="w-7 h-7 bg-accent/10 rounded-full flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="text-sm text-text-secondary font-mono text-right">
                    <span>{formatted.date}</span>
                    <span className="mx-1"> </span>
                    <span>{formatted.time}</span>
                    <span className="ml-2 text-accent">({formatted.weekDay})</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-text-secondary py-8">等待计算...</div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-div-theme rounded-2xl shadow-sm border border-border-theme p-6">
        <h3 className="font-bold text-text-theme mb-6 flex items-center gap-2">
          <BookOpen size={20} className="text-accent" />
          关于 {currentType.label} 表达式生成器
        </h3>

        <div className="space-y-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
            <p className="text-text-secondary leading-relaxed">{currentType.aboutText}</p>
          </div>

          <div>
            <h4 className="font-bold text-text-theme mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-accent/10 rounded flex items-center justify-center text-xs text-accent">1</span>
              {currentType.shortLabel} 字段格式
            </h4>
            <div className={`grid gap-2 mb-4 ${currentType.fields.length === 6 ? 'grid-cols-2 md:grid-cols-6' : 'grid-cols-2 md:grid-cols-5'}`}>
              {currentType.fields.map((field, index) => (
                <div key={field.id} className="text-center">
                  <div className={`${['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'][index % 6]} text-white rounded-t-lg py-2 font-bold text-sm`}>
                    *
                  </div>
                  <div className="bg-div-secondary rounded-b-lg py-2">
                    <div className="text-xs text-text-theme font-medium">{field.label}</div>
                    <div className="text-xs text-text-secondary">
                      {field.range[0]}-{field.range[1]}
                      {field.allowsNone ? ' / ?' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-text-theme mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-accent/10 rounded flex items-center justify-center text-xs text-accent">2</span>
              特殊字符与语义
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentType.syntaxItems.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-div-secondary rounded-lg">
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
              {currentType.shortLabel} 常用示例
            </h4>
            <div className="space-y-2">
              {currentType.examples.map((example, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 bg-div-secondary rounded-lg hover:bg-div-hover transition-colors cursor-pointer"
                  onClick={() => applyPreset(example)}
                >
                  <code className="px-3 py-1 bg-accent/10 text-accent rounded font-mono text-sm font-bold">
                    {example.expr}
                  </code>
                  <span className="text-sm text-text-secondary">{example.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border-theme bg-div-secondary">
              <h4 className="font-semibold text-text-theme mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-accent" />
                当前类型适用场景
              </h4>
              <p className="text-sm text-text-secondary leading-6">{currentType.featureDescription}</p>
            </div>
            <div className="p-4 rounded-xl border border-border-theme bg-div-secondary">
              <h4 className="font-semibold text-text-theme mb-2 flex items-center gap-2">
                <Clock size={16} className="text-accent" />
                使用建议
              </h4>
              <p className="text-sm text-text-secondary leading-6">
                部署前请确认目标系统使用的 Cron 规范与当前类型一致。Linux 使用 5 段，Spring 与 Quartz 常用 6 段，字段顺序和支持字符并不完全相同。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CronGenerator;

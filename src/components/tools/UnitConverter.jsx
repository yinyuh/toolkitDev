import React, { useState, useEffect, useMemo } from 'react';
import { 
  Ruler, Weight, Thermometer, Box, Zap, Clock, HardDrive, 
  Activity, Gauge, Droplets, Maximize, Search, Copy, Check 
} from 'lucide-react';

// Polyfill for global variable in browser environment
if (typeof global === 'undefined') {
  window.global = window;
}

// Dynamically import convert-units after polyfill
let convert;
let isLoaded = false;

const loadConvertUnits = async () => {
  if (!isLoaded) {
    const module = await import('convert-units');
    convert = module.default;
    isLoaded = true;
  }
  return convert;
};

const UnitConverter = () => {
  const [measure, setMeasure] = useState('length');
  const [inputValue, setInputValue] = useState('1');
  const [fromUnit, setFromUnit] = useState('m');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUnit, setCopiedUnit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load convert-units library on mount
  useEffect(() => {
    const loadLibrary = async () => {
      try {
        await loadConvertUnits();
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load convert-units:', error);
        setIsLoading(false);
      }
    };
    loadLibrary();
  }, []);

  // Map measures to icons and labels
  const measures = [
    { id: 'length', label: '长度', icon: Ruler },
    { id: 'mass', label: '重量', icon: Weight },
    { id: 'temperature', label: '温度', icon: Thermometer },
    { id: 'area', label: '面积', icon: Maximize },
    { id: 'volume', label: '体积', icon: Box },
    { id: 'speed', label: '速度', icon: Activity },
    { id: 'time', label: '时间', icon: Clock },
    { id: 'digital', label: '存储', icon: HardDrive },
    { id: 'pressure', label: '压强', icon: Gauge },
    { id: 'energy', label: '能量', icon: Zap },
    // Add more as needed
  ];

  // Get all available units for current measure
  const units = useMemo(() => {
    if (!convert) return [];
    try {
      return convert().possibilities(measure);
    } catch (e) {
      return [];
    }
  }, [measure]);

  // Set default fromUnit when measure changes
  useEffect(() => {
    if (convert && units.length > 0) {
      // Set sensible defaults
      const defaults = {
        length: 'm',
        mass: 'kg',
        temperature: 'C',
        area: 'm2',
        volume: 'l',
        speed: 'km/h',
        time: 'min',
        digital: 'MB',
        pressure: 'Pa',
        energy: 'J'
      };
      setFromUnit(defaults[measure] && units.includes(defaults[measure]) ? defaults[measure] : units[0]);
    }
  }, [measure, units]);

  // Calculate conversions
  const conversions = useMemo(() => {
    if (!convert || !inputValue || isNaN(parseFloat(inputValue))) return [];
    
    try {
      // Check if fromUnit is compatible with current measure
      const validUnits = convert().possibilities(measure);
      if (!validUnits.includes(fromUnit)) {
        return [];
      }
      
      return units.map(unit => {
        const val = convert(parseFloat(inputValue)).from(fromUnit).to(unit);
        // Format nicely
        let formatted = val;
        if (Math.abs(val) < 0.000001 || Math.abs(val) > 1000000) {
            formatted = val.toExponential(4);
        } else {
            formatted = parseFloat(val.toPrecision(6));
        }
        
        return {
          unit,
          value: formatted,
          details: convert().describe(unit)
        };
      });
    } catch (e) {
      console.error(e);
      return [];
    }
  }, [inputValue, fromUnit, units, measure]);

  const handleCopy = (text, unit) => {
    navigator.clipboard.writeText(text);
    setCopiedUnit(unit);
    setTimeout(() => setCopiedUnit(null), 1500);
  };

  // Filter measures based on search
  const filteredMeasures = useMemo(() => {
    if (!searchQuery) return measures;
    return measures.filter(m => 
      m.label.includes(searchQuery) || 
      m.id.includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载单位换算库中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Search & Category Navigation */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-secondary" size={20} />
          <input 
            type="text" 
            placeholder="搜索单位类别 (如: 温度, 速度...)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-theme-secondary border border-theme border rounded-xl focus:ring-2 focus:ring-theme-primary focus:border-transparent outline-none text-theme-primary placeholder-theme-secondary"
          />
        </div>

        <div className="flex overflow-x-auto gap-2 py-2 unit-scrollbar">
          {filteredMeasures.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => setMeasure(m.id)}
              className={`flex flex-col items-center min-w-[80px] p-3 rounded-xl transition-all border ${
                measure === m.id
                  ? 'bg-accent text-white border-accent shadow-lg shadow-accent/30 transform scale-105 ring-2 ring-accent/50'
                  : 'bg-theme-secondary text-theme-primary hover:bg-theme-primary/10 border-theme border'
              }`}
            >
              <Icon size={24} className="mb-2" />
              <span className="text-xs font-medium whitespace-nowrap">{m.label}</span>
            </button>
          );
        })}
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-theme-secondary rounded-2xl shadow-sm border border-theme border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              数值
            </label>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full text-4xl font-bold bg-transparent border-b-2 border-theme border focus:border-theme-primary focus:outline-none py-2 text-theme-primary placeholder-theme-secondary"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              基准单位
            </label>
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full p-4 text-lg bg-theme-primary border border-theme border rounded-xl focus:ring-2 focus:ring-theme-primary focus:border-transparent outline-none text-theme-primary"
            >
              {units.map(unit => {
                 const desc = convert().describe(unit);
                 return (
                   <option key={unit} value={unit}>
                     {desc.singular} ({unit})
                   </option>
                 );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {conversions.map((item) => (
          <div 
            key={item.unit}
            className={`relative group p-4 rounded-xl border transition-all hover:shadow-md ${
              item.unit === fromUnit 
                ? 'bg-theme-primary/5 border-theme-primary/30 ring-1 ring-theme-primary/30' 
                : 'bg-theme-secondary border-theme border'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
               <span className="text-xs font-medium text-theme-secondary uppercase">
                  {item.unit}
               </span>
               <button 
                 onClick={() => handleCopy(item.value, item.unit)}
                 className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-theme-secondary hover:text-theme-primary"
                 title="复制结果"
               >
                 {copiedUnit === item.unit ? <Check size={16} /> : <Copy size={16} />}
               </button>
            </div>
            <div className="text-2xl font-bold text-theme-primary truncate" title={item.value}>
              {item.value}
            </div>
            <div className="text-sm text-theme-secondary truncate">
              {item.details.plural}
            </div>
          </div>
        ))}
      </div>


    </div>
  );
};

export default UnitConverter;

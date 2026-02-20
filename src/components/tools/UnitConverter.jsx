import React, { useState, useEffect, useMemo } from 'react';
import convert from 'convert-units';
import { 
  Ruler, Weight, Thermometer, Box, Zap, Clock, HardDrive, 
  Activity, Gauge, Droplets, Maximize, Search, Copy, Check 
} from 'lucide-react';

const UnitConverter = () => {
  const [measure, setMeasure] = useState('length');
  const [inputValue, setInputValue] = useState('1');
  const [fromUnit, setFromUnit] = useState('m');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUnit, setCopiedUnit] = useState(null);

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
    try {
      return convert().possibilities(measure);
    } catch (e) {
      return [];
    }
  }, [measure]);

  // Set default fromUnit when measure changes
  useEffect(() => {
    if (units.length > 0) {
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
    if (!inputValue || isNaN(parseFloat(inputValue))) return [];
    
    try {
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
  }, [inputValue, fromUnit, units]);

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

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Search & Category Navigation */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="搜索单位类别 (如: 温度, 速度...)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-theme-primary focus:border-transparent outline-none"
          />
        </div>

        <div className="flex overflow-x-auto pb-4 gap-2 custom-scrollbar">
          {filteredMeasures.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => setMeasure(m.id)}
              className={`flex flex-col items-center min-w-[80px] p-3 rounded-xl transition-all border ${
                measure === m.id
                  ? 'bg-theme-primary text-white border-theme-primary shadow-lg shadow-theme-primary/30 transform scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700'
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              数值
            </label>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full text-4xl font-bold bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-theme-primary focus:outline-none py-2 text-gray-800 dark:text-gray-100 placeholder-gray-300"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              基准单位
            </label>
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full p-4 text-lg bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-theme-primary focus:border-transparent outline-none"
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
                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
               <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">
                  {item.unit}
               </span>
               <button 
                 onClick={() => handleCopy(item.value, item.unit)}
                 className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-theme-primary"
                 title="复制结果"
               >
                 {copiedUnit === item.unit ? <Check size={16} /> : <Copy size={16} />}
               </button>
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-200 truncate" title={item.value}>
              {item.value}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {item.details.plural}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.3);
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default UnitConverter;

import React, { useState, useCallback } from 'react';
import { Copy, Check, Binary, ChevronDown, Plus, X } from 'lucide-react';

const digits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const validateInput = (value, base) => {
  if (!value) return true;
  const validChars = digits.slice(0, base).toLowerCase();
  const regex = new RegExp(`^[${validChars}]*$`, 'i');
  return regex.test(value);
};

const convertToDecimal = (value, fromBase) => {
  if (!value) return NaN;
  let result = 0;
  value = value.toUpperCase();
  for (let i = 0; i < value.length; i++) {
    const digit = digits.indexOf(value[i]);
    if (digit === -1 || digit >= fromBase) return NaN;
    result = result * fromBase + digit;
  }
  return result;
};

const convertFromDecimal = (decimalValue, toBase) => {
  if (isNaN(decimalValue) || decimalValue < 0) return '';
  if (decimalValue === 0) return '0';
  let result = '';
  let value = decimalValue;
  while (value > 0) {
    result = digits[value % toBase] + result;
    value = Math.floor(value / toBase);
  }
  return result;
};

const BaseConverter = () => {
  const [dec, setDec] = useState('');
  const [bin, setBin] = useState('');
  const [hex, setHex] = useState('');
  const [oct, setOct] = useState('');
  const [base4, setBase4] = useState('');
  const [base32, setBase32] = useState('');
  const [customBases, setCustomBases] = useState([]);
  const [selectedCustomBase, setSelectedCustomBase] = useState(3);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);

  const updateAllBases = useCallback((decimalValue, sourceBase, currentCustomBases) => {
    if (isNaN(decimalValue)) {
      setDec('');
      setBin('');
      setHex('');
      setOct('');
      setBase4('');
      setBase32('');
      currentCustomBases.forEach(cb => cb.setter(''));
      return;
    }

    if (sourceBase !== 10) setDec(decimalValue.toString());
    if (sourceBase !== 2) setBin(convertFromDecimal(decimalValue, 2));
    if (sourceBase !== 16) setHex(convertFromDecimal(decimalValue, 16));
    if (sourceBase !== 8) setOct(convertFromDecimal(decimalValue, 8));
    if (sourceBase !== 4) setBase4(convertFromDecimal(decimalValue, 4));
    if (sourceBase !== 32) setBase32(convertFromDecimal(decimalValue, 32));
    
    currentCustomBases.forEach(cb => {
      if (sourceBase !== cb.base) {
        cb.setter(convertFromDecimal(decimalValue, cb.base));
      }
    });
  }, []);

  const handleInput = useCallback((value, base) => {
    if (!validateInput(value, base)) {
      setError(`无效的${base}进制输入`);
      return;
    }
    setError(null);

    switch (base) {
      case 10:
        setDec(value);
        updateAllBases(value ? parseInt(value) : NaN, 10, customBases);
        break;
      case 2:
        setBin(value);
        updateAllBases(convertToDecimal(value, 2), 2, customBases);
        break;
      case 16:
        setHex(value);
        updateAllBases(convertToDecimal(value, 16), 16, customBases);
        break;
      case 8:
        setOct(value);
        updateAllBases(convertToDecimal(value, 8), 8, customBases);
        break;
      case 4:
        setBase4(value);
        updateAllBases(convertToDecimal(value, 4), 4, customBases);
        break;
      case 32:
        setBase32(value);
        updateAllBases(convertToDecimal(value, 32), 32, customBases);
        break;
      default:
        const customBase = customBases.find(cb => cb.base === base);
        if (customBase) {
          customBase.setter(value);
          updateAllBases(convertToDecimal(value, base), base, customBases);
        }
    }
  }, [customBases, updateAllBases]);

  const handleCopy = useCallback((text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  const addCustomBase = () => {
    if (customBases.some(cb => cb.base === selectedCustomBase)) {
      setError('该进制已存在');
      return;
    }
    if ([2, 4, 8, 10, 16, 32].includes(selectedCustomBase)) {
      setError('该进制已作为默认选项存在');
      return;
    }
    
    const newBase = {
      base: selectedCustomBase,
      value: '',
      setter: (val) => {
        setCustomBases(prev => prev.map(cb => 
          cb.base === selectedCustomBase ? { ...cb, value: val } : cb
        ));
      }
    };
    setCustomBases([...customBases, newBase]);
    setError(null);
  };

  const removeCustomBase = (baseToRemove) => {
    setCustomBases(customBases.filter(cb => cb.base !== baseToRemove));
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="bg-div-secondary rounded-2xl p-8 border border-border-theme shadow-inner">
        {error && (
          <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm text-center font-medium animate-pulse">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Decimal */}
          <div className="relative group">
            <label className="block text-sm font-medium text-text-secondary mb-2 uppercase tracking-wider">
              Decimal (十进制)
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={dec}
                onChange={(e) => handleInput(e.target.value, 10)}
                className="w-full p-4 pr-12 text-lg md:text-xl font-mono bg-div-theme border border-border-theme rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all shadow-sm group-hover:shadow-md"
                placeholder="100"
              />
              <button 
                onClick={() => handleCopy(dec, 10)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-text-secondary hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                title="复制"
              >
                {copied === 10 ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          {/* Binary */}
          <div className="relative group">
            <label className="block text-sm font-medium text-text-secondary mb-2 uppercase tracking-wider">
              Binary (二进制)
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={bin}
                onChange={(e) => handleInput(e.target.value, 2)}
                className="w-full p-4 pr-12 text-lg md:text-xl font-mono bg-div-theme border border-border-theme rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all shadow-sm group-hover:shadow-md"
                placeholder="1100100"
              />
              <button 
                onClick={() => handleCopy(bin, 2)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-text-secondary hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                title="复制"
              >
                {copied === 2 ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          {/* Hexadecimal */}
          <div className="relative group">
            <label className="block text-sm font-medium text-text-secondary mb-2 uppercase tracking-wider">
              Hexadecimal (十六进制)
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={hex}
                onChange={(e) => handleInput(e.target.value, 16)}
                className="w-full p-4 pr-12 text-lg md:text-xl font-mono bg-div-theme border border-border-theme rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all shadow-sm group-hover:shadow-md"
                placeholder="64"
              />
              <button 
                onClick={() => handleCopy(hex, 16)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-text-secondary hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                title="复制"
              >
                {copied === 16 ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          {/* Octal */}
          <div className="relative group">
            <label className="block text-sm font-medium text-text-secondary mb-2 uppercase tracking-wider">
              Octal (八进制)
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={oct}
                onChange={(e) => handleInput(e.target.value, 8)}
                className="w-full p-4 pr-12 text-lg md:text-xl font-mono bg-div-theme border border-border-theme rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all shadow-sm group-hover:shadow-md"
                placeholder="144"
              />
              <button 
                onClick={() => handleCopy(oct, 8)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-text-secondary hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                title="复制"
              >
                {copied === 8 ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          {/* Base-4 */}
          <div className="relative group">
            <label className="block text-sm font-medium text-text-secondary mb-2 uppercase tracking-wider">
              Base-4 (四进制)
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={base4}
                onChange={(e) => handleInput(e.target.value, 4)}
                className="w-full p-4 pr-12 text-lg md:text-xl font-mono bg-div-theme border border-border-theme rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all shadow-sm group-hover:shadow-md"
                placeholder="1210"
              />
              <button 
                onClick={() => handleCopy(base4, 4)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-text-secondary hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                title="复制"
              >
                {copied === 4 ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          {/* Base-32 */}
          <div className="relative group">
            <label className="block text-sm font-medium text-text-secondary mb-2 uppercase tracking-wider">
              Base-32 (三十二进制)
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={base32}
                onChange={(e) => handleInput(e.target.value, 32)}
                className="w-full p-4 pr-12 text-lg md:text-xl font-mono bg-div-theme border border-border-theme rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all shadow-sm group-hover:shadow-md"
                placeholder="34"
              />
              <button 
                onClick={() => handleCopy(base32, 32)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-text-secondary hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                title="复制"
              >
                {copied === 32 ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
          
          {/* Custom Bases */}
          {customBases.map((cb) => (
            <div key={cb.base} className="relative group">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-text-secondary uppercase tracking-wider">
                  Base-{cb.base} ({cb.base}进制)
                </label>
                <button 
                  onClick={() => removeCustomBase(cb.base)}
                  className="text-text-secondary hover:text-red-500 transition-colors"
                  title="移除"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  value={cb.value}
                  onChange={(e) => handleInput(e.target.value, cb.base)}
                  className="w-full p-4 pr-12 text-lg md:text-xl font-mono bg-div-theme border border-border-theme rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all shadow-sm group-hover:shadow-md"
                  placeholder={convertFromDecimal(100, cb.base)}
                />
                <button 
                  onClick={() => handleCopy(cb.value, cb.base)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-text-secondary hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                  title="复制"
                >
                  {copied === cb.base ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Custom Base */}
        <div className="mt-8 pt-6 border-t border-border-theme">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-text-secondary">
              添加自定义进制：
            </label>
            <div className="relative">
              <select 
                value={selectedCustomBase}
                onChange={(e) => setSelectedCustomBase(parseInt(e.target.value))}
                className="appearance-none px-4 py-2 pr-10 bg-div-theme border border-border-theme rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none cursor-pointer"
              >
                {Array.from({ length: 34 }, (_, i) => i + 2).filter(b => ![2, 4, 8, 10, 16, 32].includes(b)).map(base => (
                  <option key={base} value={base}>{base}进制</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary pointer-events-none" />
            </div>
            <button 
              onClick={addCustomBase}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              <Plus size={16} />
              添加
            </button>
          </div>
        </div>

        {/* Visual Bits (Simple 8-bit visualizer for demo) */}
        <div className="mt-12 pt-8 border-t border-border-theme">
           <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
              <Binary size={16} />
              8-Bit 可视化 (低8位)
           </h3>
           <div className="flex justify-center gap-2 md:gap-4 overflow-x-auto pb-2">
              {Array.from({ length: 8 }).map((_, i) => {
                 const bitIndex = 7 - i;
                 const bitValue = (parseInt(dec || 0) >> bitIndex) & 1;
                 return (
                    <button
                       key={bitIndex}
                       onClick={() => {
                          const currentVal = parseInt(dec || 0);
                          const newVal = currentVal ^ (1 << bitIndex);
                          handleInput(newVal.toString(), 10);
                       }}
                       className={`w-10 h-14 md:w-12 md:h-16 rounded-lg flex flex-col items-center justify-center gap-1 transition-all border-2 ${
                          bitValue 
                            ? 'bg-accent border-accent text-white shadow-lg shadow-accent/30 transform -translate-y-1' 
                            : 'bg-div-theme border-border-theme text-text-secondary hover:border-accent'
                       }`}
                    >
                       <span className="text-xl font-bold font-mono">{bitValue}</span>
                       <span className="text-[0.6rem] opacity-60">{Math.pow(2, bitIndex)}</span>
                    </button>
                 );
              })}
           </div>
        </div>
      </div>
    </div>
  );
};

export default BaseConverter;

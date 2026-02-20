import React, { useState, useEffect } from 'react';
import { Copy, Check, ArrowRightLeft, Binary, Calculator } from 'lucide-react';

const BaseConverter = () => {
  const [dec, setDec] = useState('');
  const [bin, setBin] = useState('');
  const [hex, setHex] = useState('');
  const [oct, setOct] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);

  // Validation patterns
  const patterns = {
    dec: /^-?\d*$/,
    bin: /^[01\s]*$/,
    hex: /^[0-9a-fA-F]*$/,
    oct: /^[0-7]*$/
  };

  const handleInput = (value, base) => {
    // Clear all if empty
    if (!value) {
      setDec('');
      setBin('');
      setHex('');
      setOct('');
      setError(null);
      return;
    }

    // Validate input
    if (!patterns[base].test(value.replace(/\s/g, ''))) {
      setError(`无效的${base === 'dec' ? '十' : base === 'bin' ? '二' : base === 'hex' ? '十六' : '八'}进制输入`);
      return;
    }
    setError(null);

    let decimalValue = NaN;

    try {
      switch (base) {
        case 'dec':
          decimalValue = parseInt(value, 10);
          setDec(value);
          break;
        case 'bin':
          const cleanBin = value.replace(/\s/g, '');
          decimalValue = parseInt(cleanBin, 2);
          setBin(value); // Keep spaces if user typed them
          break;
        case 'hex':
          decimalValue = parseInt(value, 16);
          setHex(value);
          break;
        case 'oct':
          decimalValue = parseInt(value, 8);
          setOct(value);
          break;
      }

      if (!isNaN(decimalValue)) {
        if (base !== 'dec') setDec(decimalValue.toString(10));
        if (base !== 'bin') setBin(decimalValue.toString(2).replace(/(.{4})(?=.)/g, '$1 ')); // Add spaces for readability
        if (base !== 'hex') setHex(decimalValue.toString(16).toUpperCase());
        if (base !== 'oct') setOct(decimalValue.toString(8));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text.replace(/\s/g, ''));
    setCopied(type);
    setTimeout(() => setCopied(null), 1500);
  };

  const InputField = ({ label, value, base, placeholder }) => (
    <div className="relative group">
      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <input 
          type="text" 
          value={value}
          onChange={(e) => handleInput(e.target.value, base)}
          className="w-full p-4 pr-12 text-lg md:text-xl font-mono bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-theme-primary focus:border-transparent outline-none transition-all shadow-sm group-hover:shadow-md"
          placeholder={placeholder}
        />
        <button 
          onClick={() => handleCopy(value, base)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-theme-primary transition-colors opacity-0 group-hover:opacity-100"
          title="复制"
        >
          {copied === base ? <Check size={18} /> : <Copy size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 shadow-inner">
        {error && (
          <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm text-center font-medium animate-pulse">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <InputField label="Decimal (十进制)" value={dec} base="dec" placeholder="100" />
          <InputField label="Binary (二进制)" value={bin} base="bin" placeholder="1100100" />
          <InputField label="Hexadecimal (十六进制)" value={hex} base="hex" placeholder="64" />
          <InputField label="Octal (八进制)" value={oct} base="oct" placeholder="144" />
        </div>

        {/* Visual Bits (Simple 8-bit visualizer for demo) */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
           <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
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
                          handleInput(newVal.toString(), 'dec');
                       }}
                       className={`w-10 h-14 md:w-12 md:h-16 rounded-lg flex flex-col items-center justify-center gap-1 transition-all border-2 ${
                          bitValue 
                            ? 'bg-theme-primary border-theme-primary text-white shadow-lg shadow-theme-primary/30 transform -translate-y-1' 
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-400 hover:border-gray-400'
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

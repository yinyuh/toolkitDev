import React, { useState, useEffect } from 'react';
import { Copy, Check, Calculator, Binary } from 'lucide-react';

const BinaryCodeCalculator = () => {
  const [input, setInput] = useState('5');
  const [bits, setBits] = useState(8); // 8, 16, 32
  const [results, setResults] = useState({
    trueForm: '',
    original: '',
    ones: '',
    twos: '',
    hex: ''
  });

  useEffect(() => {
    calculate();
  }, [input, bits]);

  const calculate = () => {
    let num = parseInt(input);
    if (isNaN(num)) {
        setResults({ trueForm: '-', original: '-', ones: '-', twos: '-', hex: '-' });
        return;
    }

    // Check bounds
    const maxVal = Math.pow(2, bits - 1) - 1;
    const minVal = -Math.pow(2, bits - 1);
    
    // Format helper: insert space every 4 chars
    const formatBinary = (str) => str.replace(/(.{4})/g, '$1 ').trim();

    // 1. True Form (Absolute Value in Binary)
    const absNum = Math.abs(num);
    const trueForm = absNum.toString(2);

    // 2. Original Code (Sign-Magnitude)
    // MSB is sign (0 for +, 1 for -), rest is magnitude
    let original = '';
    if (Math.abs(num) > maxVal) {
        original = '溢出 (Overflow)';
    } else {
        const signBit = num >= 0 ? '0' : '1';
        const magnitude = trueForm.padStart(bits - 1, '0');
        original = signBit + magnitude;
    }

    // 3. Ones' Complement
    // Positive: same as original
    // Negative: invert magnitude bits of original (keep sign bit? No, standard def is invert all bits of abs value? 
    // Actually: 
    // Positive: same as binary
    // Negative: invert all bits of positive binary representation
    let ones = '';
    if (Math.abs(num) > maxVal) {
        ones = '溢出 (Overflow)';
    } else {
        if (num >= 0) {
            ones = num.toString(2).padStart(bits, '0');
        } else {
            // Invert all bits of absolute value padded to bits
            const posBin = Math.abs(num).toString(2).padStart(bits, '0');
            ones = posBin.split('').map(b => b === '0' ? '1' : '0').join('');
        }
    }

    // 4. Twos' Complement
    // Positive: same as binary
    // Negative: Ones' Complement + 1
    let twos = '';
    if (num > maxVal || num < minVal) {
        twos = '溢出 (Overflow)';
    } else {
        if (num >= 0) {
            twos = num.toString(2).padStart(bits, '0');
        } else {
            // Use JS bitwise operator (handles two's complement natively)
            // Need to mask to get correct bit width representation
            let twosNum = num >>> 0; // cast to uint32
            // Mask to desired bits
            const mask = (1n << BigInt(bits)) - 1n;
            // Since JS bitwise is 32-bit, we need BigInt for safety if we go larger or just masking
            // For 8/16/32, standard JS works but negative numbers fill MSBs with 1s up to 32
            // We just need to slice the last 'bits' characters
            twos = twosNum.toString(2).slice(-bits).padStart(bits, '0'); // padStart just in case
        }
    }

    // Hex (of Twos Complement)
    let hex = '-';
    if (twos !== '溢出 (Overflow)') {
        hex = parseInt(twos, 2).toString(16).toUpperCase().padStart(bits / 4, '0');
    }

    setResults({
        trueForm: trueForm,
        original: original.includes('Overflow') ? original : formatBinary(original),
        ones: ones.includes('Overflow') ? ones : formatBinary(ones),
        twos: twos.includes('Overflow') ? twos : formatBinary(twos),
        hex: `0x${hex}`
    });
  };

  const ResultCard = ({ title, value, desc }) => (
    <div className="bg-div-secondary rounded-lg p-4 border border-border-theme">
        <div className="flex justify-between items-start mb-2">
            <div>
                <h4 className="font-bold text-text-theme text-sm">{title}</h4>
                <p className="text-xs text-text-secondary mt-0.5">{desc}</p>
            </div>
            <button 
                onClick={() => navigator.clipboard.writeText(value.replace(/\s/g, ''))}
                className="text-text-secondary hover:text-accent transition-colors"
                title="复制"
            >
                <Copy size={16} />
            </button>
        </div>
        <div className="font-mono text-lg md:text-xl text-accent break-all">
            {value}
        </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
       <div className="bg-div-theme rounded-xl shadow-sm border border-border-theme overflow-hidden">
          
          {/* Header & Input */}
          <div className="p-6 md:p-8 border-b border-border-theme bg-div-secondary">
             <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        输入十进制整数
                    </label>
                    <div className="relative">
                        <input 
                            type="number" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-theme bg-div-secondary text-text-theme text-lg font-mono focus:ring-2 focus:ring-accent outline-none transition-all"
                            placeholder="例如: -5"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                            <Calculator size={20} />
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-auto">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        字长 (Bit Depth)
                    </label>
                    <div className="flex bg-div-secondary rounded-xl border border-border-theme p-1">
                        {[8, 16, 32].map(b => (
                            <button
                                key={b}
                                onClick={() => setBits(b)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    bits === b 
                                    ? 'bg-accent text-white shadow-sm' 
                                    : 'text-text-secondary hover:bg-div-hover'
                                }`}
                            >
                                {b}位
                            </button>
                        ))}
                    </div>
                </div>
             </div>
          </div>

          {/* Results */}
          <div className="p-6 md:p-8 grid grid-cols-1 gap-4">
             <ResultCard 
                title="原码 (Sign-Magnitude)" 
                value={results.original}
                desc="最高位为符号位 (0正1负)，其余位表示数值大小"
             />
             <ResultCard 
                title="反码 (Ones' Complement)" 
                value={results.ones}
                desc="正数同原码；负数符号位不变，数值位按位取反"
             />
             <ResultCard 
                title="补码 (Two's Complement)" 
                value={results.twos}
                desc="计算机内部实际存储格式。正数同原码；负数为反码+1"
             />
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
                    <h4 className="font-bold text-blue-800 dark:text-blue-300 text-sm mb-1">真值 (True Form)</h4>
                    <div className="font-mono text-lg text-blue-600 dark:text-blue-400">
                        {input >= 0 ? '+' : '-'}{results.trueForm}
                    </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
                    <h4 className="font-bold text-purple-800 dark:text-purple-300 text-sm mb-1">十六进制 (Hex)</h4>
                    <div className="font-mono text-lg text-purple-600 dark:text-purple-400">
                        {results.hex}
                    </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default BinaryCodeCalculator;

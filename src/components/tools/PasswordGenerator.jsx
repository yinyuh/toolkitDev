import React, { useState, useEffect } from 'react';

const PasswordGenerator = () => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeSimilar: false,
  });
  const [strength, setStrength] = useState(0);
  const [copied, setCopied] = useState(false);

  // Character sets
  const CHAR_SETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-=',
  };

  const SIMILAR_CHARS = 'il1Lo0O';

  useEffect(() => {
    generatePassword();
  }, [length, options]);

  const generatePassword = () => {
    let chars = '';
    
    // Build character pool
    if (options.uppercase) chars += CHAR_SETS.uppercase;
    if (options.lowercase) chars += CHAR_SETS.lowercase;
    if (options.numbers) chars += CHAR_SETS.numbers;
    if (options.symbols) chars += CHAR_SETS.symbols;

    if (options.excludeSimilar) {
      chars = chars.split('').filter(c => !SIMILAR_CHARS.includes(c)).join('');
    }

    if (!chars) {
      setPassword('');
      setStrength(0);
      return;
    }

    // Generate password using crypto.getRandomValues
    let generatedPassword = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      generatedPassword += chars[array[i] % chars.length];
    }

    // Ensure at least one character from each selected set is included (optional strict mode)
    // For now, simple random generation is usually sufficient for distribution

    setPassword(generatedPassword);
    calculateStrength(generatedPassword);
    setCopied(false);
  };

  const calculateStrength = (pwd) => {
    let score = 0;
    if (!pwd) return setStrength(0);

    if (pwd.length > 8) score += 1;
    if (pwd.length > 12) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    // Normalize to 0-4 range for UI
    setStrength(Math.min(4, Math.floor(score / 1.5)));
  };

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOptionChange = (key) => {
    setOptions(prev => {
      const newOptions = { ...prev, [key]: !prev[key] };
      // Prevent unchecking all options
      if (!Object.values(newOptions).some(v => v === true && key !== 'excludeSimilar')) {
        return prev;
      }
      return newOptions;
    });
  };

  const getStrengthColor = () => {
    switch (strength) {
      case 0: return 'bg-gray-200 dark:bg-gray-700';
      case 1: return 'bg-red-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-blue-500';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-200';
    }
  };

  const getStrengthText = () => {
    switch (strength) {
      case 0: return '非常弱';
      case 1: return '弱';
      case 2: return '一般';
      case 3: return '强';
      case 4: return '非常强';
      default: return '';
    }
  };

  return (
    <div className="bg-div-theme rounded-xl shadow-lg border border-div-theme overflow-hidden max-w-2xl mx-auto my-8">
      {/* Result Area */}
      <div className="bg-theme-secondary p-8 text-center relative border-b border-div-theme">
        <div className="relative inline-block w-full max-w-lg">
          <div className="text-3xl md:text-4xl font-mono font-bold text-theme-primary break-all tracking-wider min-h-[3rem] flex items-center justify-center">
            {password || '请选择字符类型'}
          </div>
          <button
            onClick={handleCopy}
            className={`absolute top-1/2 -right-12 -translate-y-1/2 p-2 rounded-lg transition-colors ${
              copied 
                ? 'text-green-500 bg-green-100 dark:bg-green-900/30' 
                : 'text-theme-secondary hover:text-accent hover:bg-accent/10'
            }`}
            title="复制密码"
          >
            {copied ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m2 4v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            )}
          </button>
        </div>
        
        {/* Strength Meter */}
        <div className="mt-6 max-w-xs mx-auto">
          <div className="flex justify-between text-xs text-theme-secondary mb-1">
            <span>密码强度</span>
            <span>{getStrengthText()}</span>
          </div>
          <div className="h-2 bg-theme-secondary rounded-full overflow-hidden flex">
            <div className={`h-full transition-all duration-500 ${getStrengthColor()}`} style={{ width: `${(strength / 4) * 100}%` }}></div>
          </div>
        </div>
      </div>

      {/* Configuration Area */}
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <label className="text-theme-primary font-medium">密码长度: {length}</label>
          </div>
          <input
            type="range"
            min="4"
            max="64"
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value))}
            className="w-full h-2 bg-theme-secondary rounded-lg appearance-none cursor-pointer accent-accent"
          />
          <div className="flex justify-between text-xs text-theme-secondary mt-2">
            <span>4</span>
            <span>32</span>
            <span>64</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <label className="flex items-center p-3 rounded-lg border border-div-theme hover:bg-theme-secondary cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={options.uppercase}
              onChange={() => handleOptionChange('uppercase')}
              className="w-5 h-5 text-accent rounded focus:ring-accent border-theme"
            />
            <span className="ml-3 text-theme-primary">大写字母 (A-Z)</span>
          </label>
          <label className="flex items-center p-3 rounded-lg border border-div-theme hover:bg-theme-secondary cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={options.lowercase}
              onChange={() => handleOptionChange('lowercase')}
              className="w-5 h-5 text-accent rounded focus:ring-accent border-theme"
            />
            <span className="ml-3 text-theme-primary">小写字母 (a-z)</span>
          </label>
          <label className="flex items-center p-3 rounded-lg border border-div-theme hover:bg-theme-secondary cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={options.numbers}
              onChange={() => handleOptionChange('numbers')}
              className="w-5 h-5 text-accent rounded focus:ring-accent border-theme"
            />
            <span className="ml-3 text-theme-primary">数字 (0-9)</span>
          </label>
          <label className="flex items-center p-3 rounded-lg border border-div-theme hover:bg-theme-secondary cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={options.symbols}
              onChange={() => handleOptionChange('symbols')}
              className="w-5 h-5 text-accent rounded focus:ring-accent border-theme"
            />
            <span className="ml-3 text-theme-primary">特殊符号 (!@#$)</span>
          </label>
          <label className="flex items-center p-3 rounded-lg border border-div-theme hover:bg-theme-secondary cursor-pointer transition-colors md:col-span-2">
            <input
              type="checkbox"
              checked={options.excludeSimilar}
              onChange={() => handleOptionChange('excludeSimilar')}
              className="w-5 h-5 text-accent rounded focus:ring-accent border-theme"
            />
            <span className="ml-3 text-theme-primary">排除易混淆字符 (l, 1, O, 0 等)</span>
          </label>
        </div>

        <button
          onClick={generatePassword}
          className="w-full bg-accent hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.001 0 01-15.357-2m15.357 2H15"></path></svg>
          重新生成
        </button>
      </div>
    </div>
  );
};

export default PasswordGenerator;
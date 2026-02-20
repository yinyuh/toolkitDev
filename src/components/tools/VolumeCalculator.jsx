import React, { useState, useEffect } from 'react';
import { Calculator, Box, Circle, Triangle, Cylinder, Cone, Cuboid } from 'lucide-react';

const VolumeCalculator = () => {
  const [shape, setShape] = useState('sphere'); // sphere, cylinder, cone, cube, cuboid
  const [params, setParams] = useState({ r: 5, h: 10, l: 5, w: 5 });
  const [result, setResult] = useState(0);
  const [formula, setFormula] = useState('');

  const shapes = [
    { id: 'sphere', name: '球体 (Sphere)', icon: Circle },
    { id: 'cylinder', name: '圆柱体 (Cylinder)', icon: Cylinder },
    { id: 'cone', name: '圆锥体 (Cone)', icon: Cone },
    { id: 'cube', name: '立方体 (Cube)', icon: Box },
    { id: 'cuboid', name: '长方体 (Cuboid)', icon: Box }, // Reusing Box icon
  ];

  useEffect(() => {
    calculate();
  }, [shape, params]);

  const calculate = () => {
    const { r, h, l, w } = params;
    let vol = 0;
    let form = '';

    switch (shape) {
        case 'sphere':
            vol = (4/3) * Math.PI * Math.pow(r, 3);
            form = 'V = \\frac{4}{3} \\pi r^3';
            break;
        case 'cylinder':
            vol = Math.PI * Math.pow(r, 2) * h;
            form = 'V = \\pi r^2 h';
            break;
        case 'cone':
            vol = (1/3) * Math.PI * Math.pow(r, 2) * h;
            form = 'V = \\frac{1}{3} \\pi r^2 h';
            break;
        case 'cube':
            vol = Math.pow(l, 3);
            form = 'V = a^3';
            break;
        case 'cuboid':
            vol = l * w * h;
            form = 'V = l \\times w \\times h';
            break;
        default:
            vol = 0;
    }
    setResult(vol);
    setFormula(form);
  };

  const handleParamChange = (key, value) => {
    setParams(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Shape Selection */}
          <div className="lg:col-span-3 space-y-2">
             <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">选择形状</h3>
             {shapes.map(s => {
                 const Icon = s.icon;
                 return (
                    <button
                        key={s.id}
                        onClick={() => setShape(s.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                            shape === s.id 
                            ? 'bg-theme-primary text-white shadow-md' 
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                        }`}
                    >
                        <Icon size={20} />
                        <span className="font-medium text-sm">{s.name}</span>
                    </button>
                 );
             })}
          </div>

          {/* Calculator Area */}
          <div className="lg:col-span-9">
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-10 min-h-[500px] flex flex-col md:flex-row gap-10">
                
                {/* Inputs & Visualization */}
                <div className="flex-1 space-y-8">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 pb-4">
                        {shapes.find(s => s.id === shape)?.name}
                    </h3>

                    {/* Inputs based on shape */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {(shape === 'sphere' || shape === 'cylinder' || shape === 'cone') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">半径 (r)</label>
                                <input 
                                    type="number" 
                                    value={params.r}
                                    onChange={(e) => handleParamChange('r', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-theme-primary outline-none"
                                />
                            </div>
                        )}
                        {(shape === 'cylinder' || shape === 'cone' || shape === 'cuboid') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">高度 (h)</label>
                                <input 
                                    type="number" 
                                    value={params.h}
                                    onChange={(e) => handleParamChange('h', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-theme-primary outline-none"
                                />
                            </div>
                        )}
                        {(shape === 'cube' || shape === 'cuboid') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">长度 (l/a)</label>
                                <input 
                                    type="number" 
                                    value={params.l}
                                    onChange={(e) => handleParamChange('l', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-theme-primary outline-none"
                                />
                            </div>
                        )}
                        {shape === 'cuboid' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">宽度 (w)</label>
                                <input 
                                    type="number" 
                                    value={params.w}
                                    onChange={(e) => handleParamChange('w', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-theme-primary outline-none"
                                />
                            </div>
                        )}
                    </div>

                    {/* SVG Visualization */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-8 flex items-center justify-center min-h-[200px] border border-dashed border-gray-200 dark:border-gray-700">
                        {shape === 'sphere' && (
                            <svg width="200" height="200" viewBox="0 0 200 200">
                                <circle cx="100" cy="100" r="80" fill="#60a5fa" fillOpacity="0.2" stroke="#2563eb" strokeWidth="2" />
                                <ellipse cx="100" cy="100" rx="80" ry="20" fill="none" stroke="#2563eb" strokeWidth="1" strokeDasharray="4 4" />
                                <line x1="100" y1="100" x2="180" y2="100" stroke="#ef4444" strokeWidth="2" />
                                <text x="140" y="95" fill="#ef4444" fontSize="14">r</text>
                            </svg>
                        )}
                        {shape === 'cylinder' && (
                            <svg width="200" height="200" viewBox="0 0 200 200">
                                <ellipse cx="100" cy="40" rx="60" ry="20" fill="#60a5fa" fillOpacity="0.2" stroke="#2563eb" strokeWidth="2" />
                                <path d="M40 40 v120 a60 20 0 0 0 120 0 v-120" fill="#60a5fa" fillOpacity="0.2" stroke="#2563eb" strokeWidth="2" />
                                <line x1="100" y1="40" x2="160" y2="40" stroke="#ef4444" strokeWidth="2" />
                                <text x="130" y="35" fill="#ef4444" fontSize="14">r</text>
                                <line x1="170" y1="40" x2="170" y2="160" stroke="#10b981" strokeWidth="2" />
                                <text x="175" y="100" fill="#10b981" fontSize="14">h</text>
                            </svg>
                        )}
                        {shape === 'cone' && (
                            <svg width="200" height="200" viewBox="0 0 200 200">
                                <path d="M100 20 L40 160 a60 20 0 0 0 120 0 Z" fill="#60a5fa" fillOpacity="0.2" stroke="#2563eb" strokeWidth="2" />
                                <ellipse cx="100" cy="160" rx="60" ry="20" fill="none" stroke="#2563eb" strokeWidth="2" />
                                <line x1="100" y1="160" x2="160" y2="160" stroke="#ef4444" strokeWidth="2" />
                                <text x="130" y="155" fill="#ef4444" fontSize="14">r</text>
                                <line x1="100" y1="20" x2="100" y2="160" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" />
                                <text x="105" y="90" fill="#10b981" fontSize="14">h</text>
                            </svg>
                        )}
                        {shape === 'cube' && (
                            <svg width="200" height="200" viewBox="0 0 200 200">
                                <rect x="40" y="60" width="100" height="100" fill="#60a5fa" fillOpacity="0.2" stroke="#2563eb" strokeWidth="2" />
                                <path d="M40 60 L80 20 L180 20 L180 120 L140 160" fill="none" stroke="#2563eb" strokeWidth="2" />
                                <line x1="140" y1="60" x2="180" y2="20" stroke="#2563eb" strokeWidth="2" />
                                <line x1="140" y1="160" x2="140" y2="60" stroke="#2563eb" strokeWidth="2" />
                                <line x1="40" y1="160" x2="140" y2="160" stroke="#ef4444" strokeWidth="2" />
                                <text x="90" y="175" fill="#ef4444" fontSize="14">a</text>
                            </svg>
                        )}
                        {shape === 'cuboid' && (
                            <svg width="200" height="200" viewBox="0 0 200 200">
                                <rect x="40" y="80" width="100" height="80" fill="#60a5fa" fillOpacity="0.2" stroke="#2563eb" strokeWidth="2" />
                                <path d="M40 80 L80 40 L180 40 L180 120 L140 160" fill="none" stroke="#2563eb" strokeWidth="2" />
                                <line x1="140" y1="80" x2="180" y2="40" stroke="#2563eb" strokeWidth="2" />
                                <line x1="140" y1="160" x2="140" y2="80" stroke="#2563eb" strokeWidth="2" />
                                <line x1="40" y1="160" x2="140" y2="160" stroke="#ef4444" strokeWidth="2" />
                                <text x="90" y="175" fill="#ef4444" fontSize="14">l</text>
                                <line x1="140" y1="160" x2="180" y2="120" stroke="#10b981" strokeWidth="2" />
                                <text x="170" y="150" fill="#10b981" fontSize="14">w</text>
                                <line x1="180" y1="120" x2="180" y2="40" stroke="#f59e0b" strokeWidth="2" />
                                <text x="185" y="80" fill="#f59e0b" fontSize="14">h</text>
                            </svg>
                        )}
                    </div>
                </div>

                {/* Results */}
                <div className="w-full md:w-1/3 bg-gray-50 dark:bg-gray-900/30 rounded-xl p-6 border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">计算结果 (体积)</div>
                    <div className="text-4xl font-bold text-theme-primary break-all mb-6">
                        {result.toFixed(2)}
                        <span className="text-lg text-gray-400 ml-2 font-normal">unit³</span>
                    </div>

                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">计算公式</div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 font-mono text-center">
                        {/* Render simple math for now, MathJax is heavy */}
                        {shape === 'sphere' && 'V = 4/3 · π · r³'}
                        {shape === 'cylinder' && 'V = π · r² · h'}
                        {shape === 'cone' && 'V = 1/3 · π · r² · h'}
                        {shape === 'cube' && 'V = a³'}
                        {shape === 'cuboid' && 'V = l · w · h'}
                    </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default VolumeCalculator;

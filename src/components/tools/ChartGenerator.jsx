import React, { useState, useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Download, Plus, Trash2, RefreshCw, Settings, BarChart3 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ChartGenerator = () => {
  const chartRef = useRef(null);
  
  const [title, setTitle] = useState('My Awesome Chart');
  const [xAxisLabel, setXAxisLabel] = useState('Categories');
  const [yAxisLabel, setYAxisLabel] = useState('Values');
  const [dataPoints, setDataPoints] = useState([
    { id: 1, label: 'January', value: 65, color: '#3b82f6' },
    { id: 2, label: 'February', value: 59, color: '#ef4444' },
    { id: 3, label: 'March', value: 80, color: '#10b981' },
    { id: 4, label: 'April', value: 81, color: '#f59e0b' },
    { id: 5, label: 'May', value: 56, color: '#8b5cf6' },
  ]);

  const [options, setOptions] = useState({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        display: true,
      },
      title: {
        display: true,
        text: 'Chart Title',
        font: { size: 20 }
      },
    },
    scales: {
        x: {
            title: {
                display: true,
                text: 'X Axis'
            }
        },
        y: {
            title: {
                display: true,
                text: 'Y Axis'
            },
            beginAtZero: true
        }
    }
  });

  // Update chart options when settings change
  useEffect(() => {
    setOptions(prev => ({
        ...prev,
        plugins: {
            ...prev.plugins,
            title: {
                ...prev.plugins.title,
                text: title
            }
        },
        scales: {
            x: {
                ...prev.scales.x,
                title: {
                    ...prev.scales.x.title,
                    text: xAxisLabel
                }
            },
            y: {
                ...prev.scales.y,
                title: {
                    ...prev.scales.y.title,
                    text: yAxisLabel
                }
            }
        }
    }));
  }, [title, xAxisLabel, yAxisLabel]);

  const chartData = {
    labels: dataPoints.map(d => d.label),
    datasets: [
      {
        label: 'Dataset 1',
        data: dataPoints.map(d => d.value),
        backgroundColor: dataPoints.map(d => d.color),
      },
    ],
  };

  const addDataPoint = () => {
    const newId = Math.max(...dataPoints.map(d => d.id), 0) + 1;
    setDataPoints([...dataPoints, { 
        id: newId, 
        label: `Item ${newId}`, 
        value: Math.floor(Math.random() * 100), 
        color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}` 
    }]);
  };

  const removeDataPoint = (id) => {
    if (dataPoints.length <= 1) return;
    setDataPoints(dataPoints.filter(d => d.id !== id));
  };

  const updateDataPoint = (id, field, value) => {
    setDataPoints(dataPoints.map(d => 
        d.id === id ? { ...d, [field]: value } : d
    ));
  };

  const downloadChart = () => {
    if (chartRef.current) {
        const url = chartRef.current.toBase64Image();
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chart.png';
        a.click();
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Data & Settings */}
          <div className="lg:col-span-4 space-y-6">
              
             {/* General Settings */}
             <div className="bg-div-theme rounded-xl shadow-sm border border-border-theme p-6">
                <h3 className="font-bold text-text-theme mb-4 flex items-center gap-2">
                   <Settings size={20} />
                   图表设置
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">图表标题</label>
                        <input 
                            type="text" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border-theme bg-div-secondary focus:ring-2 focus:ring-accent outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">X轴标签</label>
                            <input 
                                type="text" 
                                value={xAxisLabel}
                                onChange={(e) => setXAxisLabel(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border-theme bg-div-secondary focus:ring-2 focus:ring-accent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Y轴标签</label>
                            <input 
                                type="text" 
                                value={yAxisLabel}
                                onChange={(e) => setYAxisLabel(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border-theme bg-div-secondary focus:ring-2 focus:ring-accent outline-none"
                            />
                        </div>
                    </div>
                </div>
             </div>

             {/* Data Points */}
             <div className="bg-div-theme rounded-xl shadow-sm border border-border-theme p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-text-theme flex items-center gap-2">
                        <BarChart3 size={20} />
                        数据编辑
                    </h3>
                    <button 
                        onClick={addDataPoint}
                        className="p-1.5 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-all cursor-pointer"
                        title="添加数据"
                    >
                        <Plus size={18} />
                    </button>
                </div>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                    {dataPoints.map((point) => (
                        <div key={point.id} className="flex items-center gap-2 p-3 bg-div-secondary rounded-lg border border-border-theme group">
                            <input 
                                type="color" 
                                value={point.color}
                                onChange={(e) => updateDataPoint(point.id, 'color', e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border-none bg-transparent p-0"
                            />
                            <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
                                <input 
                                    type="text" 
                                    value={point.label}
                                    onChange={(e) => updateDataPoint(point.id, 'label', e.target.value)}
                                    className="w-full px-2 py-1 text-sm rounded border border-border-theme bg-div-theme focus:border-accent outline-none"
                                    placeholder="标签"
                                />
                                <input 
                                    type="number" 
                                    value={point.value}
                                    onChange={(e) => updateDataPoint(point.id, 'value', Number(e.target.value))}
                                    className="w-full px-2 py-1 text-sm rounded border border-border-theme bg-div-theme focus:border-accent outline-none"
                                    placeholder="数值"
                                />
                            </div>
                            <button 
                                onClick={() => removeDataPoint(point.id)}
                                className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all opacity-0 group-hover:opacity-100"
                                disabled={dataPoints.length <= 1}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
             </div>
          </div>

          {/* Right: Chart Preview */}
          <div className="lg:col-span-8">
             <div className="bg-div-theme rounded-xl shadow-sm border border-border-theme p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-text-theme">图表预览</h3>
                    <button 
                        onClick={downloadChart}
                        className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-bold hover:bg-accent-hover transition-all shadow-lg shadow-accent/20 cursor-pointer"
                    >
                        <Download size={18} />
                        下载图表
                    </button>
                </div>
                
                <div className="flex-1 min-h-[400px] relative bg-div-secondary rounded-xl p-4 border border-dashed border-border-theme">
                    <Bar ref={chartRef} options={options} data={chartData} />
                </div>
             </div>
          </div>
       </div>


    </div>
  );
};

export default ChartGenerator;

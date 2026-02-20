import React, { useState } from 'react';
import elementsData from '../../data/elements.json';
import { Search, Info, X } from 'lucide-react';

const PeriodicTable = () => {
  const [selectedElement, setSelectedElement] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Categories and their colors
  const categories = {
    "alkali metal": { label: "碱金属", color: "bg-red-200 dark:bg-red-900", border: "border-red-400" },
    "alkaline earth metal": { label: "碱土金属", color: "bg-orange-200 dark:bg-orange-900", border: "border-orange-400" },
    "transition metal": { label: "过渡金属", color: "bg-yellow-200 dark:bg-yellow-900", border: "border-yellow-400" },
    "post-transition metal": { label: "后过渡金属", color: "bg-green-200 dark:bg-green-900", border: "border-green-400" },
    "metalloid": { label: "类金属", color: "bg-teal-200 dark:bg-teal-900", border: "border-teal-400" },
    "diatomic nonmetal": { label: "非金属", color: "bg-blue-200 dark:bg-blue-900", border: "border-blue-400" },
    "polyatomic nonmetal": { label: "多原子非金属", color: "bg-indigo-200 dark:bg-indigo-900", border: "border-indigo-400" },
    "noble gas": { label: "稀有气体", color: "bg-purple-200 dark:bg-purple-900", border: "border-purple-400" },
    "lanthanide": { label: "镧系元素", color: "bg-pink-200 dark:bg-pink-900", border: "border-pink-400" },
    "actinide": { label: "锕系元素", color: "bg-rose-200 dark:bg-rose-900", border: "border-rose-400" },
    "unknown": { label: "未知/其他", color: "bg-gray-200 dark:bg-gray-700", border: "border-gray-400" }
  };

  // Helper to map category to style
  const getCategoryStyle = (category) => {
    // Simplify category matching
    if (category.includes('alkali metal')) return categories['alkali metal'];
    if (category.includes('alkaline earth')) return categories['alkaline earth metal'];
    if (category.includes('transition metal')) return categories['transition metal'];
    if (category.includes('post-transition')) return categories['post-transition metal'];
    if (category.includes('metalloid')) return categories['metalloid'];
    if (category.includes('diatomic nonmetal')) return categories['diatomic nonmetal'];
    if (category.includes('polyatomic nonmetal')) return categories['polyatomic nonmetal']; // Fallback for nonmetals
    if (category.includes('noble gas')) return categories['noble gas'];
    if (category.includes('lanthanide')) return categories['lanthanide'];
    if (category.includes('actinide')) return categories['actinide'];
    return categories['unknown'];
  };

  // Filter elements based on search
  const filteredElements = elementsData.filter(el => 
    el.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    el.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    el.name_zh.includes(searchQuery) ||
    el.number.toString() === searchQuery
  );

  // Render a single cell
  const ElementCell = ({ element }) => {
    if (!element) return <div className="aspect-square"></div>; // Placeholder

    const style = getCategoryStyle(element.category);
    const isDimmed = (hoveredCategory && !element.category.includes(hoveredCategory)) || (searchQuery && !filteredElements.includes(element));

    return (
      <div 
        className={`aspect-square relative p-1 cursor-pointer transition-all duration-200 border 
          ${style.color} ${style.border} 
          ${isDimmed ? 'opacity-20 grayscale' : 'opacity-100 hover:scale-110 hover:z-10 shadow-sm hover:shadow-lg'}
        `}
        onClick={() => setSelectedElement(element)}
        title={`${element.name_zh} (${element.name})`}
      >
        <div className="text-[0.5rem] md:text-xs font-mono text-gray-600 dark:text-gray-300 leading-none">{element.number}</div>
        <div className="flex items-center justify-center h-full -mt-2">
          <div className="text-center">
             <div className="text-sm md:text-xl font-bold text-gray-900 dark:text-white">{element.symbol}</div>
             <div className="text-[0.5rem] md:text-xs text-gray-700 dark:text-gray-200 truncate max-w-full">{element.name_zh}</div>
          </div>
        </div>
      </div>
    );
  };

  // Main grid rendering
  const renderGrid = () => {
    const grid = [];
    // 18 columns, 7 rows (standard periods)
    // We need to map elements to specific grid positions
    // This is a simplified approach, actual layout is tricky with CSS Grid
    
    // Create a 18x7 grid map
    const gridMap = Array(7).fill().map(() => Array(18).fill(null));

    elementsData.forEach(el => {
      if (el.period >= 1 && el.period <= 7) {
          // Adjust group for Lanthanides/Actinides (which are technically group 3 but displayed separately)
          // We handle main table here
          if (el.group >= 1 && el.group <= 18) {
             gridMap[el.period - 1][el.group - 1] = el;
          }
      }
    });

    // Main Table Rows
    return (
      <div className="grid grid-cols-18 gap-1 mb-4">
         {gridMap.map((row, rIndex) => (
            row.map((el, cIndex) => (
              <ElementCell key={`${rIndex}-${cIndex}`} element={el} />
            ))
         ))}
      </div>
    );
  };

  const renderLanthanidesActinides = () => {
    // Lanthanides (Period 6, atomic numbers 57-71)
    const lanthanides = elementsData.filter(el => el.number >= 57 && el.number <= 71);
    // Actinides (Period 7, atomic numbers 89-103)
    const actinides = elementsData.filter(el => el.number >= 89 && el.number <= 103);

    // Need to offset them to align with group 3 (approx)
    // Usually displayed as two rows below
    return (
      <div className="mt-4 space-y-1">
         <div className="grid grid-cols-18 gap-1">
            <div className="col-span-2 text-right pr-2 text-xs text-gray-500 flex items-center justify-end">镧系</div>
            {lanthanides.map(el => <ElementCell key={el.number} element={el} />)}
            <div className="col-span-1"></div>
         </div>
         <div className="grid grid-cols-18 gap-1">
            <div className="col-span-2 text-right pr-2 text-xs text-gray-500 flex items-center justify-end">锕系</div>
            {actinides.map(el => <ElementCell key={el.number} element={el} />)}
            <div className="col-span-1"></div>
         </div>
      </div>
    )
 };

  return (
    <div className="max-w-[1400px] mx-auto p-2 md:p-6 overflow-x-auto">
      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
         {/* Legend */}
         <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(categories).map(([key, style]) => (
               <div 
                  key={key}
                  className={`px-2 py-1 rounded cursor-pointer border ${style.color} ${style.border} ${hoveredCategory === key ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                  onMouseEnter={() => setHoveredCategory(key)}
                  onMouseLeave={() => setHoveredCategory(null)}
               >
                  {style.label}
               </div>
            ))}
         </div>

         {/* Search */}
         <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="搜索元素 (Fe, 铁, 26)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-theme-primary outline-none text-sm"
            />
         </div>
      </div>

      {/* Table Container */}
      <div className="min-w-[800px]">
        {renderGrid()}
        {renderLanthanidesActinides()}
      </div>

      {/* Detail Modal */}
      {selectedElement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSelectedElement(null)}>
           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className={`p-6 ${getCategoryStyle(selectedElement.category).color} relative`}>
                 <button 
                    onClick={() => setSelectedElement(null)}
                    className="absolute top-4 right-4 p-1 bg-white/20 hover:bg-white/40 rounded-full transition-colors text-gray-800 dark:text-gray-100"
                 >
                    <X size={20} />
                 </button>
                 <div className="flex justify-between items-end">
                    <div>
                       <div className="text-6xl font-bold text-gray-900 dark:text-white mb-2">{selectedElement.symbol}</div>
                       <div className="text-2xl font-medium text-gray-800 dark:text-gray-100">{selectedElement.name_zh}</div>
                       <div className="text-lg text-gray-700 dark:text-gray-200">{selectedElement.name}</div>
                    </div>
                    <div className="text-right">
                       <div className="text-4xl font-mono font-bold opacity-50">{selectedElement.number}</div>
                       <div className="text-sm font-mono mt-1">{selectedElement.atomic_mass}</div>
                    </div>
                 </div>
              </div>
              
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                 <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">简介</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                       {selectedElement.summary}
                    </p>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                       <div className="text-xs text-gray-500 mb-1">电子排布</div>
                       <div className="font-mono text-sm font-medium" dangerouslySetInnerHTML={{ __html: selectedElement.electron_configuration.replace(/(\d+)([spdf])(\d+)/g, '$1$2<sup>$3</sup>') }}></div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                       <div className="text-xs text-gray-500 mb-1">分类</div>
                       <div className="font-medium">{getCategoryStyle(selectedElement.category).label}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                       <div className="text-xs text-gray-500 mb-1">发现者</div>
                       <div className="font-medium">{selectedElement.discovered_by}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                       <div className="text-xs text-gray-500 mb-1">发现年份</div>
                       <div className="font-medium">{selectedElement.year}</div>
                    </div>
                 </div>

                 <div className="grid grid-cols-3 gap-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <div className="text-center">
                       <div className="text-xs text-gray-500 mb-1">熔点</div>
                       <div className="font-mono font-bold text-theme-primary">{selectedElement.melt || '-'} K</div>
                    </div>
                    <div className="text-center">
                       <div className="text-xs text-gray-500 mb-1">沸点</div>
                       <div className="font-mono font-bold text-theme-primary">{selectedElement.boil === "Unknown" ? '-' : selectedElement.boil + ' K'}</div>
                    </div>
                    <div className="text-center">
                       <div className="text-xs text-gray-500 mb-1">密度</div>
                       <div className="font-mono font-bold text-theme-primary">{selectedElement.density === "Unknown" ? '-' : selectedElement.density}</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      <style jsx>{`
        .grid-cols-18 {
          display: grid;
          grid-template-columns: repeat(18, minmax(0, 1fr));
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default PeriodicTable;

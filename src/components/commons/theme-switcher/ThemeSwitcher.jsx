import { useState, useEffect } from 'react';

const themes = [
  {
    name: 'light',
    label: '明亮模式',
    icon: '☀️',
    colors: {
      bg: 'bg-theme-background',
      text: 'text-theme-primary',
      primary: 'bg-theme-accent',
      secondary: 'bg-theme-secondary',
      button: 'bg-theme-button text-theme-button-text',
      buttonHover: 'bg-theme-button-hover text-theme-button-text',
      link: 'text-theme-link',
      linkHover: 'text-theme-link-hover'
    }
  },
  {
    name: 'dark',
    label: '暗黑模式',
    icon: '🌙',
    colors: {
      bg: 'bg-theme-background',
      text: 'text-theme-primary',
      primary: 'bg-theme-accent',
      secondary: 'bg-theme-secondary',
      button: 'bg-theme-button text-theme-button-text',
      buttonHover: 'bg-theme-button-hover text-theme-button-text',
      link: 'text-theme-link',
      linkHover: 'text-theme-link-hover'
    }
  }
];

export default function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState('light');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 从localStorage获取保存的主题
    const savedTheme = localStorage.getItem('theme') || 'light';
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (themeName) => {
    const theme = themes.find(t => t.name === themeName) || themes[0];
    
    // 移除所有主题类
    themes.forEach(t => {
      document.documentElement.classList.remove(`theme-${t.name}`);
    });
    
    // 添加当前主题类
    document.documentElement.classList.add(`theme-${themeName}`);
    
    // 设置data-theme属性用于CSS变量
    document.documentElement.setAttribute('data-theme', themeName);
    
    // 保存到localStorage
    localStorage.setItem('theme', themeName);
  };

  const handleThemeChange = (themeName) => {
    setCurrentTheme(themeName);
    applyTheme(themeName);
    setIsOpen(false);
  };

  const currentThemeData = themes.find(t => t.name === currentTheme) || themes[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-theme-secondary text-theme-secondary hover:bg-theme-secondary transition-all duration-200"
        aria-label="切换主题"
      >
        <span className="text-lg">{currentThemeData.icon}</span>
        <span className="hidden sm:block text-sm font-medium">{currentThemeData.label}</span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-40 bg-theme-primary rounded-lg shadow-lg border border-theme-border z-50">
          <div className="p-2">
            {themes.map((theme) => (
              <button
                key={theme.name}
                onClick={() => handleThemeChange(theme.name)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all duration-200 ${
                  currentTheme === theme.name
                    ? 'bg-theme-secondary text-theme-primary'
                    : 'hover:bg-theme-secondary text-theme-secondary'
                }`}
              >
                <span className="text-lg">{theme.icon}</span>
                <span className="flex-1 text-sm font-medium">{theme.label}</span>
                {currentTheme === theme.name && (
                  <svg className="w-4 h-4 text-theme-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
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

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(newTheme);
    applyTheme(newTheme);
  };

  const currentThemeData = themes.find(t => t.name === currentTheme) || themes[0];

  return (
    <div className="relative">
      <button
        onClick={toggleTheme}
        className="flex items-center justify-center p-2 rounded-lg text-theme-secondary hover:bg-theme-secondary/50 transition-all duration-200 cursor-pointer"
        aria-label="切换主题"
        title={`切换到${currentTheme === 'light' ? '暗黑' : '明亮'}模式`}
      >
        <span className="text-lg">{currentThemeData.icon}</span>
      </button>
    </div>
  );
}
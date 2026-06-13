import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const themes = {
  gobunny: {
    name: 'GoBunny',
    primary: '#2B3D7E',
    secondary: '#64748b',
    background: '#fafbfc',
    surface: '#ffffff',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    navbar: '#ffffff',
  },
  light: {
    name: 'Light',
    primary: '#2B3D7E',
    secondary: '#64748b',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#0f172a',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    navbar: '#ffffff',
  },
  dark: {
    name: 'Dark',
    primary: '#5b7fd4',
    secondary: '#94a3b8',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    border: '#334155',
    navbar: '#0f172a',
  },
  blue: {
    name: 'Blue',
    primary: '#1e3a5f',
    secondary: '#64748b',
    background: '#f0f4f8',
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#475569',
    border: '#cbd5e0',
    navbar: '#1e3a5f',
  },
  green: {
    name: 'Green',
    primary: '#059669',
    secondary: '#64748b',
    background: '#f0fdf4',
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#475569',
    border: '#bbf7d0',
    navbar: '#065f46',
  },
  purple: {
    name: 'Purple',
    primary: '#5b21b6',
    secondary: '#64748b',
    background: '#faf5ff',
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#475569',
    border: '#ddd6fe',
    navbar: '#4c1d95',
  },
};

const resolveThemeKey = (saved) => {
  if (!saved || saved === 'ui8') return 'gobunny';
  return themes[saved] ? saved : 'gobunny';
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return resolveThemeKey(localStorage.getItem('theme'));
  });

  useEffect(() => {
    const theme = themes[currentTheme];
    const root = document.documentElement;
    const isDarkTheme = currentTheme === 'dark';
    const isLightNavbar = theme.navbar === '#ffffff' || theme.navbar.toLowerCase() === '#fff';

    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--primary-hover', isDarkTheme ? theme.primary : '#1e2d5f');
    root.style.setProperty('--secondary-color', theme.secondary);
    root.style.setProperty('--background-color', theme.background);
    root.style.setProperty('--surface-color', theme.surface);
    root.style.setProperty('--text-color', theme.text);
    root.style.setProperty('--text-heading', isDarkTheme ? theme.text : '#0f172a');
    root.style.setProperty('--text-secondary-color', theme.textSecondary);
    root.style.setProperty('--border-color', theme.border);
    root.style.setProperty('--navbar-color', theme.navbar);
    root.style.setProperty('--gradient-primary', theme.primary);

    const mesh = isDarkTheme
      ? `linear-gradient(168deg, ${theme.background} 0%, ${theme.surface} 50%, ${theme.background} 100%)`
      : `linear-gradient(180deg, #f8fafc 0%, ${theme.background} 55%, #ffffff 100%)`;

    root.style.setProperty('--mesh-gradient', mesh);

    if (isDarkTheme) {
      root.style.setProperty('--glass-panel-bg', theme.surface);
      root.style.setProperty('--glass-panel-border', 'rgba(148, 163, 184, 0.14)');
      root.style.setProperty('--glass-sidebar-bg', theme.surface);
      root.style.setProperty('--glass-filter-bg', theme.background);
      root.style.setProperty('--glass-table-header', theme.background);
      root.style.setProperty('--surface-muted', theme.background);
    } else {
      root.style.setProperty('--glass-panel-bg', '#ffffff');
      root.style.setProperty('--glass-panel-border', 'rgba(15, 23, 42, 0.08)');
      root.style.setProperty('--glass-sidebar-bg', '#ffffff');
      root.style.setProperty('--glass-filter-bg', '#f8fafc');
      root.style.setProperty('--glass-table-header', '#f8fafc');
      root.style.setProperty('--surface-muted', '#f1f5f9');
    }

    root.dataset.navbarStyle = isLightNavbar ? 'light' : 'dark';

    document.body.style.background = '';
    document.body.style.color = theme.text;

    localStorage.setItem('theme', currentTheme);
  }, [currentTheme]);

  const changeTheme = (themeName) => {
    setCurrentTheme(themeName);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, themes, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

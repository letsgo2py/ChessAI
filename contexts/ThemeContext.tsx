import { createContext, useContext, useState } from 'react';

type ThemeContextType = {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  theme: typeof lightTheme;
};

export const lightTheme = {
  bg: '#fff',
  PrimaryColor: '#007AFF',
  profileSection: '#007AFF',
  settingBg: '#f5f5f5',
  cardBg: '#fff',
  primaryText: '#000000',
  secondaryText: '#888888',
  sectionTitle: '#666666',
  sectionContent: '#fff',
  border: '#f0f0f0',
  iconBg: 'rgba(0,122,255,0.1)',
  timerText: '#333',
};

export const darkTheme = {
  bg: '#121212',
//   PrimaryColor: '#86b9f0',
  PrimaryColor: '#121212',
  profileSection: '#007AFF',
  settingBg: '#121212',
  cardBg: '#1e1e1e',
  primaryText: '#ffffff',
  secondaryText: '#aaaaaa',
  sectionTitle: '#ffffff',
  sectionContent: '#252323',
  border: '#393838',
  iconBg: 'rgba(0,122,255,0.2)',
  timerText: '#a7a7a7',
};

const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  setDarkMode: () => {},
  theme: lightTheme,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(false);
  const theme = darkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for easy usage
export const useTheme = () => useContext(ThemeContext);
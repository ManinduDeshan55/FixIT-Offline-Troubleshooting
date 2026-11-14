import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { ThemeProvider, useTheme } from './src/styles/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeDatabase } from './src/database/database';

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { mode } = useTheme();
  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <SQLiteProvider databaseName="fixit.db" onInit={initializeDatabase}>
        <AppNavigator />
      </SQLiteProvider>
    </>
  );
}

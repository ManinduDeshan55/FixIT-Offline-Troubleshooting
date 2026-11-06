import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeDatabase } from './src/database/database';

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <SQLiteProvider databaseName="fixit.db" onInit={initializeDatabase}>
        <AppNavigator />
      </SQLiteProvider>
    </>
  );
}

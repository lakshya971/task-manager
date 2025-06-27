import React, { createContext, useContext, useEffect, useState } from 'react';
import { DatabaseService } from '../services/database.service';
import { TaskService } from '../services/task.service';
import { Task } from '../types';

interface DatabaseContextType {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  tasks: Task[];
  refreshTasks: () => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  getTaskById: (id: string) => Promise<Task | null>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabaseContext = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabaseContext must be used within a DatabaseProvider');
  }
  return context;
};

interface DatabaseProviderProps {
  children: React.ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔌 Connecting to database...');
      await DatabaseService.connect();
      
      // Test connection
      const health = await DatabaseService.healthCheck();
      console.log('📊 Database health check:', health);
      
      if (health.status === 'healthy') {
        setIsConnected(true);
        console.log('✅ Database connected successfully');
        
        // Load initial data
        await refreshTasks();
      } else {
        throw new Error('Database health check failed');
      }
    } catch (err) {
      console.error('❌ Failed to connect to database:', err);
      setError(err instanceof Error ? err.message : 'Database connection failed');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTasks = async () => {
    try {
      if (!isConnected) {
        console.warn('⚠️ Database not connected, skipping task refresh');
        return;
      }
      
      const allTasks = await TaskService.getAllTasks();
      setTasks(allTasks);
      console.log(`📋 Loaded ${allTasks.length} tasks from database`);
    } catch (err) {
      console.error('❌ Failed to refresh tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    }
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (!isConnected) {
        throw new Error('Database not connected');
      }
      
      const newTask = await TaskService.createTask(taskData);
      setTasks(prev => [newTask, ...prev]);
      console.log('✅ Task created:', newTask.id);
      return newTask;
    } catch (err) {
      console.error('❌ Failed to create task:', err);
      throw err;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      if (!isConnected) {
        throw new Error('Database not connected');
      }
      
      const updatedTask = await TaskService.updateTask(id, updates);
      if (updatedTask) {
        setTasks(prev => prev.map(task => task.id === id ? updatedTask : task));
        console.log('✅ Task updated:', id);
      }
      return updatedTask;
    } catch (err) {
      console.error('❌ Failed to update task:', err);
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      if (!isConnected) {
        throw new Error('Database not connected');
      }
      
      const success = await TaskService.deleteTask(id);
      if (success) {
        setTasks(prev => prev.filter(task => task.id !== id));
        console.log('✅ Task deleted:', id);
      }
      return success;
    } catch (err) {
      console.error('❌ Failed to delete task:', err);
      throw err;
    }
  };

  const getTaskById = async (id: string) => {
    try {
      if (!isConnected) {
        throw new Error('Database not connected');
      }
      
      return await TaskService.getTaskById(id);
    } catch (err) {
      console.error('❌ Failed to get task by ID:', err);
      throw err;
    }
  };

  const value: DatabaseContextType = {
    isConnected,
    isLoading,
    error,
    tasks,
    refreshTasks,
    createTask,
    updateTask,
    deleteTask,
    getTaskById,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

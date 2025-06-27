import { Task, TaskStatus } from '../types';

export class TaskService {
  private static baseURL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3001/api';

  /**
   * Get all tasks
   */
  static async getAllTasks(): Promise<Task[]> {
    try {
      const response = await fetch(`${this.baseURL}/tasks`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const tasks = await response.json();
      return tasks;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  /**
   * Get task by ID
   */
  static async getTaskById(id: string): Promise<Task | null> {
    try {
      const response = await fetch(`${this.baseURL}/tasks/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const task = await response.json();
      return task;
    } catch (error) {
      console.error('Error fetching task by ID:', error);
      return null;
    }
  }

  /**
   * Get tasks by assignee
   */
  static async getTasksByAssignee(assigneeId: string): Promise<Task[]> {
    try {
      const response = await fetch(`${this.baseURL}/tasks?assigneeId=${assigneeId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const tasks = await response.json();
      return tasks;
    } catch (error) {
      console.error('Error fetching tasks by assignee:', error);
      return [];
    }
  }

  /**
   * Get tasks by status
   */
  static async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    try {
      const response = await fetch(`${this.baseURL}/tasks?status=${status}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const tasks = await response.json();
      return tasks;
    } catch (error) {
      console.error('Error fetching tasks by status:', error);
      return [];
    }
  }

  /**
   * Create a new task
   */
  static async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    try {
      const response = await fetch(`${this.baseURL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const newTask = await response.json();
      console.log('Task created successfully:', newTask.id);
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  /**
   * Update a task
   */
  static async updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task | null> {
    try {
      const response = await fetch(`${this.baseURL}/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const updatedTask = await response.json();
      console.log('Task updated successfully:', id);
      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  /**
   * Delete a task
   */
  static async deleteTask(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/tasks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        if (response.status === 404) {
          return false;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Task deleted successfully:', id);
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  /**
   * Get overdue tasks
   */
  static async getOverdueTasks(): Promise<Task[]> {
    try {
      const tasks = await this.getAllTasks();
      const now = new Date();
      
      return tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return dueDate < now && task.status !== 'completed';
      });
    } catch (error) {
      console.error('Error fetching overdue tasks:', error);
      return [];
    }
  }

  /**
   * Get tasks due soon (within next 24 hours)
   */
  static async getTasksDueSoon(): Promise<Task[]> {
    try {
      const tasks = await this.getAllTasks();
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      return tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return dueDate >= now && dueDate <= tomorrow && task.status !== 'completed';
      });
    } catch (error) {
      console.error('Error fetching tasks due soon:', error);
      return [];
    }
  }

  /**
   * Get task statistics
   */
  static async getTaskStats(): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    overdue: number;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/tasks/stats/overview`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const stats = await response.json();
      return {
        total: stats.total,
        completed: stats.completed,
        inProgress: stats.inProgress,
        todo: stats.notStarted, // Map notStarted to todo
        overdue: stats.overdue
      };
    } catch (error) {
      console.error('Error fetching task stats:', error);
      return { total: 0, completed: 0, inProgress: 0, todo: 0, overdue: 0 };
    }
  }

  /**
   * Search tasks
   */
  static async searchTasks(query: string): Promise<Task[]> {
    try {
      const tasks = await this.getAllTasks();
      const lowerQuery = query.toLowerCase();
      
      return tasks.filter(task => 
        task.title.toLowerCase().includes(lowerQuery) ||
        task.description.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Error searching tasks:', error);
      return [];
    }
  }
}

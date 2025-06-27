// Frontend Database Service - Uses API calls to backend instead of direct MongoDB connection
export interface DatabaseConfig {
  apiUrl: string;
}

export interface HealthCheckResponse {
  status: string;
  dbName: string;
  collections: string[];
  message?: string;
}

export class DatabaseService {
  private static config: DatabaseConfig = {
    apiUrl: import.meta.env?.VITE_API_URL || 'http://localhost:3001/api'
  };

  /**
   * Check if backend database is connected
   */
  static async connect(): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiUrl}/health`);
      if (!response.ok) {
        throw new Error(`Backend not available: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Backend database connection verified:', data);
    } catch (error) {
      console.error('Failed to connect to backend database:', error);
      throw error;
    }
  }

  /**
   * Get database health status from backend
   */
  static async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await fetch(`${this.config.apiUrl}/health`);
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        status: 'healthy',
        dbName: data.database || 'taskmanager',
        collections: data.collections || [],
        message: data.message
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        dbName: 'unknown',
        collections: [],
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test backend connectivity
   */
  static async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/ping`);
      return response.ok;
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return false;
    }
  }

  /**
   * Get API base URL
   */
  static getApiUrl(): string {
    return this.config.apiUrl;
  }

  /**
   * Update API URL configuration
   */
  static setApiUrl(url: string): void {
    this.config.apiUrl = url;
  }
}

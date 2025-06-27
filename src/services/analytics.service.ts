import type { 
  DashboardStats, 
  TeamPerformanceMetrics, 
  EmployeePerformanceMetric, 
  TaskAnalytics
} from '../types';

export class AnalyticsService {
  private static baseURL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3001/api';

  /**
   * Get dashboard statistics for a user
   */
  static async getDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      const response = await fetch(`${this.baseURL}/analytics/dashboard/${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
        tasksCompletedToday: 0,
        tasksCompletedThisWeek: 0,
        tasksCompletedThisMonth: 0,
        averageCompletionTime: 0,
        productivityScore: 0
      };
    }
  }

  /**
   * Get team performance metrics
   */
  static async getTeamPerformance(timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<TeamPerformanceMetrics[]> {
    try {
      const response = await fetch(`${this.baseURL}/analytics/team-performance?timeframe=${timeframe}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching team performance:', error);
      return [];
    }
  }

  /**
   * Get individual employee performance
   */
  static async getEmployeePerformance(
    userId: string, 
    timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<EmployeePerformanceMetric | null> {
    try {
      const response = await fetch(`${this.baseURL}/analytics/employee-performance/${userId}?timeframe=${timeframe}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching employee performance:', error);
      return null;
    }
  }

  /**
   * Get task analytics with trends
   */
  static async getTaskAnalytics(
    timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month',
    period: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<TaskAnalytics | null> {
    try {
      const response = await fetch(`${this.baseURL}/analytics/task-trends?timeframe=${timeframe}&period=${period}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      return {
        timeframe: {
          period: timeframe,
          startDate: new Date(data.timeframe.startDate),
          endDate: new Date(data.timeframe.endDate)
        },
        tasksByStatus: data.tasksByStatus,
        tasksByPriority: data.tasksByPriority,
        completionTrends: data.completionTrends,
        performanceByTeam: [], // TODO: Include team performance in trends
        performanceByUser: []  // TODO: Include user performance in trends
      };
    } catch (error) {
      console.error('Error fetching task analytics:', error);
      return null;
    }
  }

  /**
   * Export report as PDF (placeholder - would integrate with actual PDF service)
   */
  static async exportReportAsPDF(reportType: string, data: any): Promise<Blob | null> {
    try {
      // TODO: Implement PDF export functionality
      // This would typically involve sending data to a backend service that generates PDF
      console.log('PDF export requested:', { reportType, data });
      
      // For now, return a placeholder
      const pdfContent = `Report: ${reportType}\nGenerated: ${new Date().toISOString()}\nData: ${JSON.stringify(data, null, 2)}`;
      return new Blob([pdfContent], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      return null;
    }
  }

  /**
   * Export report as Excel (placeholder - would integrate with actual Excel service)
   */
  static async exportReportAsExcel(reportType: string, data: any): Promise<Blob | null> {
    try {
      // TODO: Implement Excel export functionality
      console.log('Excel export requested:', { reportType, data });
      
      // For now, return CSV format as a placeholder
      const csvContent = this.convertToCSV(data);
      return new Blob([csvContent], { type: 'text/csv' });
    } catch (error) {
      console.error('Error exporting Excel:', error);
      return null;
    }
  }

  /**
   * Helper method to convert data to CSV format
   */
  private static convertToCSV(data: any): string {
    if (!data || typeof data !== 'object') {
      return '';
    }

    // Simple CSV conversion for flat objects
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            return typeof value === 'string' ? `"${value}"` : value;
          }).join(',')
        )
      ];
      return csvRows.join('\n');
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Get productivity trends for visualization
   */
  static async getProductivityTrends(
    timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month',
    userId?: string
  ): Promise<Array<{ date: string; productivity: number }>> {
    try {
      // This would be a more sophisticated endpoint that calculates productivity over time
      // userId parameter could be used for individual user trends in future enhancement
      console.log('Fetching productivity trends for user:', userId);
      
      const analytics = await this.getTaskAnalytics(timeframe);
      if (!analytics) return [];

      // Convert completion trends to productivity data
      return analytics.completionTrends.map(trend => ({
        date: trend.date,
        productivity: trend.completed > 0 ? (trend.completed / (trend.created || 1)) * 100 : 0
      }));
    } catch (error) {
      console.error('Error fetching productivity trends:', error);
      return [];
    }
  }
}

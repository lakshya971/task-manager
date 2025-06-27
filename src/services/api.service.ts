import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AuthService } from './auth.service';
import { AuditService } from './audit.service';

// Create axios instance with default configuration
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add JWT token to all requests
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
      try {
        // Get access token from localStorage
        const token = localStorage.getItem('accessToken');
        
        if (token) {
          // Verify token is still valid
          const payload = AuthService.verifyToken(token);
          
          if (payload) {
            // Add token to Authorization header
            config.headers.Authorization = `Bearer ${token}`;
          } else {
            // Token is invalid, try to refresh
            const newToken = await AuthService.refreshToken();
            if (newToken) {
              config.headers.Authorization = `Bearer ${newToken}`;
            } else {
              // Refresh failed, force logout
              await AuthService.forceLogout('Token expired and refresh failed');
              throw new Error('Authentication required');
            }
          }
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = generateRequestId();

        return config;
      } catch (error) {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    },
    (error) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle authentication errors and logging
  client.interceptors.response.use(
    async (response: AxiosResponse): Promise<AxiosResponse> => {
      // Log successful API calls for audit purposes
      await logApiCall(response.config, response.status, 'SUCCESS');
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Handle 401 Unauthorized responses
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Try to refresh the token
          const newToken = await AuthService.refreshToken();
          
          if (newToken) {
            // Update the authorization header and retry the request
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return client(originalRequest);
          } else {
            // Refresh failed, force logout
            await AuthService.forceLogout('Token refresh failed on 401');
            throw new Error('Authentication required');
          }
        } catch (refreshError) {
          console.error('Token refresh error:', refreshError);
          await AuthService.forceLogout('Token refresh error');
          throw refreshError;
        }
      }

      // Handle 403 Forbidden responses
      if (error.response?.status === 403) {
        await logUnauthorizedAccess(originalRequest, error.response.data);
      }

      // Log failed API calls
      await logApiCall(
        originalRequest, 
        error.response?.status || 0, 
        'ERROR', 
        error.message
      );

      return Promise.reject(error);
    }
  );

  return client;
};

// Generate unique request ID for tracking
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Log API calls for audit purposes
const logApiCall = async (
  config: AxiosRequestConfig, 
  status: number, 
  result: 'SUCCESS' | 'ERROR',
  errorMessage?: string
): Promise<void> => {
  try {
    const user = AuthService.getCurrentUser();
    const details: any = {
      method: config.method?.toUpperCase(),
      url: config.url,
      status,
      result,
    };

    if (errorMessage) {
      details.error = errorMessage;
    }

    if (config.data) {
      // Log request data (be careful with sensitive information)
      details.requestSize = JSON.stringify(config.data).length;
    }

    await AuditService.logActivity({
      userId: user?.id || 'anonymous',
      action: result === 'SUCCESS' ? 'API_CALL_SUCCESS' : 'API_CALL_FAILED',
      details,
      ipAddress: 'localhost', // In production, get from server
      userAgent: navigator.userAgent,
    });
  } catch (error) {
    console.error('Failed to log API call:', error);
  }
};

// Log unauthorized access attempts
const logUnauthorizedAccess = async (
  config: AxiosRequestConfig,
  responseData: any
): Promise<void> => {
  try {
    const user = AuthService.getCurrentUser();
    
    await AuditService.logActivity({
      userId: user?.id || 'anonymous',
      action: 'UNAUTHORIZED_ACCESS',
      details: {
        method: config.method?.toUpperCase(),
        url: config.url,
        responseData,
      },
      ipAddress: 'localhost',
      userAgent: navigator.userAgent,
    });
  } catch (error) {
    console.error('Failed to log unauthorized access:', error);
  }
};

// Export the configured API client
export const apiClient = createApiClient();

// Utility functions for common API operations
export class ApiService {
  /**
   * Make a GET request with automatic authentication
   */
  static async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  }

  /**
   * Make a POST request with automatic authentication
   */
  static async post<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Make a PUT request with automatic authentication
   */
  static async put<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Make a DELETE request with automatic authentication
   */
  static async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  }

  /**
   * Upload files with automatic authentication
   */
  static async uploadFile<T = any>(
    url: string, 
    file: File, 
    additionalData?: Record<string, any>
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const response = await apiClient.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Download files with automatic authentication
   */
  static async downloadFile(url: string, filename: string): Promise<void> {
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
}

// Export types for TypeScript support
export type ApiResponse<T = any> = {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
};

export type PaginatedResponse<T = any> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

import { io, Socket } from 'socket.io-client';

export class WebSocketService {
  private static socket: Socket | null = null;
  private static isConnected = false;
  private static reconnectAttempts = 0;
  private static maxReconnectAttempts = 5;
  private static listeners: Map<string, Function[]> = new Map();

  /**
   * Connect to WebSocket server
   */
  static connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const serverUrl = import.meta.env?.VITE_WEBSOCKET_URL || 'http://localhost:3001';
    
    this.socket = io(serverUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 10000,
    });

    this.setupEventHandlers();
  }

  /**
   * Disconnect from WebSocket server
   */
  static disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Emit an event to the server
   */
  static emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected. Cannot emit event:', event);
    }
  }

  /**
   * Subscribe to an event
   */
  static on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)!.push(callback);

    // Also subscribe to the socket event if connected
    if (this.socket) {
      this.socket.on(event, callback as any);
    }

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback);
        if (index !== -1) {
          eventListeners.splice(index, 1);
        }
      }

      if (this.socket) {
        this.socket.off(event, callback as any);
      }
    };
  }

  /**
   * Join a room
   */
  static joinRoom(roomId: string): void {
    this.emit('join_room', { roomId });
  }

  /**
   * Leave a room
   */
  static leaveRoom(roomId: string): void {
    this.emit('leave_room', { roomId });
  }

  /**
   * Join user-specific room for notifications
   */
  static joinUserRoom(userId: string): void {
    this.emit('join_user_room', { userId });
  }

  /**
   * Send typing indicator
   */
  static sendTyping(roomId: string, isTyping: boolean): void {
    this.emit('typing', { roomId, isTyping });
  }

  /**
   * Get connection status
   */
  static isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Get socket ID
   */
  static getSocketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Setup WebSocket event handlers
   */
  private static setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 WebSocket connected:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Re-subscribe to all events
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          this.socket?.on(event, callback as any);
        });
      });

      // Join user room if authenticated
      const user = this.getCurrentUser();
      if (user) {
        this.joinUserRoom(user.id);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, need to reconnect manually
        setTimeout(() => {
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.socket?.connect();
          }
        }, 1000);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔌 WebSocket reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('🔌 WebSocket reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('🔌 WebSocket reconnection failed after maximum attempts');
    });

    // Handle real-time notifications
    this.socket.on('notification', (data) => {
      console.log('📲 Received real-time notification:', data);
      this.notifyListeners('notification', data);
    });

    // Handle task updates
    this.socket.on('task_updated', (data) => {
      console.log('📋 Task updated:', data);
      this.notifyListeners('task_updated', data);
    });

    // Handle user status updates
    this.socket.on('user_status_changed', (data) => {
      console.log('👤 User status changed:', data);
      this.notifyListeners('user_status_changed', data);
    });

    // Handle typing indicators
    this.socket.on('user_typing', (data) => {
      this.notifyListeners('user_typing', data);
    });

    // Handle video call events
    this.socket.on('video_call_invite', (data) => {
      console.log('📹 Video call invite:', data);
      this.notifyListeners('video_call_invite', data);
    });

    this.socket.on('video_call_started', (data) => {
      console.log('📹 Video call started:', data);
      this.notifyListeners('video_call_started', data);
    });

    this.socket.on('video_call_ended', (data) => {
      console.log('📹 Video call ended:', data);
      this.notifyListeners('video_call_ended', data);
    });
  }

  /**
   * Notify all listeners for an event
   */
  private static notifyListeners(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket listener:', error);
        }
      });
    }
  }

  /**
   * Get current user from localStorage
   */
  private static getCurrentUser(): any {
    try {
      const userStr = localStorage.getItem('currentUser');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }
}

// Auto-connect when service is imported
if (typeof window !== 'undefined') {
  WebSocketService.connect();
}

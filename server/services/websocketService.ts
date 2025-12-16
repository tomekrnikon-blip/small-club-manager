/**
 * WebSocket Service for Real-time Notifications
 * 
 * This service provides real-time communication between server and clients.
 * It uses Server-Sent Events (SSE) as a fallback for environments where
 * WebSocket is not available.
 */

type ClientConnection = {
  userId: number;
  clubId?: number;
  send: (data: any) => void;
  close: () => void;
};

type BroadcastEvent = {
  type: 'notification' | 'callup' | 'match_update' | 'training_update' | 'message' | 'sync';
  payload: any;
  timestamp: string;
};

class WebSocketService {
  private clients: Map<string, ClientConnection> = new Map();
  private userConnections: Map<number, Set<string>> = new Map();
  private clubConnections: Map<number, Set<string>> = new Map();

  /**
   * Register a new client connection
   */
  registerClient(
    connectionId: string,
    userId: number,
    clubId: number | undefined,
    send: (data: any) => void,
    close: () => void
  ): void {
    const client: ClientConnection = { userId, clubId, send, close };
    this.clients.set(connectionId, client);

    // Track user connections
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(connectionId);

    // Track club connections
    if (clubId) {
      if (!this.clubConnections.has(clubId)) {
        this.clubConnections.set(clubId, new Set());
      }
      this.clubConnections.get(clubId)!.add(connectionId);
    }

    console.log(`[WebSocket] Client registered: ${connectionId} (user: ${userId}, club: ${clubId})`);
  }

  /**
   * Unregister a client connection
   */
  unregisterClient(connectionId: string): void {
    const client = this.clients.get(connectionId);
    if (!client) return;

    // Remove from user connections
    const userConns = this.userConnections.get(client.userId);
    if (userConns) {
      userConns.delete(connectionId);
      if (userConns.size === 0) {
        this.userConnections.delete(client.userId);
      }
    }

    // Remove from club connections
    if (client.clubId) {
      const clubConns = this.clubConnections.get(client.clubId);
      if (clubConns) {
        clubConns.delete(connectionId);
        if (clubConns.size === 0) {
          this.clubConnections.delete(client.clubId);
        }
      }
    }

    this.clients.delete(connectionId);
    console.log(`[WebSocket] Client unregistered: ${connectionId}`);
  }

  /**
   * Send event to a specific user
   */
  sendToUser(userId: number, event: BroadcastEvent): void {
    const connectionIds = this.userConnections.get(userId);
    if (!connectionIds) return;

    const eventData = JSON.stringify(event);
    connectionIds.forEach((connId) => {
      const client = this.clients.get(connId);
      if (client) {
        try {
          client.send(eventData);
        } catch (err) {
          console.error(`[WebSocket] Failed to send to ${connId}:`, err);
          this.unregisterClient(connId);
        }
      }
    });
  }

  /**
   * Send event to all members of a club
   */
  sendToClub(clubId: number, event: BroadcastEvent): void {
    const connectionIds = this.clubConnections.get(clubId);
    if (!connectionIds) return;

    const eventData = JSON.stringify(event);
    connectionIds.forEach((connId) => {
      const client = this.clients.get(connId);
      if (client) {
        try {
          client.send(eventData);
        } catch (err) {
          console.error(`[WebSocket] Failed to send to ${connId}:`, err);
          this.unregisterClient(connId);
        }
      }
    });
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcast(event: BroadcastEvent): void {
    const eventData = JSON.stringify(event);
    this.clients.forEach((client, connId) => {
      try {
        client.send(eventData);
      } catch (err) {
        console.error(`[WebSocket] Failed to broadcast to ${connId}:`, err);
        this.unregisterClient(connId);
      }
    });
  }

  /**
   * Get connection statistics
   */
  getStats(): { totalConnections: number; uniqueUsers: number; clubsWithConnections: number } {
    return {
      totalConnections: this.clients.size,
      uniqueUsers: this.userConnections.size,
      clubsWithConnections: this.clubConnections.size,
    };
  }

  /**
   * Check if a user is online
   */
  isUserOnline(userId: number): boolean {
    return this.userConnections.has(userId);
  }

  /**
   * Get online users for a club
   */
  getOnlineUsersForClub(clubId: number): number[] {
    const connectionIds = this.clubConnections.get(clubId);
    if (!connectionIds) return [];

    const userIds = new Set<number>();
    connectionIds.forEach((connId) => {
      const client = this.clients.get(connId);
      if (client) {
        userIds.add(client.userId);
      }
    });

    return Array.from(userIds);
  }
}

// Singleton instance
export const websocketService = new WebSocketService();

// Helper functions for common notifications
export function notifyNewCallup(userId: number, callupData: any): void {
  websocketService.sendToUser(userId, {
    type: 'callup',
    payload: { action: 'new', data: callupData },
    timestamp: new Date().toISOString(),
  });
}

export function notifyCallupResponse(clubId: number, callupData: any): void {
  websocketService.sendToClub(clubId, {
    type: 'callup',
    payload: { action: 'response', data: callupData },
    timestamp: new Date().toISOString(),
  });
}

export function notifyMatchUpdate(clubId: number, matchData: any): void {
  websocketService.sendToClub(clubId, {
    type: 'match_update',
    payload: matchData,
    timestamp: new Date().toISOString(),
  });
}

export function notifyTrainingUpdate(clubId: number, trainingData: any): void {
  websocketService.sendToClub(clubId, {
    type: 'training_update',
    payload: trainingData,
    timestamp: new Date().toISOString(),
  });
}

export function notifyNewNotification(userId: number, notification: any): void {
  websocketService.sendToUser(userId, {
    type: 'notification',
    payload: { action: 'new', data: notification },
    timestamp: new Date().toISOString(),
  });
}

export function notifySyncRequired(userId: number, entity: string): void {
  websocketService.sendToUser(userId, {
    type: 'sync',
    payload: { entity },
    timestamp: new Date().toISOString(),
  });
}

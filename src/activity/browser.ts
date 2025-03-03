// src/activity/browser.ts
import { ActivityConfig } from '../core/types';
import { ActivityDetector } from './detector';

// Default events to track for user activity
const DEFAULT_ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart',
  'click',
  'visibilitychange',
];

/**
 * Activity detector implementation for browser environments
 */
export class BrowserActivityDetector extends ActivityDetector {
  private lastActivityTime: number = Date.now();
  private checkInterval: NodeJS.Timeout | null = null;
  private boundEventHandlers: Map<string, EventListener> = new Map();

  /**
   * Start monitoring for activity
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    try {
      // Verify we're in a browser environment
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        throw new Error('Activity detection requires a browser environment');
      }

      // Setup activity event listeners
      const events = this.config.activityEvents || DEFAULT_ACTIVITY_EVENTS;
      
      events.forEach(eventName => {
        const handler = this.handleUserActivity.bind(this);
        this.boundEventHandlers.set(eventName, handler);
        
        // Add the event listener
        if (eventName === 'visibilitychange') {
          document.addEventListener(eventName, handler);
        } else {
          window.addEventListener(eventName, handler);
        }
      });

      // Start the idle check interval
      this.checkInterval = setInterval(
        this.checkIdleStatus.bind(this),
        this.config.detectionInterval
      );
      
      this.isRunning = true;
      this.emit('detector:started');
      
      console.log('[ActivityDetector] Started monitoring user activity');
    } catch (error) {
      console.error('[ActivityDetector] Failed to start:', error);
      throw error;
    }
  }

  /**
   * Stop monitoring for activity
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      // Clear the check interval
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
      
      // Remove event listeners
      this.boundEventHandlers.forEach((handler, eventName) => {
        if (eventName === 'visibilitychange') {
          document.removeEventListener(eventName, handler);
        } else {
          window.removeEventListener(eventName, handler);
        }
      });
      
      this.boundEventHandlers.clear();
      this.isRunning = false;
      this.emit('detector:stopped');
      
      console.log('[ActivityDetector] Stopped monitoring user activity');
    } catch (error) {
      console.error('[ActivityDetector] Failed to stop:', error);
      throw error;
    }
  }

  /**
   * Handle user activity events
   */
  private handleUserActivity(event: Event): void {
    // For visibility change, only consider it activity if becoming visible
    if (event.type === 'visibilitychange') {
      if (document.visibilityState === 'visible') {
        this.recordActivity();
      }
      return;
    }
    
    // Record activity for all other events
    this.recordActivity();
  }

  /**
   * Record user activity
   */
  private recordActivity(): void {
    const now = Date.now();
    const wasIdle = now - this.lastActivityTime > this.config.idleThreshold;
    
    this.lastActivityTime = now;
    
    if (wasIdle) {
      console.log('[ActivityDetector] User returned from idle state');
      
      // Notify all bound streams that the user is active again
      this.streamCallbacks.forEach((callbacks, streamId) => {
        try {
          callbacks.onActive();
          this.emit('activity:active', streamId);
        } catch (error) {
          console.error(`[ActivityDetector] Error in onActive callback for stream ${streamId}:`, error);
        }
      });
    }
  }

  /**
   * Check if the user has gone idle
   */
  private checkIdleStatus(): void {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivityTime;
    
    // Check if user has gone idle
    if (timeSinceLastActivity > this.config.idleThreshold && this.streamCallbacks.size > 0) {
      console.log(`[ActivityDetector] User idle for ${Math.floor(timeSinceLastActivity / 1000)}s`);
      
      // Notify all bound streams that the user is idle
      this.streamCallbacks.forEach((callbacks, streamId) => {
        try {
          callbacks.onIdle();
          this.emit('activity:idle', streamId);
        } catch (error) {
          console.error(`[ActivityDetector] Error in onIdle callback for stream ${streamId}:`, error);
        }
      });
    }
  }
}
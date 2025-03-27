import { EventEmitter } from "events";
import { ActivityConfig } from "../core/types";

// Interface defining callbacks that can be registered for a stream
export interface StreamActivityCallbacks {
  onIdle: () => void;
  onActive: () => void;
}

// Base abstract class for activity detectors

export abstract class ActivityDetector extends EventEmitter {
  protected config: ActivityConfig;
  protected streamCallbacks: Map<string, StreamActivityCallbacks> = new Map();
  protected isRunning: boolean = false;

  constructor(config: ActivityConfig) {
    super();
    this.config = config;
  }


   //sart monitoring for activity
  public abstract start(): Promise<void>;

   //stop monitoring for activity
  public abstract stop(): Promise<void>;


   //update the activity configuration
  public updateConfig(config: Partial<ActivityConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    // Emit config updated event
    this.emit("config:updated", this.config);
  }

  /**
   * Bind activity detection to a specific stream
   */
  public bindToStream(
    streamId: string,
    callbacks: StreamActivityCallbacks
  ): void {
    this.streamCallbacks.set(streamId, callbacks);
    this.emit("stream:bound", streamId);
  }

  /**
   * Unbind activity detection from a stream
   */
  public unbindFromStream(streamId: string): void {
    this.streamCallbacks.delete(streamId);
    this.emit("stream:unbound", streamId);
  }

  /**
   * Check if activity detection is bound to a stream
   */
  public isBoundToStream(streamId: string): boolean {
    return this.streamCallbacks.has(streamId);
  }
}



export class UserActivityDetector {
  private lastActivityTime: number;
  private inactivityTimeout: number;
  private isActive: boolean = true;
  private activityCheckInterval: NodeJS.Timeout | null = null;
  private onInactive: () => void;
  private onActive: () => void;
  
  /**
   * Create a new UserActivityDetector
   * 
   * @param options - Configuration options
   * @param options.inactivityTimeoutMs - Time in milliseconds before considering a user inactive
   * @param options.onInactive - Callback when user becomes inactive
   * @param options.onActive - Callback when user becomes active again
   * @param options.checkIntervalMs - How often to check for inactivity
   */
  constructor(options: {
    inactivityTimeoutMs: number;
    onInactive: () => void;
    onActive: () => void;
    checkIntervalMs?: number;
  }) {
    this.lastActivityTime = Date.now();
    this.inactivityTimeout = options.inactivityTimeoutMs;
    this.onInactive = options.onInactive;
    this.onActive = options.onActive;
    
    // Only setup event listeners if in a browser environment
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
      
      // Start the activity checking interval
      this.activityCheckInterval = setInterval(
        this.checkActivity.bind(this),
        options.checkIntervalMs || 10000 // Default: check every 10 seconds
      );
    }
  }
  
  /**
   * Set up all browser event listeners for activity detection
   */
  private setupEventListeners(): void {
    // Basic activity events
    window.addEventListener('mousemove', this.handleActivity);
    window.addEventListener('mousedown', this.handleActivity);
    window.addEventListener('keypress', this.handleActivity);
    window.addEventListener('touchstart', this.handleActivity);
    window.addEventListener('scroll', this.handleActivity);
    
    // Additional events for better detection
    window.addEventListener('click', this.handleActivity);
    window.addEventListener('focus', this.handleActivity);
    window.addEventListener('blur', () => {
      // Consider blur as potential inactivity, but don't immediately trigger
      setTimeout(this.checkActivity.bind(this), this.inactivityTimeout / 2);
    });
    
    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.handleActivity();
      } else {
        // Tab is hidden, check soon for inactivity
        setTimeout(this.checkActivity.bind(this), this.inactivityTimeout / 2);
      }
    });
    
    // Video/audio specific events for media consumption
    document.addEventListener('play', this.handleActivity, true);
    document.addEventListener('pause', this.handleActivity, true);
    
    // Handle page unload/close
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }
  
  /**
   * Handle user activity events
   */
  private handleActivity = (): void => {
    this.lastActivityTime = Date.now();
    
    if (!this.isActive) {
      this.isActive = true;
      this.onActive();
    }
  };
  
  /**
   * Check if user is inactive based on timeout
   */
  private checkActivity(): void {
    const now = Date.now();
    const inactiveTime = now - this.lastActivityTime;
    
    if (inactiveTime >= this.inactivityTimeout && this.isActive) {
      this.isActive = false;
      this.onInactive();
    }
  }
  
  /**
   * Update inactivity timeout
   * 
   * @param timeoutMs - New timeout in milliseconds
   */
  public updateInactivityTimeout(timeoutMs: number): void {
    this.inactivityTimeout = timeoutMs;
  }
  
  /**
   * Force an activity update
   */
  public forceActivity(): void {
    this.handleActivity();
  }
  
  /**
   * Check if user is currently considered active
   */
  public getIsActive(): boolean {
    return this.isActive;
  }
  
  /**
   * Get time elapsed since last activity in milliseconds
   */
  public getTimeSinceLastActivity(): number {
    return Date.now() - this.lastActivityTime;
  }
  
  /**
   * Clean up all event listeners
   */
  public cleanup(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', this.handleActivity);
      window.removeEventListener('mousedown', this.handleActivity);
      window.removeEventListener('keypress', this.handleActivity);
      window.removeEventListener('touchstart', this.handleActivity);
      window.removeEventListener('scroll', this.handleActivity);
      window.removeEventListener('click', this.handleActivity);
      window.removeEventListener('focus', this.handleActivity);
      
      document.removeEventListener('visibilitychange', this.handleActivity);
      document.removeEventListener('play', this.handleActivity, true);
      document.removeEventListener('pause', this.handleActivity, true);
      
      if (this.activityCheckInterval) {
        clearInterval(this.activityCheckInterval);
        this.activityCheckInterval = null;
      }
    }
  }
}

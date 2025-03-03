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

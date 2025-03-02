// Activity tracking configuration

export interface ActivityConfig {
  idleThreshold: number; //Time in milliseconds after which the user is considered idle
  activityEvents?: string[]; // Events to listen for to detect activity
  detectionInterval: number; // Interval in milliseconds to check for activity
}

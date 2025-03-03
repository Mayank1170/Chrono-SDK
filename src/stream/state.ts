
export class StreamState {
    private startTime: number | null = null; 
    private totalActiveTime: number = 0;
  
    public start(): void {
      if (this.startTime === null) {
        this.startTime = Date.now();
      }
    }
  
    public pause(): void {
      if (this.startTime !== null) {
        this.totalActiveTime += Date.now() - this.startTime; 
        this.startTime = null;
      }
    }
  
    public resume(): void {
      if (this.startTime === null) {
        this.startTime = Date.now();
      }
    }
  
    public getTotalActiveTime(): number {
      if (this.startTime !== null) {
        return Math.floor((this.totalActiveTime + (Date.now() - this.startTime)) / 1000);
      }
      return Math.floor(this.totalActiveTime / 1000);
    }
  
    public reset(): void {
      this.startTime = null;
      this.totalActiveTime = 0;
    }
  }
  
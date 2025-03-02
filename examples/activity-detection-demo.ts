// examples/activity-detection-demo.ts
import { BrowserActivityDetector } from '../src/activity/browser';

// Only run this demo in a browser environment
if (typeof window !== 'undefined') {
  const logElement = document.getElementById('log');
  
  // Helper function to log to the page
  function log(message) {
    console.log(message);
    if (logElement) {
      const entry = document.createElement('div');
      entry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
      logElement.appendChild(entry);
      // Auto-scroll to the bottom
      logElement.scrollTop = logElement.scrollHeight;
    }
  }
  
  // Create and configure the activity detector
  const activityDetector = new BrowserActivityDetector({
    idleThreshold: 10000, // Consider idle after 10 seconds (for demo purposes)
    detectionInterval: 1000, // Check every second
  });
  
  // Set up event listeners
  activityDetector.on('activity:idle', (streamId) => {
    log(`User went idle (stream: ${streamId || 'none'})`);
    document.body.style.backgroundColor = '#ffeeee'; // Light red when idle
  });
  
  activityDetector.on('activity:active', (streamId) => {
    log(`User became active again (stream: ${streamId || 'none'})`);
    document.body.style.backgroundColor = '#eeffee'; // Light green when active
  });
  
  // Bind to a demo stream
  activityDetector.bindToStream('demo-stream', {
    onIdle: () => log('Stream callback: User went idle'),
    onActive: () => log('Stream callback: User became active')
  });
  
  // Start the activity detector
  activityDetector.start()
    .then(() => {
      log('Activity detector started');
      log('Try not interacting for 10 seconds to see idle detection');
    })
    .catch(error => {
      log(`Error starting activity detector: ${error.message}`);
    });
  
  // Add control buttons
  const controlsElement = document.getElementById('controls');
  if (controlsElement) {
    // Button to change idle threshold
    const thresholdButton = document.createElement('button');
    thresholdButton.textContent = 'Set idle threshold to 5 seconds';
    thresholdButton.onclick = () => {
      activityDetector.updateConfig({ idleThreshold: 5000 });
      log('Idle threshold set to 5 seconds');
      thresholdButton.textContent = 'Idle threshold: 5 seconds';
    };
    controlsElement.appendChild(thresholdButton);
    
    // Button to unbind/rebind the stream
    const bindButton = document.createElement('button');
    bindButton.textContent = 'Unbind stream';
    bindButton.onclick = () => {
      if (activityDetector.isBoundToStream('demo-stream')) {
        activityDetector.unbindFromStream('demo-stream');
        log('Stream unbound from activity detection');
        bindButton.textContent = 'Bind stream';
      } else {
        activityDetector.bindToStream('demo-stream', {
          onIdle: () => log('Stream callback: User went idle'),
          onActive: () => log('Stream callback: User became active')
        });
        log('Stream bound to activity detection');
        bindButton.textContent = 'Unbind stream';
      }
    };
    controlsElement.appendChild(bindButton);
  }
}
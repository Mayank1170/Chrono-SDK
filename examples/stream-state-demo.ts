import { StreamState } from "../src/stream/state";

const streamState = new StreamState();

// Simulate starting, pausing, and resuming the stream
console.log("Starting stream...");
streamState.start();

setTimeout(() => {
  console.log("Pausing stream...");
  streamState.pause();
  console.log("Total Active Time after pause:", streamState.getTotalActiveTime(), "seconds");
  setTimeout(() => {
    console.log("Resuming stream...");
    streamState.resume();

    setTimeout(() => {
      console.log("Pausing stream again...");
      streamState.pause();
      console.log("Total Active Time after second pause:", streamState.getTotalActiveTime(), "seconds");
    }, 2000);
  }, 1000);
}, 3000);

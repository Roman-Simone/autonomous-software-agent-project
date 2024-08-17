import { MyData } from "./belief/belief.js";
import { mode } from "./socketConnection.js";
import { Agent } from './intention&revision/agent.js';
import { handshake } from "./communication/coordination.js";
import { optionsLoop } from './intention&revision/options.js'




// If mode is TWO, wait for the other agent to connect
if( mode == 'TWO'){
    console.log("[INFO] ", "Waiting other agents to connect...\n")
    if (await handshake()) {
        console.log("[INFO] ", "Handshake done, my role is: ", MyData.role, "\n")
    }
}

// Create an instance of Agent
const myAgent = new Agent();

// Function to trigger agentLoop when parcels are sensed
myAgent.intentionLoop();

// Call optionLoop every 1 second
setInterval(optionsLoop, 1000);

export { myAgent }

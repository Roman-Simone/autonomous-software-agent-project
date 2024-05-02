import { Agent } from "./agent.js";
import { distance, from_json_to_matrix, find_nearest, client, parcels, me } from "./utils.js";

// Define global variables
var map = [];
var deliveryCoordinates = [];
const beliefset = new Map();

// Function to handle map initialization
await client.onMap((width, height, tiles) => {
    // Convert JSON data to a matrix representation
    map = from_json_to_matrix(width, height, tiles, map);

    console.log("Map initialized: ", map);

    // Extract delivery coordinates from tiles
    deliveryCoordinates = tiles.filter(t => t.delivery).map(t => ({x: t.x, y: t.y}));

    console.log("Delivery coordinates: ", deliveryCoordinates);
});

// Function to update beliefset when agents are sensed
client.onAgentsSensing(agents => {
    // Update beliefset with new agent information
    for (let a of agents) {
        console.log("New agent sensed: ", a.id, a.x, a.y, a.score)
        beliefset.set(a.id, a);
    }
});



function agentLoop() {
    // Array to store potential intention options
    const options = [];
    // Iterate through available parcels
    for (const [id, parcel] of parcels.entries()) {
        // Check if parcel is not carried by any agent
        if (!parcel.carriedBy) {
            let score = parcel.reward;
            // Calculate intrinsic score of the parcel
            let intrinsic_score = score - distance(parcel, me) - distance(parcel, find_nearest(parcel.x, parcel.y, map)[2]);
            // Consider parcel only if intrinsic score is positive
            if (intrinsic_score > 0) {
                // Calculate utility of picking up the parcel
                let util = intrinsic_score;
                // Adjust utility based on distance from agents in beliefset
                if (beliefset.size > 0) {
                    let min_score_parcel_agent = Number.MAX_VALUE;
                    for (let a of beliefset.values()) {
                        let score_parcel_agent = distance(a, parcel);
                        if (score_parcel_agent < min_score_parcel_agent) {
                            min_score_parcel_agent = score_parcel_agent;
                        }
                    }
                    util += min_score_parcel_agent;
                }

                console.log("Parcel: ", parcel, " - utility: ", util);
                // Add option to options array
                options.push({
                    desire: 'go_pick_up',
                    args: [parcel],
                    utility: util
                });
            }
        }
    }

    /**
     * Select best intention from available options
     */
    let best_option = null;
    let highest_utility = Number.MIN_VALUE;
    for (const option of options) {
        let parcel = option.args[0];
        let util = option.utility;
        const dist = distance(me, parcel);
        // Select option with nearest distance and a reward score greater than 2
        if (util > 2 && util > highest_utility) {
            highest_utility = util;
            best_option = option;
        }
    }

    /**
     * Revise/queue intention if a best option is found
     */
    if (best_option) {
        console.log("Pushing best option: ", best_option);

        // Push best option to agent intention queue
        myAgent.push(best_option.desire, ...best_option.args, best_option.utility); 
        myAgent.push('go_put_down', []);
    }
}

// Function to trigger agentLoop when parcels are sensed
client.onParcelsSensing(agentLoop);

// Create an instance of Agent
const myAgent = new Agent();

// Start intention loop of the agent
myAgent.intentionLoop();

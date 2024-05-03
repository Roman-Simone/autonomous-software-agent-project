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

    // console.log("Map initialized: ", map);

    // Extract delivery coordinates from tiles
    deliveryCoordinates = tiles.filter(t => t.delivery).map(t => ({x: t.x, y: t.y}));

    // console.log("Delivery coordinates: ", deliveryCoordinates);
});

// Function to update beliefset when agents are sensed
client.onAgentsSensing(agents => {
    // Update beliefset with new agent information
    for (let a of agents) {
        // console.log("New agent sensed: ", a.id, a.x, a.y, a.score)
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

                // console.log("Parcel: ", parcel, " - utility: ", util);
                // Add option to options array
                // options.push({
                //     desire: 'go_pick_up',
                //     args: [parcel],
                //     utility: score
                // });
                options.push( [ 'go_pick_up', parcel.x, parcel.y, parcel.id, score ] )
            }
        }
    }

    /**
     * Select best intention from available options
     */

    let best_option = null;
    for (const option of options) {
            best_option = option;
            myAgent.push(best_option);
    
    }


    if (myAgent.intention_queue.some(item => item.predicate[0] === "go_put_down")) {
        const item  = myAgent.intention_queue.find(item => item.predicate[0] === "go_put_down");

        if (item) 
            // console.log("Item found: ", item);THERE WE WILL CHANGE ACCORDING TO HOW MANY PARCELS HAS PLAYER IN HIS HEAD
            var utility = item.predicate[4] + 5;
    
        myAgent.intention_queue = myAgent.intention_queue.filter(item => item.predicate[0] !== "go_put_down");
        
        console.log("\n\n\nChanging utility from ", item.predicate[4], " to ", utility, " for go_put_down action.\n\n\n")

        myAgent.push( [ 'go_put_down', "", "", "", utility ] )
        
    } else {
        myAgent.push( [ 'go_put_down', "", "", "", 0 ] )
    }


    /**
     * Revise/queue intention if a best option is found
     */
    // if (best_option) {
    //     // console.log("Pushing best option: ", best_option);

    //     // Push best option to agent intention queue
    //     myAgent.push(best_option.desire, ...best_option.args, best_option.utility); 
    //     // myAgent.push('go_put_down', []);
    // }
}

// Function to trigger agentLoop when parcels are sensed
client.onParcelsSensing(agentLoop);

// Create an instance of Agent
const myAgent = new Agent();

// Start intention loop of the agent
myAgent.intentionLoop();

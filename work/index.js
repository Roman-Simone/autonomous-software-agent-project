import { Agent } from "./agent.js";
import { distance, from_json_to_matrix, find_nearest, client, parcels, me, map, distanceBFS } from "./utils.js";

// Define global variables
const beliefset = new Map();

var utilityPutDown = 0;

// go_pick_up UTILITY PARAMETERS
const ALPHA = 0.7;              // score weigth
const BETA = 1;                 // distance weigth

// go_put_down UTILITY PARAMETERS
const GAMMA = 0.8;             // score weigth
const DELTA = 1;                // distance weigth
const MULT = 1 / 2;

// here I want to implement f(score, distance) = alpha*score + beta/distance + min(distance(agent, parcel))
function calculate_pickup_utility(parcel) {

    if (!parcel.carriedBy && parcel.reward > 3) {
        let score = parcel.reward;

        var intrinsic_score = ALPHA * score + BETA / (distance(parcel, me) + distance(parcel, find_nearest(parcel.x, parcel.y, map)[2]));

        // Consider parcel only if intrinsic score is positive
        if (intrinsic_score > 0) {
            // Calculate utility of picking up the parcel
            var util = intrinsic_score;
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

        } else {
            return 0;
        }
        return util;
    } else {
        return 0;
    }
}

function calculate_putdown_utility() {

    if (myAgent.parcelsInMind.length == 0)
        return 0;

    var scoreInMind = 0;
    for (let p of myAgent.parcelsInMind) {
        for (const [id, parcel] of parcels.entries()) {
            if (p === id) {
                scoreInMind += parcel.reward;
            }
        }
    }
    var utility = (GAMMA * scoreInMind + DELTA / (distance(me, find_nearest(me.x, me.y, map)[2]))) * MULT;

    return utility;
}

// Function to update beliefset when agents are sensed
client.onAgentsSensing(agents => {
    // Update beliefset with new agent information
    for (let a of agents) {
        beliefset.set(a.id, a);
    }
});



function agentLoop() {
    // Array to store potential intention options
    const options = [];
    console.log("Options BEFORE: ", options)

    // Iterate through available parcels
    for (const [id, parcel] of parcels.entries()) {
        if (!parcel.carriedBy && parcel.reward > 3) {
            // Check if parcel is not carried by any agent
            let util = calculate_pickup_utility(parcel);                    // se == 0 intrinsic_score < 0 --> non ne vale la pena
            if (util) {
                options.push(['go_pick_up', parcel.x, parcel.y, id, util]);
            }

        }
    }
    options.push(['go_put_down', "", "", "", calculate_putdown_utility()])
    let u = 2
    options.push(['go_random_delivery', "", "", "", u]);

    console.log("Options LATER: ", options)

    /**
     * Select best intention from available options
     */
    let best_option;
    let bestUtility = -1.0;
    for (const option of options) {
        let current_utility = option[4];
        if (current_utility > bestUtility) {

            best_option = option
            bestUtility = current_utility
        }
    }

    myAgent.push(best_option);
}



// Call agentLoop every 2 seconds
setInterval(agentLoop, 2000);


// Function to trigger agentLoop when parcels are sensed
client.onParcelsSensing(agentLoop);

// Create an instance of Agent
const myAgent = new Agent();

// Start intention loop of the agent
myAgent.intentionLoop();

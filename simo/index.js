import { Agent } from "./agent.js";
import { distance, from_json_to_matrix, find_nearest, client, parcels, me, map, distanceBFS } from "./utils.js";

// Define global variables
const beliefset = new Map();
var utilityPutDown = 0;

const k = 1;                // costante per il calcolo della go_put_down utility

// here I want to implement f(score, distance) = alpha*score + beta/distance
function calculate_pickup_utility(parcel) {
    if (!parcel.carriedBy && parcel.reward > 3) {
        let score = parcel.reward;
        // Calculate intrinsic score of the parcel
        var me_parcel = distance(parcel, me) < 3;                       // true se sono vicino al parcel  
        var parcel_delivery = distance(parcel, find_nearest(parcel.x, parcel.y, map)[2]) < 3;           // true se parcel è vicinno dal delivery
        if (me_parcel && parcel_delivery)
            var intrinsic_score = score + 4 * distance(parcel, me) + 4 * distance(parcel, find_nearest(parcel.x, parcel.y, map)[2]);
        else if (me_parcel && !parcel_delivery)
            var intrinsic_score = score + 4 * distance(parcel, me) - 0.5 * distance(parcel, find_nearest(parcel.x, parcel.y, map)[2]);
        else if (!me_parcel && parcel_delivery)
            var intrinsic_score = score - 0.5 * distance(parcel, me) + 4 * distance(parcel, find_nearest(parcel.x, parcel.y, map)[2]);
        else if (!me_parcel && !parcel_delivery)
            var intrinsic_score = score - 0.5 * distance(parcel, me) - 0.5 * distance(parcel, find_nearest(parcel.x, parcel.y, map)[2]);


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

function calculate_putdown_utility(utility) {
    for (let p of myAgent.parcelsInMind) {
        for (const [id, parcel] of parcels.entries()) {
            if (p === id) {
                utility += parcel.reward;
            }
        }
    }

    utility = k / ((1 + k * utility) * (1 + k * distance(me, find_nearest(me.x, me.y, map)[2])));               // utility = k/(1+k*reward)*(1+k*distance)

    return utility;
}

// Function to update the configuration of elements
//!CONFIGURATION
// Config received:  {
//     MAP_FILE: 'map_20',
//     PARCELS_GENERATION_INTERVAL: '5s',
//     PARCELS_MAX: '5',
//     MOVEMENT_STEPS: 1,
//     MOVEMENT_DURATION: 500,
//     AGENTS_OBSERVATION_DISTANCE: 5,
//     PARCELS_OBSERVATION_DISTANCE: 5,
//     AGENT_TIMEOUT: 10000,
//     PARCEL_REWARD_AVG: 50,
//     PARCEL_REWARD_VARIANCE: 10,
//     PARCEL_DECADING_INTERVAL: 'infinite',
//     RANDOMLY_MOVING_AGENTS: 2,
//     RANDOM_AGENT_SPEED: '2s',
//     CLOCK: 50
//   }
var configElements;
client.onConfig((config) => {
    configElements = config;
    console.log("Configuration received: ", configElements);
});


// Function to update beliefset when agents are sensed
client.onAgentsSensing(agents => {
    // Update beliefset with new agent information
    for (let a of agents) {
        beliefset.set(a.id, a);
    }
});


// Function to calculate utility of a parcel
function utilityFunction(parcel) {
    let retUtility = 0;
    let moltiplicatorDistance = 1

    // Calculate utility of picking up the parcel
    retUtility = parcel.reward - (moltiplicatorDistance * distanceBFS(parcel.x, parcel.y));

    return retUtility;
}

// Function to calculate utility of a parcel
function utilityFunctionPutDown() {

    let rewardInMind = 0;
    for (let p of myAgent.parcelsInMind) {
        for (const [id, parcel] of parcels.entries()) {
            if (p === id) {
                rewardInMind += parcel.reward;
            }
        }
    }

    utilityPutDown = rewardInMind / 2
}


function agentLoop() {
    // Array to store potential intention options
    const options = [];

    // Iterate through available parcels
    for (const [id, parcel] of parcels.entries()) {
        if (!parcel.carriedBy) {
            // Check if parcel is not carried by any agent
            let util = utilityFunction(parcel);                    // se == 0 intrinsic_score < 0 --> non ne vale la pena
            if (util && parcel.reward > 3) {
                options.push(['go_pick_up', parcel.x, parcel.y, id, util]);
            }
        }
    }
    utilityFunctionPutDown();
    options.push(['go_put_down', "", "", "", utilityPutDown])

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



// Call agentLoop every 5 seconds
setInterval(agentLoop, 3000);


// Function to trigger agentLoop when parcels are sensed
client.onParcelsSensing(agentLoop);

// Create an instance of Agent
const myAgent = new Agent();

// Start intention loop of the agent
myAgent.intentionLoop();


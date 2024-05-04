import { Agent } from "./agent.js";
import { distance, from_json_to_matrix, find_nearest, client, parcels, me, map } from "./utils.js";

// Define global variables
const beliefset = new Map();

const k = 1;                // costante per il calcolo della go_put_down utility

// here I want to implement f(score, distance) = alpha*score + beta/distance
function calculate_pickup_utility(parcel) {
    if (!parcel.carriedBy) {
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
                // console.log("Parcel in head: ", parcel, " - Score: ", parcel.reward);
                utility += parcel.reward;
            }
        }
    }

    utility = k / ((1 + k * utility) * (1 + k * distance(me, find_nearest(me.x, me.y, map)[2])));               // utility = k/(1+k*reward)*(1+k*distance)

    return utility;
}

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
        if (!parcel.carriedBy) {
            // Check if parcel is not carried by any agent
            let util = calculate_pickup_utility(parcel);                    // se == 0 intrinsic_score < 0 --> non ne vale la pena
            if (util) {
                options.push(['go_pick_up', parcel.x, parcel.y, id, util]);
            }
        }
    }

    console.log("Options: ", options);
    /**
     * Select best intention from available options
     */

    let best_option = null;
    for (const option of options) {
        best_option = option;
        myAgent.push(best_option);
    }

    if (myAgent.intention_queue.some(item => item.predicate[0] === "go_put_down")) {
        const item = myAgent.intention_queue.find(item => item.predicate[0] === "go_put_down");

        var utility = calculate_putdown_utility(item.predicate[4]);

        myAgent.push(['go_put_down', "", "", "", utility])

    } else {
        myAgent.push(['go_put_down', "", "", "", 0])
    }

    // for (let item of myAgent.intention_queue) {
    //     if (item.predicate[0] === "go_pick_up") {
    //         console.log(item.predicate[0], " - utility: ", item.predicate[4]);
    //     } else {
    //         var tot_score_inmind = myAgent.get_inmind_score();

    //         console.log(item.predicate[0], " - utility: ", item.predicate[4], " (inmymind: ", tot_score_inmind, ")");
    //     }
    // }
}






// Function to trigger agentLoop when parcels are sensed
client.onParcelsSensing(agentLoop);

// Create an instance of Agent
const myAgent = new Agent();

// Start intention loop of the agent
myAgent.intentionLoop();

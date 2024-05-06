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
const MULT = 1/2;

// here I want to implement f(score, distance) = alpha*score + beta/distance + min(distance(agent, parcel))
function calculate_pickup_utility(parcel) {
    

    if (!parcel.carriedBy && parcel.reward > 3) {
        let score = parcel.reward;
        
        var intrinsic_score = ALPHA*score + BETA/(distance(parcel, me) + distance(parcel, find_nearest(parcel.x, parcel.y, map)[2]));
        
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
        // console.log("parcel: ", parcel, "\nutility: ", util, "\n-------------------------------------------");
        return util;
    } else {
        return 0;
    }
}

function calculate_putdown_utility() {
    
    var score = 0;

    for (let p of myAgent.parcelsInMind) {
        for (const [id, parcel] of parcels.entries()) {
            if (p === id) {
                score += parcel.reward;
            }
        }
    }
    var utility = (GAMMA*score + DELTA/(distance(me, find_nearest(me.x, me.y, map)[2])))*MULT;

    // console.log("go_put_down\nutility: ", utility, "\n-------------------------------------------");
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




// // Function to calculate utility of a parcel
// function utilityFunction(parcel) {
//     let retUtility = 0;
//     let moltiplicatorDistance = 1

//     // Calculate utility of picking up the parcel
//     retUtility = parcel.reward - (moltiplicatorDistance * distance(parcel, me));

//     return retUtility;
// }

// // Function to calculate utility of a parcel
// function utilityFunctionPutDown() {

//     let rewardInMind = 0;
//     for (let p of myAgent.parcelsInMind) {
//         for (const [id, parcel] of parcels.entries()) {
//             if (p === id) {
//                 // console.log("Parcel in head: ", parcel, " - Score: ", parcel.reward);
//                 rewardInMind += parcel.reward;
//             }
//         }
//     }

//     utilityPutDown = rewardInMind / 2
// }




function agentLoop() {
    // Array to store potential intention options
    const options = [];

    // for(let intention of myAgent.intention_queue){
    //     console.log(intention.predicate[0], " - utility: ", intention.predicate[4])
    // }
    console.log("-------------------------------------------")

    // Iterate through available parcels
    for (const [id, parcel] of parcels.entries()) {
        if (!parcel.carriedBy) {
            // Check if parcel is not carried by any agent
            let util = calculate_pickup_utility(parcel);                    // se == 0 intrinsic_score < 0 --> non ne vale la pena
            if (util && parcel.reward > 3) {
                options.push(['go_pick_up', parcel.x, parcel.y, id, util]);
            }

        }
    }
    options.push(['go_put_down', "", "", "", calculate_putdown_utility()])

    for(let option of options){
        if(option[0] == "go_put_down"){
            console.log(option[0], " - utility: ", option[4], " (", myAgent.get_inmind_score(), ")")
        } else {
            console.log(option[0], " - utility: ", option[4])
        }
    }

    /**
     * Select best intention from available options
     */

    if(myAgent.intention_queue.length == 0){            
        myAgent.push('go_random_delivery', "", "", "", 1);
    }

    let best_option;
    let bestUtility = -1.0;
    for (const option of options) {
        let current_utility = option[4];
        if (current_utility > bestUtility) {

            best_option = option
            bestUtility = current_utility
        }
    }

    console.log("Choosing best_option ", best_option[0], " - utility: ", best_option[4])

    myAgent.push(best_option);
    
    console.log(myAgent.intention_queue)
}



// Call agentLoop every 5 seconds
setInterval(agentLoop, 5000);


// Function to trigger agentLoop when parcels are sensed
client.onParcelsSensing(agentLoop);

// Create an instance of Agent
const myAgent = new Agent();

// Start intention loop of the agent
myAgent.intentionLoop();

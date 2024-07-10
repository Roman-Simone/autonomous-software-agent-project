// import { friend } from "../bonnie_agent/utils.js";
import { Agent } from "./agent.js";
import { calculate_pickup_utility, calculate_putdown_utility, client, parcels, friend_id, me } from "./utils.js";
import { CommunicationData } from "./communication/communication_data.js";
import { handshake, role } from "../bonnie_agent/communication/coordination.js";
export { myAgent, friend_name, ack };

var friend_name = "god";
var ack = false;

// Create an instance of Agent
const myAgent = new Agent();

handshake();

async function agentLoop() {
    // Array to store potential intention options
    const options = [];

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
client.onParcelsSensing(agentLoop);

// Function to trigger agentLoop when parcels are sensed

myAgent.intentionLoop();
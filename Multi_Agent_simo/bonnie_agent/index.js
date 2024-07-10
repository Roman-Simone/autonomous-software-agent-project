// import { friend } from "../bonnie_agent/utils.js";
import { Agent } from "./agent.js";
import { calculate_pickup_utility, calculate_putdown_utility, parcels, friend_id, me, updateMyData } from "./utils.js";
import { handshake, slaveStateMessage, masterRevision, CollaboratorData, MyData  } from "./communication/coordination.js";
import { client, friend_name } from "./config.js";
export { myAgent };

await handshake();

// Create an instance of Agent
const myAgent = new Agent();

async function agentLoop() {

    // Array to store potential intention options
    MyData.options = [];

    // Iterate through available parcels
    for (let parcel of MyData.parcels) {
        if (!parcel.carriedBy && parcel.reward > 3) {
            // Check if parcel is not carried by any agent
            let util = calculate_pickup_utility(parcel);                    // se == 0 intrinsic_score < 0 --> non ne vale la pena
            if (util) {
                MyData.options.push(['go_pick_up', parcel.x, parcel.y, parcel.id, util]);
            }
        }
    }
    MyData.options.push(['go_put_down', "", "", "", calculate_putdown_utility()])
    let u = 2
    MyData.options.push(['go_random_delivery', "", "", "", u]);

    /**
     * Select best intention from available options
     */
    
    let best_option;
    let bestUtility = -1.0;
    for (const option of MyData.options) {
        let current_utility = option[4];
        if (current_utility > bestUtility) {

            best_option = option
            bestUtility = current_utility
        }
    }

    updateMyData(); 

    if(MyData.role == "SLAVE"){
        console.log("sto facendo parte: SLAVE");
        await slaveStateMessage();
    } else if (MyData.role == "MASTER"){
        console.log("sto facendo parte: MASTER");
        let ok = await masterRevision();
        
        if(ok)
        console.log("returned best_option_master: ", MyData.best_option)
        console.log("returned best_option_slave: ", CollaboratorData.best_option)

    } 

    console.log("Correctly exchanged data between agents!");

    myAgent.push(MyData.best_option);

}

// Call agentLoop every 2 seconds
setInterval(agentLoop, 2000);

client.onParcelsSensing(agentLoop);

// Function to trigger agentLoop when parcels are sensed

myAgent.intentionLoop();


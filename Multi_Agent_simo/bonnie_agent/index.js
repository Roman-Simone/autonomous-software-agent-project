import { Agent } from "./agent.js";
import { calculate_pickup_utility, calculate_putdown_utility, find_random_delivery } from "./utils.js";
import { handshake, slaveStateMessage, masterRevision, MyData  } from "./communication/coordination.js";


async function agentLoop() {

    // Array to store potential intention options
    MyData.options = [];

    // Iterate through available parcels
    for (let parcel of MyData.parcels) {
        if (!parcel.carriedBy && parcel.reward > 3) {
            // Check if parcel is not carried by any agent
            let util = calculate_pickup_utility(parcel);                    // if == 0 intrinsic_score < 0 --> non ne vale la pena
            if (util) {
                MyData.options.push(['go_pick_up', parcel.x, parcel.y, parcel.id, util]);
            }
        }
    }

    let putDownInfo = calculate_putdown_utility()
    MyData.options.push(['go_put_down', putDownInfo[0].x, putDownInfo[0].y, "", putDownInfo[1]])
    let u = 2
    let random_delivery = find_random_delivery();
    MyData.options.push(['go_random_delivery', random_delivery.x, random_delivery.y, "", u]);


    if(MyData.role == "SLAVE"){
        await slaveStateMessage();
    } else if (MyData.role == "MASTER"){
        await masterRevision();
    } 

    myAgent.push(MyData.best_option);
}

console.log("[INFO] ", "Waiting other agents to connect...\n")
if(await handshake()){
    console.log("[INFO] ", "Handshake done, my role is: ", MyData.role, "\n")
}

// Create an instance of Agent
const myAgent = new Agent();
// Function to trigger agentLoop when parcels are sensed
myAgent.intentionLoop();

// Call agentLoop every 1 second
setInterval(agentLoop, 1000);


export { myAgent };
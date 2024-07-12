import { slaveStateMessage, masterRevision  } from "../communication/coordination.js";
import { MyData } from "../belief/belief.js";
import { calculate_pickup_utility, calculate_putdown_utility, find_random_deliveryFarFromOther } from "./utilsOptions.js";
import { myAgent } from "../index.js";


async function optionsLoop() {

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
    let random_delivery = find_random_deliveryFarFromOther();
    MyData.options.push(['go_random_delivery', random_delivery.x, random_delivery.y, "", u]);

    // console.log("[INFO] ", "Options: ", MyData.options, "\n")

    if (MyData.role == "SLAVE") {
        await slaveStateMessage();
    } else if (MyData.role == "MASTER") {
        await masterRevision();
    }

    // console.log("[INFO] ", "Best option: ", MyData.best_option, "\n")

    myAgent.push(MyData.best_option);
}


export { optionsLoop };
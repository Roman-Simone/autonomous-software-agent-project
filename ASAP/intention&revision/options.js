import { myAgent } from "../index.js";
import { mode } from "../socketConnection.js";
import { MyData, MyMap } from "../belief/belief.js";
import { sendMessage } from "../communication/coordination.js";
import { calculate_pickup_utility, calculate_putdown_utility, find_random_deliveryFarFromOther, findBestOption } from "./utilsOptions.js";


const MULTIPLIER_THRESH_GO_PUT_DOWN = 10;                 // when it reach this inmind score, it goes to put down the parcels anyway
const MIN_VAL_DECADE_FREQ = 5.562684646268004e-300;     // minimum value of the parcel_decading_interval

async function optionsLoop() {

    var begin = new Date().getTime();

    // Array to store potential intention options
    MyData.options = [];

    // Iterate through available parcels
    for (let parcel of MyData.parcels) {

        if (parcel.carriedBy === null && parcel.reward > 3 && MyMap.map[parcel.x][parcel.y] > 0) {  // Not consider parcels with reward < 3 and already picked up by someone

            let util = calculate_pickup_utility(parcel);           // if == 0 intrinsic_score < 0 --> not worth to pick up

            if (util > 0) {
                MyData.options.push(['go_pick_up', parcel.x, parcel.y, parcel.id, util]);   // add the option to pick up the parcel
            }
        }
    }

    // Calculate the utility of put down the parcels Always add the option to put down the parcels
    // if parcel_decading_interval is infinite decade_frequency is equal to 5.562684646268004e-307 and we don't consider this option here
    if (MyMap.decade_frequency > MIN_VAL_DECADE_FREQ) {
        console.log("Decade frequency != infinite")
        let putDownInfo = calculate_putdown_utility()   // calculate the utility of put down the parcels with also the best position to put down
        MyData.options.push(['go_put_down', putDownInfo[0].x, putDownInfo[0].y, "", putDownInfo[1]])
    }

    // Add the option to go to a random delivery point always in the options array with a utility of 2
    let u = 2
    let random_delivery = find_random_deliveryFarFromOther();
    MyData.options.push(['go_random_delivery', random_delivery.x, random_delivery.y, "", u]);


    // If the agent is in TWO mode, best utility for the SLAVE and MASTER are sent in the communication (coordination.js) 
    // If the agent is in ONE mode, the best option is calculated with the function findBestOption
    if (mode == 'TWO') {
        if (MyData.role == "SLAVE") {
            await sendMessage(MyData)
        }
    }
    else {
        MyData.best_option = findBestOption(MyData.options)
    }

    // WE want that the agent put down the parcel every a certain amount of parcels (10*avg_reward)

    console.log("Inmind score: ", MyData.get_inmind_score(), " (", MyMap.parcel_reward_avg * MULTIPLIER_THRESH_GO_PUT_DOWN, ")")

    if (MyData.get_inmind_score() > MyMap.parcel_reward_avg * MULTIPLIER_THRESH_GO_PUT_DOWN) {

        console.log("\n\n\ngo put down the parcels\n\n\n")

        let putDownInfo = calculate_putdown_utility()
        MyData.best_option = ['go_put_down', putDownInfo[0].x, putDownInfo[0].y, "", putDownInfo[1]]
    }

    var end = new Date().getTime();

    // Print the best option and the time to calculate it
    console.log("[", MyData.role, "] ", "Best option: ", MyData.best_option, " in time : ", end - begin, " \n")

    // Push the best option in the agent's stack
    myAgent.push(MyData.best_option);
}

export { optionsLoop };

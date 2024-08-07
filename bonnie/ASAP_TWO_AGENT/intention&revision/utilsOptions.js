import { distanceBFS, distanceBFS_notMe, find_nearest_delivery } from "../planners/utils_planner.js";
import { decade_frequency } from "../belief/belief.js";
import { CollaboratorData, MyData, MyMap } from "../belief/belief.js";
export { calculate_pickup_utility, calculate_putdown_utility, find_random_deliveryFarFromOther, computeBestOption, findBestOption};

// Function to update the configuration of elements
//!CONFIGURATION
// Config received:  {
//     MAP_FILE: 'map_20',
//     PARCELS_GENERATION_INTERVAL: '5s',
//     PARCELS_MAX: '5',
//     MOVEMENT_STEPS: 1,
//     MOVEMENT_DURATION: 500,
//     AGENTS_OBSERVATION_DISTANCE: 5,
//     PARCELS_OBSERVATION_DISTANCE:. 5,
//     AGENT_TIMEOUT: 10000,
//     PARCEL_REWARD_AVG: 50,
//     PARCEL_REWARD_VARIANCE: 10,
//     PARCEL_DECADING_INTERVAL: 'infinite',
//     RANDOMLY_MOVING_AGENTS: 2,
//     RANDOM_AGENT_SPEED: '2s',
//     CLOCK: 50
//   }


function findBestOption(options, id = "undefined") {
    let bestUtility = -1.0;
    let best_option = [];
    for (const option of options) {
        let current_utility = option[4];
        if (current_utility > bestUtility) {
            if (option[3] != id) {
                best_option = option
                bestUtility = current_utility
            }
        }
    }
    return best_option;
}

function computeBestOption() {

    for (let s_elem of CollaboratorData.options) {
        let found = false;
        for (let m_elem of MyData.options) {
            if (s_elem[3] == m_elem[3] && s_elem[0] == "go_pick_up" && m_elem[0] == "go_pick_up") {
                found = true;
            }
        }
        if (!found && s_elem[0] == "go_pick_up") {
            let parcel = CollaboratorData.getParcelById(s_elem[3]);
            MyData.options.push(['go_pick_up', parcel.x, parcel.y, parcel.id, calculate_pickup_utility(parcel)]);
        }
    }
    for (let m_elem of MyData.options) {
        let found = false;
        for (let s_elem of CollaboratorData.options) {
            if (s_elem[3] == m_elem[3] && s_elem[0] == "go_pick_up" && m_elem[0] == "go_pick_up") {
                found = true;
            }
        }
        if (!found && m_elem[0] == "go_pick_up") {
            let parcel = MyData.getParcelById(m_elem[3])
            CollaboratorData.options.push(['go_pick_up', parcel.x, parcel.y, parcel.id, calculate_pickup_utility(parcel, CollaboratorData.pos)]);
        }
    }

    MyData.best_option = findBestOption(MyData.options)

    CollaboratorData.best_option = findBestOption(CollaboratorData.options)

    if (MyData.best_option[0] == "go_random_delivery" || CollaboratorData.best_option[0] == "go_random_delivery") { }

    else if (MyData.best_option[0] == "go_put_down" || CollaboratorData.best_option[0] == "go_put_down") {
        if (MyData.best_option[0] == "go_put_down" && CollaboratorData.best_option[0] == "go_put_down") {
            if (MyData.best_option[1] == CollaboratorData.best_option[1] && MyData.best_option[2] == CollaboratorData.best_option[2]) {
                if (MyData.best_option[4] >= CollaboratorData.best_option[4]) {
                    let newDelivery = find_nearest_delivery({ x: CollaboratorData.best_option[1], y: CollaboratorData.best_option[2] })
                    CollaboratorData.best_option = ['go_put_down', newDelivery.x, newDelivery.y, "", CollaboratorData.best_option[4]]
                } else {
                    let newDelivery = find_nearest_delivery({ x: MyData.best_option[1], y: MyData.best_option[2] })
                    MyData.best_option = ['go_put_down', newDelivery.x, newDelivery.y, "", MyData.best_option[4]]
                }
            }
        }
    }
    else {
        if (MyData.best_option[3] === CollaboratorData.best_option[3]) {
            if (MyData.best_option[4] >= CollaboratorData.best_option[4]) {
                CollaboratorData.best_option = findBestOption(CollaboratorData.options, CollaboratorData.best_option[3])
            } else {
                MyData.best_option = findBestOption(MyData.options, MyData.best_option[3])
            }
        }
    }

    return true;
}

function calculate_pickup_utility(parcel, slavePos = null) {
    let scoreParcel = parcel.reward;
    let numParcelInMind = MyData.parcelsInMind.length

    // let distance_parcel = 0;
    if (slavePos == null) {
        var distance_parcel = distanceBFS(parcel);
    } else {
        var distance_parcel = distanceBFS_notMe(slavePos, parcel)
    }

    let distance_delivery = distanceBFS_notMe(parcel, find_nearest_delivery());

    for (let parcelInMind of MyData.parcelsInMind) {
        let rewardAtEnd = parcelInMind.reward - decade_frequency * (distance_parcel + distance_delivery);
        if (rewardAtEnd <= 0) {
            numParcelInMind = numParcelInMind - 1;
        }
    }

    let RewardParcel = scoreParcel - decade_frequency * distance_parcel;
    let RewardInMind = MyData.scoreInMind - ((decade_frequency * distance_parcel) * numParcelInMind);
    let utility = (RewardParcel + RewardInMind) - (decade_frequency * distance_delivery) * (numParcelInMind + 1);


    let min_distance_parcel_agent = Number.MAX_VALUE;
    let nearest_agent = "";
    for (let a of MyData.adversaryAgents) {
        if (distanceBFS_notMe(parcel, a) < min_distance_parcel_agent) {
            min_distance_parcel_agent = distanceBFS_notMe(parcel, a);
            nearest_agent = a.name;
        }
    }

    let mult_malus = 0.7;

    if (min_distance_parcel_agent < distance_parcel) {
        utility -= mult_malus * (distance_parcel - min_distance_parcel_agent);

    }

    return utility;
}


function calculate_putdown_utility() {
    let nearest_delivery = find_nearest_delivery()
    let distanceDelivery = distanceBFS(nearest_delivery);
    let numParcelInMind = MyData.parcelsInMind.length

    for (let parcelInMind of MyData.parcelsInMind) {
        let rewardAtEnd = parcelInMind.reward - (decade_frequency * distanceDelivery);
        if (rewardAtEnd <= 0) {
            numParcelInMind = numParcelInMind - 1;
        }
    }

    var utility = MyData.get_inmind_score() - ((decade_frequency * distanceDelivery) * numParcelInMind);
    return [nearest_delivery, utility];
}


function find_random_deliveryFarFromOther() {

    let random_pos = { x: -1, y: -1 };
    
    // console.log("\nI'm a ", MyData.role, " and I'm going to find a random delivery far from the other agent\n");

    if (MyData.role == "SLAVE" || MyData.role == "NOTHING") {       // SLAVE fa quello che vuole, va in una random a caso
        
        
        
        
        
        // var random_spawning = MyMap.spawningCoordinates[Math.floor(Math.random() * MyMap.spawningCoordinates.length)];
        // var random_delivery = MyMap.deliveryCoordinates[Math.floor(Math.random() * MyMap.deliveryCoordinates.length)];
        

        let spawning_pos = MyMap.getBestSpawningCoordinates();
        
        
        random_pos = { x: spawning_pos.x, y: spawning_pos.y };
        // console.log("\nI'm a SLAVE, I'm going to a random delivery: ", delivery_pos);
    } else {                                            // MASTER va nella cella di delivery più lontana dallo SLAVE
        MyMap.spawningCoordinates.sort((a, b) => {
            const distanceA = distanceBFS_notMe(a, (CollaboratorData.best_option[1], CollaboratorData.best_option[2]));
            const distanceB = distanceBFS_notMe(b, (CollaboratorData.best_option[1], CollaboratorData.best_option[2]));
            return distanceB - distanceA;
        });
        
        if(MyData.pos.x == MyMap.spawningCoordinates[0].x && MyData.pos.y == MyMap.spawningCoordinates[0].y){
            random_pos = {x: MyMap.spawningCoordinates[1].x, y: MyMap.spawningCoordinates[1].y };
        } else {
            random_pos = {x: MyMap.spawningCoordinates[0].x, y: MyMap.spawningCoordinates[0].y };
        }
    }

    return random_pos;
}

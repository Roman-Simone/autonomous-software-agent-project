import { positionsEqual } from "../planners/utils_planner.js";
import { CollaboratorData, MyData, MyMap } from "../belief/belief.js";
import { distanceBFS, distanceBFS_notMe, find_nearest_delivery } from "../planners/utils_planner.js";


// Function to find the best option in the options array, the best option is the one with the highest utility
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


// Function to find the best option for the MASTER and the SLAVE given the options of the two agents
function findBestOptionMasterAndSLave() {

    // Reward penalty divider used to penalize the parcels that are seen by the other agent (to incourage the agent to stay away from the other agent)
    const REWARD_PENALTY_DIVIDER = 0.6

    // Unify the options of the two agents (Add the options of MASTER to the SLAVE and viceversa)
    // SLAVE -> MASTER
    for (let s_elem of CollaboratorData.options) {
        let found = false;
        for (let m_elem of MyData.options) {
            if (s_elem[3] == m_elem[3] && s_elem[0] == "go_pick_up" && m_elem[0] == "go_pick_up") {
                found = true;
            }
        }
        if (!found && s_elem[0] == "go_pick_up") {
            let parcel = CollaboratorData.getParcelById(s_elem[3]);
            if (parcel != undefined) {
                parcel.reward *= REWARD_PENALTY_DIVIDER;
                MyData.options.push(['go_pick_up', parcel.x, parcel.y, parcel.id, calculate_pickup_utility(parcel)]);
            }
            else {
                console.log("ERROR: parcel is undefined (computeBestOption utilsbelief)")
            }
        }
    }

    // MASTER -> SLAVE
    for (let m_elem of MyData.options) {
        let found = false;
        for (let s_elem of CollaboratorData.options) {
            if (s_elem[3] == m_elem[3] && s_elem[0] == "go_pick_up" && m_elem[0] == "go_pick_up") {
                found = true;
            }
        }
        if (!found && m_elem[0] == "go_pick_up") {
            let parcel = MyData.getParcelById(m_elem[3])

            if (parcel != undefined) {
                parcel.reward *= REWARD_PENALTY_DIVIDER;
                CollaboratorData.options.push(['go_pick_up', parcel.x, parcel.y, parcel.id, calculate_pickup_utility(parcel, CollaboratorData.pos)]);
            }
            else {
                console.log("ERROR: parcel is undefined (computeBestOption utilsbelief)")
            }

        }
    }

    // Select the best option for Master given the options array unificated
    MyData.best_option = findBestOption(MyData.options)
    // Select the best option for Slave given the options array unificated
    CollaboratorData.best_option = findBestOption(CollaboratorData.options)

    // If the best option of at least one of the two agents is go_random_delivery NO PROBLEM
    if (MyData.best_option[0] == "go_random_delivery" || CollaboratorData.best_option[0] == "go_random_delivery") { }

    // If the best option only one of the two agents is go_put_down NO PROBLEM
    else if (MyData.best_option[0] == "go_put_down" || CollaboratorData.best_option[0] == "go_put_down") {

        // If both agents have the same best option go_put_down select the one with the highest utility and change the delivery point of the other agent
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
        // If the best option of the two agents is the same go_pick_up choose two different parcels for the two agents
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

// Function to calculate the utility of pick up a parcel 
// the main idea is to calculate the reward if we pick up the parcel and after that we deliver and the reward if we don't pick up the parcel and we go directly to the delivery
// if there is slavePos we are in MultiAgent mode if is null we are in SingleAgent mode
function calculate_pickup_utility(parcel, slavePos = null) {
    
    
    let scoreParcel = parcel.reward;

    // If no slavePos we take the information from MyData otherwise from CollaboratorData (SLAVE)
    if (slavePos == null) {
        var numParcelInMind = MyData.parcelsInMind.length
        var parcelsInMind = MyData.parcelsInMind;
        var scoreInMind = MyData.get_inmind_score();
        var adversaryAgents = MyData.adversaryAgents;
    } else {
        var numParcelInMind = CollaboratorData.parcelsInMind.length
        var parcelsInMind = CollaboratorData.parcelsInMind
        var scoreInMind = CollaboratorData.get_inmind_score();
        var adversaryAgents = CollaboratorData.adversaryAgents
    }

    // Calculate the distance from the parcel to the agent, if there is a slavePos we calculate the distance from the slavePos to the parcel
    if (slavePos == null) {
        var distance_parcel = distanceBFS(parcel);
    } else {
        var distance_parcel = distanceBFS_notMe(slavePos, parcel)
    }


    // Calculate the distance from the parcel to the nearest delivery point
    let distance_delivery = distanceBFS_notMe(parcel, find_nearest_delivery());

    // Calculate the reward at the end of the delivery
    for (let parcelInMind of parcelsInMind) {
        let rewardAtEnd = parcelInMind.reward - MyMap.decade_frequency * (distance_parcel + distance_delivery);
        if (rewardAtEnd <= 0) {
            numParcelInMind = numParcelInMind - 1;
            scoreInMind = scoreInMind - parcelInMind.reward;
        }
    }
    
    let RewardParcel = scoreParcel - MyMap.decade_frequency * distance_parcel;
    let RewardInMind = scoreInMind - ((MyMap.decade_frequency * distance_parcel) * numParcelInMind);
    let utility = (RewardParcel + RewardInMind) - (MyMap.decade_frequency * distance_delivery) * (numParcelInMind + 1);

    // If there are adversary agents we penalize the utility
    let min_distance_parcel_agent = Number.MAX_VALUE;
    for (let a of adversaryAgents) {
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

// Function to calculate the utility of put down the parcels
// the main idea is to calculate the reward if we put down the parcels in the nearest delivery point
function calculate_putdown_utility() {

    let nearest_delivery = find_nearest_delivery()      // find the nearest delivery point
    let distanceDelivery = distanceBFS(nearest_delivery);   // calculate the distance from the agent to the nearest delivery point
    let numParcelInMind = MyData.parcelsInMind.length   // number of parcels in mind

    let valueInMind = MyData.get_inmind_score();       // value in mind

    let mult = 0.5 * (valueInMind)  // multiplier to penalize the utility if the agent has a lot of parcels in mind


    for (let parcelInMind of MyData.parcelsInMind) {
        let rewardAtEnd = parcelInMind.reward - (MyMap.decade_frequency * distanceDelivery);
        if (rewardAtEnd <= 0) {
            numParcelInMind = numParcelInMind - 1;
        }
    }
    var utility = valueInMind - ((MyMap.decade_frequency * distanceDelivery) * numParcelInMind);

    utility = utility + mult;

    return [nearest_delivery, utility];
}


function find_random_deliveryFarFromOther() {

    let random_pos = { x: -1, y: -1 };

    // console.log("\nI'm a ", MyData.role, " and I'm going to find a random delivery far from the other agent\n");

    if (MyData.role == "SLAVE" || MyData.role == "NOTHING") {       // SLAVE fa quello che vuole, va in una random a caso

        let spawning_pos = MyMap.getBestSpawningCoordinates();
        random_pos = { x: spawning_pos.x, y: spawning_pos.y };

        if (positionsEqual(spawning_pos, MyData.pos)) {
            random_pos = find_nearest_delivery();
        }
        // console.log("\nI'm a SLAVE, I'm going to a random delivery: ", delivery_pos);
    } else {

        // Initially no information about the best option
        if (CollaboratorData.best_option.length == 0) {
            random_pos = find_nearest_delivery();
            return random_pos;
        }

        // MASTER va nella cella di spawn piu' lontana dallo SLAVE
        MyMap.spawningCoordinates.sort((a, b) => {
            const distanceA = distanceBFS_notMe(a, (CollaboratorData.best_option[1], CollaboratorData.best_option[2]));
            const distanceB = distanceBFS_notMe(b, (CollaboratorData.best_option[1], CollaboratorData.best_option[2]));
            return distanceB - distanceA;
        });

        if (positionsEqual(MyMap.spawningCoordinates[0], MyData.pos)) {
            random_pos = { x: MyMap.spawningCoordinates[1].x, y: MyMap.spawningCoordinates[1].y };
        } else {
            random_pos = { x: MyMap.spawningCoordinates[0].x, y: MyMap.spawningCoordinates[0].y };
        }
    }

    return random_pos;
}

export { calculate_pickup_utility, calculate_putdown_utility, find_random_deliveryFarFromOther, findBestOptionMasterAndSLave, findBestOption };

import { client, friend_name } from "../socketConnection.js";
import { find_nearest_delivery } from "../planners/utils_planner.js";
import { CollaboratorData, MyData, MyMap } from "../belief/belief.js";
import { findBestOptionMasterAndSLave, findBestOption } from "../intention&revision/utilsOptions.js"

import { isReachable } from "../planners/utils_planner.js";

/**
 * Function to get the message from the other agent used in handshake
 * @param {Object} client
 * @returns {Promise} Promise with the message
*/
function getMessage(client) {
    return new Promise((resolve, reject) => {
        client.onMsg((id, name, msg, reply) => {
            resolve(msg);
        });
    });
}

/**
 * Function to perform the handshake between the two agents
*/
async function handshake() {

    // Wait 500ms for synchronization
    await new Promise(resolve => setTimeout(resolve, 500));

    // Send message in broadcast (just the second agent will receive it)
    client.shout({
        hello: '[HANDSHAKE] ' + client.name + ' firstMessage',
        iam: client.name,
        id: client.id
    });

    // Wait for the first message from the other agent
    let first_msg = false
    while (!first_msg) {
        console.log("[INFO] ", "Waiting for handshake...\n")

        // wait for the first message and read it
        let receivedMSG = ""
        await getMessage(client).then(receivedMsg => {
            receivedMSG = receivedMsg
        });
        // if is the first agent read message and send ack (SLAVE)
        let splitMSG = receivedMSG.hello.split(" ");
        if (receivedMSG.iam == friend_name && splitMSG[0] == "[HANDSHAKE]" && splitMSG[1] == friend_name && splitMSG[2] == "firstMessage") {
            first_msg = true
            // SLAVE-SIDE
            CollaboratorData.id = receivedMSG.id;
            CollaboratorData.name = receivedMSG.name;
            MyData.name = client.name;
            MyData.id = client.id;
            MyData.role = "SLAVE";
            CollaboratorData.role = "MASTER";
            await client.say(CollaboratorData.id, {
                hello: '[HANDSHAKE] ' + client.name + ' ack',
                iam: client.name,
                id: client.id
            });
        }
        // if is the second agent read message 
        else if ((receivedMSG.iam == friend_name && splitMSG[0] == "[HANDSHAKE]" && splitMSG[1] == friend_name && splitMSG[2] == "ack")) {
            first_msg = true
            // MASTER-SIDE 
            CollaboratorData.id = receivedMSG.id;
            CollaboratorData.name = receivedMSG.name;
            MyData.name = client.name;
            MyData.id = client.id;
            MyData.role = "MASTER";
            CollaboratorData.role = "SLAVE";
        }
    }
    return true
}

/**
 * Function to send a message to the other agent
 * used to send the data of the agent to the other agent
 * @param {object} data 
 */
async function sendMessage(data) {
    await client.say(CollaboratorData.id, {
        hello: "[INFORM]",
        data: data,
        time: Date.now()
    });
}

/**
 * Function to get the message from the other agent
 */
client.onMsg((id, name, msg, reply) => {

    if (msg.hello == "[INFORM]" && msg.data != undefined) {

        // MASTER-SIDE
        if (MyData.role == "MASTER") {
            // Receive data from the SLAVE
            CollaboratorData.copy(msg.data);

            if (CollaboratorData.adversaryAgents.length > 0) {
                // Update the map with the new position of the adversary agents (union of the two lists)
                MyData.updateEnemies(CollaboratorData.adversaryAgents);
            }

            if (MyData.adversaryAgents.length > 0) {
                // Update the map with the new position of the adversary agents (union of the two lists)
                CollaboratorData.updateEnemies(MyData.adversaryAgents);
            }

            // This is the check for map 24c2_8 where one agent has to deliver and one agent has to pick up the parcel
            if (find_nearest_delivery().x == -1 || MyMap.getBestSpawningCoordinates().x == -1) {

                MyData.options = []
                MyData.best_option = []
                CollaboratorData.options = []
                CollaboratorData.best_option = []

                if (find_nearest_delivery().x == -1) {

                    if (MyData.get_inmind_score() > 0) {
                        MyData.best_option = ['go_put_down', MyData.pos.x, 5, "", 1]
                    }
                    else {
                        // Iterate through available parcels
                        for (let parcel of MyData.parcels) {

                            if (parcel.carriedBy === null && parcel.reward > 3 && MyMap.map[parcel.x][parcel.y] > 0 && isReachable(parcel.x, parcel.y)) {  // Not consider parcels with reward < 3 and already picked up by someone

                                if (parcel.y == 0) {
                                    MyData.options.push(['go_pick_up', parcel.x, parcel.y, parcel.id, 5]);   // add the option to pick up the parcel
                                }
                            }
                        }
                        MyData.best_option = findBestOption(MyData.options)

                        if (MyData.best_option.length == 0) {
                            MyData.best_option = ["go_random_delivery", MyData.pos.x, 0, "", 2]
                        }
                    }

                    if (CollaboratorData.get_inmind_score() > 0) {
                        CollaboratorData.best_option = ['go_put_down', MyData.pos.x, 19, "", 1]
                    }
                    else {
                        // Iterate through available parcels
                        for (let parcel of MyData.parcels) {

                            if (parcel.carriedBy === null && parcel.reward > 3 && MyMap.map[parcel.x][parcel.y] > 0 && isReachable(parcel.x, parcel.y)) {  // Not consider parcels with reward < 3 and already picked up by someone

                                if (parcel.y == 5) {
                                    CollaboratorData.options.push(['go_pick_up', parcel.x, parcel.y, parcel.id, 5]);   // add the option to pick up the parcel
                                }
                            }
                        }
                        CollaboratorData.best_option = findBestOption(CollaboratorData.options)

                        if (CollaboratorData.best_option.length == 0) {
                            CollaboratorData.best_option = ["go_random_delivery", MyData.pos.x, 7, "", 2]
                        }
                    }
                }

                else if (MyMap.getBestSpawningCoordinates().x == -1) {
                    if (CollaboratorData.get_inmind_score() > 0) {
                        CollaboratorData.best_option = ['go_put_down', MyData.pos.x, 5, "", 1]
                    }
                    else {
                        // Iterate through available parcels
                        for (let parcel of CollaboratorData.parcels) {

                            if (parcel.carriedBy === null && parcel.reward > 3 && MyMap.map[parcel.x][parcel.y] > 0 && isReachable(parcel.x, parcel.y)) {  // Not consider parcels with reward < 3 and already picked up by someone

                                if (parcel.y == 0) {
                                    CollaboratorData.options.push(['go_pick_up', parcel.x, parcel.y, parcel.id, 5]);   // add the option to pick up the parcel
                                }
                            }
                        }
                        CollaboratorData.best_option = findBestOption(MyData.options)

                        if (CollaboratorData.best_option.length == 0) {
                            CollaboratorData.best_option = ["go_random_delivery", CollaboratorData.pos.x, 0, "", 2]
                        }
                    }

                    if (MyData.get_inmind_score() > 0) {
                        MyData.best_option = ['go_put_down', MyData.pos.x, 19, "", 1]
                    }
                    else {
                        // Iterate through available parcels
                        for (let parcel of MyData.parcels) {

                            if (parcel.carriedBy === null && parcel.reward > 3 && MyMap.map[parcel.x][parcel.y] > 0 && isReachable(parcel.x, parcel.y)) {  // Not consider parcels with reward < 3 and already picked up by someone

                                if (parcel.y == 5) {
                                    MyData.options.push(['go_pick_up', parcel.x, parcel.y, parcel.id, 5]);   // add the option to pick up the parcel
                                }
                            }
                        }
                        MyData.best_option = findBestOption(MyData.options)

                        if (MyData.best_option.length == 0) {
                            MyData.best_option = ["go_random_delivery", MyData.pos.x, 7, "", 2]
                        }
                    }
                }
            }
            else {
                // Compute the best option for the two agents and send the message with the best option and information to the SLAVE
                console.log("[INFO] ", "Computing best option for the two agents...\n")
                findBestOptionMasterAndSLave()
            }


            sendMessage(CollaboratorData);


            // Reset the map with the original values and set the adversary agents as walls
            MyMap.resetMap(-1)
            for (let a of MyData.adversaryAgents) {
                MyMap.updateMap(a.x, a.y, -1);
            }

        }
        // SLAVE-SIDE
        else if (MyData.role == "SLAVE") {

            // Take the message from the MASTER with the best option and the information
            MyData.copy(msg.data);

            // Update the map with the new position of the adversary agents (union of the two lists)
            MyMap.resetMap(-1)
            for (let a of MyData.adversaryAgents) {
                MyMap.updateMap(a.x, a.y, -1);
            }
        }
    }
});

export { handshake, sendMessage };

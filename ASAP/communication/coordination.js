import { client, friend_name } from "../socketConnection.js";
import { find_nearest_delivery } from "../planners/utils_planner.js";
import { CollaboratorData, MyData, MyMap } from "../belief/belief.js";
import { findBestOptionMasterAndSLave, findBestOption, oneTake_oneDeliver } from "../intention&revision/utilsOptions.js"

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

            // Here we menaged the case in which one agent has no delivery point and the other has no spawning point so they have to do one take and one deliver
            if (find_nearest_delivery().x == -1 || MyMap.getBestSpawningCoordinates().x == -1) {
                oneTake_oneDeliver()
            }
            else {
                // Compute the best option for the two agents and send the message with the best option and information to the SLAVE
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

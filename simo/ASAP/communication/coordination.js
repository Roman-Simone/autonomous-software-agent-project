import { client, friend_name } from "../socketConnection.js";
import { computeBestOption } from "../intention&revision/utilsOptions.js"
import { CollaboratorData, MyData } from "../belief/belief.js";

function getMessage(client) {
    return new Promise((resolve, reject) => {
        client.onMsg((id, name, msg, reply) => {
            resolve(msg);
        });
    });
}

async function handshake() {

    // Wait 500ms for synchronization
    await new Promise(resolve => setTimeout(resolve, 500));

    // Send message in broadcast (just the first agent will receive it)
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




async function sendMessage(data) {
    await client.say(CollaboratorData.id, {
        hello: "[INFORM]",
        data: data,
        time: Date.now()
    });
}

client.onMsg((id, name, msg, reply) => {
    if (msg.hello == "[INFORM]" && msg.data != undefined) {

        if (MyData.role == "MASTER") {

            console.log("\n\nMESSAGE DATA: ")
            CollaboratorData.copy(msg.data);
            CollaboratorData.print();
            console.log("\n\n")

            

            if (CollaboratorData.adversaryAgents.length > 0) {
                MyData.updateEnemies(CollaboratorData.adversaryAgents);
            }

            if (MyData.adversaryAgents.length > 0) {
                CollaboratorData.updateEnemies(MyData.adversaryAgents);
            }

            if (computeBestOption()) {
                sendMessage(CollaboratorData);
            }

        }
        else if (MyData.role == "SLAVE") {

            MyData.copy(msg.data);

        }
    }
});


// // SLAVE manda options e attende un ordine dal master
// async function slaveStateMessage() {

//     // MyData.printParcels();
//     let reply = await client.ask(CollaboratorData.id, {
//         hello: "[INFORM]",
//         data: MyData,
//         time: Date.now()
//     });

//     MyData.copy(reply);

//     return reply;
// }



// // MASTER riceve options e manda ordine allo slave
// function masterRevision() {
//     return new Promise((resolve, reject) => {
//         client.onMsg((id, name, msg, reply) => {
//             try {

//                 console.log("[", MyData.role, "] ", "Received message from ", name, " at ", msg.time, "\n");

//                 if (msg.data != undefined) {
//                     CollaboratorData.copy(msg.data);
//                 }
//                 if (computeBestOption())
//                     if (reply) {
//                         reply(CollaboratorData);
//                     }
//                 resolve(true); // Resolve the promise with the answer
//             } catch (error) {
//                 console.error(error);

//                 if (reply) {
//                     reply(msg.data);            // to mantain sync, if error is catch we simply return the same state we received (arrangiati SLAVE)
//                 }

//                 reject(error); // Reject the promise if there's an error
//             }
//         });
//     });
// }

export { handshake, sendMessage };

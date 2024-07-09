import { client, friend_name } from "../config.js";
import { CommunicationData } from "./communication_data.js";

var CollaboratorData = new CommunicationData();
var MyData = new CommunicationData();

function getMessage(client) {
    return new Promise((resolve, reject) => {
        client.onMsg((id, name, msg, reply) => {
            console.log("msg: ", msg);
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
    while (!first_msg){
        
        // wait for the first message and read it
        let receivedMSG = ""
        await getMessage(client).then(receivedMsg => {
            console.log("Received message for handshake: ", receivedMsg);
            receivedMSG = receivedMsg
        });

        // if is the first agent read message and send ack (SLAVE)
        let splitMSG = receivedMSG.hello.split(" ");
        if(receivedMSG.iam == friend_name && splitMSG[0] == "[HANDSHAKE]" && splitMSG[1] == friend_name && splitMSG[2] == "firstMessage"){
            first_msg = true
            // SLAVE-SIDE
            CollaboratorData.id = receivedMSG.id;
            CollaboratorData.name = receivedMSG.name;
            MyData.name = client.name;
            MyData.id = client.id;
            MyData.role = "SLAVE";
            CollaboratorData.role = "MASTER";
            console.log("Friend id: ", CollaboratorData.id);
            await client.say(CollaboratorData.id, {
                hello: '[HANDSHAKE] ' + client.name + ' ack',
                iam: client.name,
                id: client.id
            });
        }
        // if is the second agent read message 
        else if ((receivedMSG.iam == friend_name && splitMSG[0] == "[HANDSHAKE]" && splitMSG[1] == friend_name && splitMSG[2] == "ack")){
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

    console.log("Handshake completed");
}


// SLAVE manda options e attende un ordine dal master

async function slaveStateMessage(options){
    await client.ask(CollaboratorData.id, {
        hello: "[INFORM]",
        data: MyData,
        time: Date.now()
    });

    console.log("Received reply: ", reply);
    return reply;
}

// MASTER riceve options e manda ordine allo slave

async function masterRevision(){
    await getOptionMessage(client).then(receivedMsg => {
        console.log("Received message: ", receivedMsg);
        receivedMSG = receivedMsg
    });
}

function computeBestOption(data){
    console.log("Received data (computing best option): ", data);
    return "best_option";
}

function getOptionMessage(client) {
    return new Promise((resolve, reject) => {
        client.onMsg((id, name, msg, reply) => {
            console.log('new msg: ', msg);
            
            answer = computeBestOption(msg.data)            
            console.log("my answer: ", answer);
            
            if (reply)
                try { reply(answer) } catch { (error) => console.error(error) }

            resolve(msg);
        });
    });
}

export { handshake, slaveStateMessage, masterRevision, CollaboratorData, MyData };

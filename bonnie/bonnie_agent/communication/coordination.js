import { friend_id, parcels, me, beliefset } from "../utils.js";
import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { CommunicationData } from "./communication_data.js";
import { client, friend_name } from "../config.js";
import { myAgent, ack } from "../index.js";
export { PartnerData, MyData, handshake, send_message, role }

var role = '';
var PartnerData = new CommunicationData();
var MyData = new CommunicationData();


async function handshake() {
    // while (!ack) 
        console.log("ack: ", ack)
        role = "MASTER"
        console.log("WAITING FOR ACK from :", friend_id)


        await client.say( friend_id, {
            hello: '[HANDSHAKE] master_slave_connection MASTER_OK',
            iam: client.name,
            id: client.id
        } );

        // let reply = await client.ask(friend_id, {
        //     hello: '[HANDSHAKE] master_slave_connection MASTER_OK',
        //     iam: client.name,
        //     id: client.id
        // });
        // let rep = reply.split(" ");
        // console.log("rep: ", rep)

        // if (rep[0] == "[HANDSHAKE]" && rep[1] == "master_slave_connection" && rep[2] == "SLAVE_OK") {
        //     console.log("PAIRED COMPLETE");
        //     friend_id == rep[4];
        //     ack = true;
        // }
        // console.log("ack: ", ack)

    // }
}

// if (typeof myVariable !== 'undefined') {
//     console.log('myVariable is defined');
// } else {
//     console.log('myVariable is not defined');
// }

client.onMsg((id, name, msg, reply) => {

    let words = msg.hello.split(" ");

    console.log("msg: ", msg)

    if (words[0] == "[HANDSHAKE]") {
        if (words[1] == "master_slave_connection" && words[2] == "MASTER_OK") {
            role = "SLAVE"
            console.log("I'm a SLAVE");
            send_ack();
        }
    }

    if (words[0] == "[HANDSHAKE]") {
        if (words[1] == "master_slave_connection" && words[2] == "SLAVE_OK") {
            console.log("I'm a MASTER");
            ack = true;
        }
    }

    if (words[0] == "[STATE]") {
        // PartnerData.update_data(msg.data);
        PartnerData = msg.data;
    }


    if (reply && answer)
        try { reply(answer) } catch { (error) => console.error(error) }
});

async function send_ack() {
    await client.say(friend_id, {
        hello: '[HANDSHAKE] master_slave_connection SLAVE_OK',
        iam: client.name,
        id: client.id
    });
}

async function send_message() {
    await client.say(friend_id, {
        hello: '[STATE]',
        data: MyData,
        time: Date.now(),
        iam: client.name,
        id: client.id
    });
}

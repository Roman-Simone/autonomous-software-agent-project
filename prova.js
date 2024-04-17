import { default as config } from "./config.js";
import { DeliverooApi, timer } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi( config.host, config.token )
client.onConnect( () => console.log( "socket", client.socket.id ) );
client.onDisconnect( () => console.log( "disconnected", client.socket.id ) );




async function mypos(){
    let myPromise = new Promise(function(resolve) {
        client.onYou(({x, y}) => {
            resolve({x, y});
        });
    });

    return await myPromise;
}

async function main() {
    let me = await mypos();
    console.log("ciao", me); // Qui otterrai i valori di x e y

    return;
}

main();

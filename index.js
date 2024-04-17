import { default as config } from "./config.js";
import { DeliverooApi, timer } from "@unitn-asa/deliveroo-js-client";
import { from_json_to_matrix } from "./function.js";
import { find_nearest } from "./function.js";

const client = new DeliverooApi( config.host, config.token )
client.onConnect( () => console.log( "socket", client.socket.id ) );
client.onDisconnect( () => console.log( "disconnected", client.socket.id ) );
var map = [];


await client.onMap( (width, height, tiles) => {
    console.log('map', width, height, tiles);
    map = from_json_to_matrix(width, height, tiles, map);
});

async function agentLoop () {

    var me_x = 0;
    var me_y = 0;

    var me = await new Promise(resolve => {
        client.onYou(({x, y}) => {
            console.log('you', x, y);
            me_x = x;
            me_y = y;
            resolve({x, y});
        });
    });

    var try1 = find_nearest(me.x, me.y, map);
    console.log('try', try1);

}

agentLoop()
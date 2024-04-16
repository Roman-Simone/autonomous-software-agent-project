import { default as config } from "./config.js";
import { DeliverooApi, timer } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi( config.host, config.token )
client.onConnect( () => console.log( "socket", client.socket.id ) );
client.onDisconnect( () => console.log( "disconnected", client.socket.id ) );

var map = []; // map matrix

function printMap(width, height, map){
    console.log("map:");
    for (let j = height - 1; j >= 0; j--) {
        let row = "";
        for (let i = 0; i < width; i++) {
            row += map[i][j] + " ";
        }
        console.log(row);
    }
}

async function agentLoop () {

    await client.onMap( (width, height, tiles) => {
        console.log('map', width, height, tiles);

        for (let i = 0; i < width; i++) {
            map[i] = [];
            for (let j = 0; j < height; j++) {
                map[i][j] = 0;                                       // '0' are blocked tiles (empty or not_tile)
                for(let k=0; k<tiles.length; k++){
                    if(tiles[k].x == i && tiles[k].y == j){
                        map[i][j] = 3;                               // '3' are walkable non-spawning tiles 
                        if (tiles[k].parcelSpawner) map[i][j] = 1;   // '1' are walkable spawning tiles  
                        if (tiles[k].delivery) map[i][j] = 2;        // '2' are delivery tiles
                    }
                }
            }
        }
    
        printMap(width, height, map);

    });
}

agentLoop();

import { default as config } from "./config.js";
import { DeliverooApi, timer } from "@unitn-asa/deliveroo-js-client";
import { from_json_to_matrix } from "./function.js";
import { find_nearest } from "./function.js";
import { manhattan } from "./function.js";
import { findPath_BFS } from "./function.js";
import { move } from "./function.js";


const client = new DeliverooApi( config.host, config.token )
client.onConnect( () => console.log( "socket", client.socket.id ) );
client.onDisconnect( () => console.log( "disconnected", client.socket.id ) );
var map = [];
var nearest_delivery_x = null; 
var nearest_delivery_y = null; 


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

    var try1 = find_nearest(me_x, me_y, map);       // this return a json object with the nearest coordinates and type of tile
    
    console.log("try1: ", try1)

    nearest_delivery_x = try1[2].x;
    nearest_delivery_y = try1[2].y;

    // Calculate the path from current position to nearest delivery position
    
    // var path = findPath_BFS(me_x, me_y, nearest_delivery_x, nearest_delivery_y, map);

    let scores = [];
    let score = 0;

    var sensing = await new Promise(resolve => {
        client.onParcelsSensing((parcels) => {
            console.log('parcels', parcels);
            for (var i = 0; i < parcels.length; i++) {

                score = {
                    // reward of the parcel - distance from me to the parcel - distance from the parcel to the nearest delivery point
                    score: parcels[i].reward - manhattan(me_x, me_y, parcels[i].x, parcels[i].y) - manhattan(parcels[i].x, parcels[i].y, find_nearest(parcels[i].x, parcels[i].y, map)[2].x, find_nearest(parcels[i].x, parcels[i].y, map)[2].x, find_nearest(parcels[i].x, parcels[i].y, map)[2].y), 
                    x: parcels[i].x, 
                    y: parcels[i].y,
                    x_del: find_nearest(parcels[i].x, parcels[i].y, map)[2].x,
                    y_del: find_nearest(parcels[i].x, parcels[i].y, map)[2].y
                };
                
                console.log("score: ", score);
                scores.push(score);            
            }
            
            resolve(parcels);
        });  
    });

    scores.sort((a, b) => b[0] - a[0]); // Sort scores array in descending order
    const best_score = scores[0]; // Assign the first element as the best_score
    console.log("best_score: ", best_score);

    console.log("best_score_x: ", best_score.x);

    var path = findPath_BFS(me_x, me_y, best_score.x, best_score.y, map); // path to nearest parcel 

    console.log("path: ", path)

    for (var i = 0; i < path.length; i++) {
        var next_x = path[i].x;
        var next_y = path[i].y;
        
        if (next_x == me_x + 1) {
            await client.move('right');
        } else if (next_x == me_x - 1) {
            await client.move('left');
        } else if (next_y == me_y + 1) {
            await client.move('up');
        } else if (next_y == me_y - 1) {
            await client.move('down');
        }
        me_x = next_x;
        me_y = next_y;
    }
    
    await client.pickup();

    console.log("finito primo step");

    var path = findPath_BFS(best_score.x, best_score.y, best_score.x_del, best_score.y_del, map); // path to nearest parcel 

    for (var i = 0; i < path.length; i++) {
        var next_x = path[i].x;
        var next_y = path[i].y;
        
        if (next_x == me_x + 1) {
            await client.move('right');
        } else if (next_x == me_x - 1) {
            await client.move('left');
        } else if (next_y == me_y + 1) {
            await client.move('up');
        } else if (next_y == me_y - 1) {
            await client.move('down');
        }
        me_x = next_x;
        me_y = next_y;
    }
    
    await client.putdown();

}

agentLoop()
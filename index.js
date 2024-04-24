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
var deliveryCoordinates = [];


await client.onMap( (width, height, tiles) => {
    console.log('map', width, height, tiles);
    map = from_json_to_matrix(width, height, tiles, map);
    deliveryCoordinates = tiles.filter(t => t.delivery).map(t => ({x: t.x, y: t.y}));
    console.log("deliveryCoordinates: ", deliveryCoordinates);
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


    

    while(1){
        let scores = [];
        let score = 0;

        const start = Date.now();
        const beliefset = new Map();
        
        var AOD   //MANHATTAN distance
        client.onConfig( config => AOD = client.config.AGENTS_OBSERVATION_DISTANCE)
        var me;
        client.onYou(m => me = m);

        //[INFO] receve information when movo or when other agents move in my belief
        client.onAgentsSensing( ( agents ) => { 

            let timestamp = Date.now() - start;
            for ( let a of agents) {
                if (! beliefset.has(a.id)) {
                    beliefset.set( a.id, []);
                }
                a.timestamp = timestamp
                //compute direction
                const logs = beliefset.get(a.id)
                if (logs.length > 0) {
                    var previous = logs[logs.length-1]
                    if (previous.x < a.x) {
                        a.direction = 'right';
                    } else if (previous.x > a.x) {
                        a.direction = 'left';
                    } else if (previous.y < a.y) {
                        a.direction = 'up';
                    } else if (previous.y > a.y) {
                        a.direction = 'down';
                    } else {
                        a.direction = 'none';
                    }
                }
                beliefset.get(a.id).push(a);
            }
        } )

        const dist = (a1,a2) => Math.abs(a1.x-a2.x) + Math.abs(a1.y-a2.y)
        var min_score_parcel_agent = 0;
        var score_parcel_agent = 0;

        const _parcels = new Map();

        var sensing = await new Promise(resolve => {
            client.onParcelsSensing((parcels) => {
                console.log('parcels', parcels);
                for (var i = 0; i < parcels.length; i++) {
                    if(!_parcels.has(parcels[i].id)){
                        _parcels.set(parcels[i].id, parcels[i]);
                    } else {
                        _parcels.set(parcels[i].id, parcels[i]);
                    }
                    
                    for ( let a of beliefset.values() ) {
                        score_parcel_agent = manhattan(a.x, a.y, parcels[i].x, parcels[i].y)
                        if (score_parcel_agent < min_score_parcel_agent) {
                            min_score_parcel_agent = score_parcel_agent;
                        }
                    }

                    var intrinsic_score = parcels[i].reward - manhattan(me_x, me_y, parcels[i].x, parcels[i].y) - manhattan(parcels[i].x, parcels[i].y, find_nearest(parcels[i].x, parcels[i].y, map)[2].x, find_nearest(parcels[i].x, parcels[i].y, map)[2].x, find_nearest(parcels[i].x, parcels[i].y, map)[2].y)

                    if(intrinsic_score < 0) continue;


                    score = {
                        // reward of the parcel - distance from me to the parcel - distance from the parcel to the nearest delivery point
                        score: intrinsic_score + min_score_parcel_agent, 
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

        console.log("Sono Uscito dal sensing");
        
        if (scores.length > 0){
            console.log("I'm sorting");
        
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
                    await client.pickup();
                    for(let d of deliveryCoordinates){
                        if(d.x == next_x && d.y == next_y){
                            await client.putdown();
                        }
                    }
                } else if (next_x == me_x - 1) {
                    await client.move('left');
                    await client.pickup();
                    for(let d of deliveryCoordinates){
                        if(d.x == next_x && d.y == next_y){
                            await client.putdown();
                        }
                    }
                } else if (next_y == me_y + 1) {
                    await client.move('up');
                    await client.pickup();
                    for(let d of deliveryCoordinates){
                        if(d.x == next_x && d.y == next_y){
                            await client.putdown();
                        }
                    }
                } else if (next_y == me_y - 1) {
                    await client.move('down');
                    await client.pickup();
                    for(let d of deliveryCoordinates){
                        if(d.x == next_x && d.y == next_y){
                            await client.putdown();
                        }
                    }
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
                    await client.pickup();
                    for(let d of deliveryCoordinates){
                        if(d.x == next_x && d.y == next_y){
                            await client.putdown();
                        }
                    }
                } else if (next_x == me_x - 1) {
                    await client.move('left');
                    await client.pickup();
                    for(let d of deliveryCoordinates){
                        if(d.x == next_x && d.y == next_y){
                            await client.putdown();
                        }
                    }
                } else if (next_y == me_y + 1) {
                    await client.move('up');
                    await client.pickup();
                    for(let d of deliveryCoordinates){
                        if(d.x == next_x && d.y == next_y){
                            await client.putdown();
                        }
                    }
                } else if (next_y == me_y - 1) {
                    await client.move('down');
                    await client.pickup();
                    for(let d of deliveryCoordinates){
                        if(d.x == next_x && d.y == next_y){
                            await client.putdown();
                        }
                    }
                }
                me_x = next_x;
                me_y = next_y;
            }

            await client.putdown();
        }else{
            // vado nella delivery più vicina
            var path = findPath_BFS(me_x, me_y, find_nearest(me_x, me_y, map)[2].x, find_nearest(me_x, me_y, map)[2].y, map); // path to nearest parcel
            for (var i = 0; i < path.length; i++) {
                var next_x = path[i].x;
                var next_y = path[i].y;
                if (next_x == me_x + 1) {
                    await client.move('right');
                    await client.pickup();
                    for(let d of deliveryCoordinates){
                        if(d.x == next_x && d.y == next_y){
                            await client.putdown();
                        }
                    }
                } else if (next_x == me_x - 1) {
                    await client.move('left');
                    await client.pickup();
                    for(let d of deliveryCoordinates){
                        if(d.x == next_x && d.y == next_y){
                            await client.putdown();
                        }
                    }
                } else if (next_y == me_y + 1) {
                    await client.move('up');
                    await client.pickup();
                    for(let d of deliveryCoordinates){
                        if(d.x == next_x && d.y == next_y){
                            await client.putdown();
                        }
                    }
                } else if (next_y == me_y - 1) {
                    await client.move('down');
                    await client.pickup();
                    for(let d of deliveryCoordinates){
                        if(d.x == next_x && d.y == next_y){
                            await client.putdown();
                        }
                    }
                }
                me_x = next_x;
                me_y = next_y;
            }
        }
    }
    

}

agentLoop()

import { Agent } from "./agent.js";
import { distance, from_json_to_matrix, find_nearest, client, parcels, me } from "./utils.js";

var map = [];

var deliveryCoordinates = [];
await client.onMap( (width, height, tiles) => {
    map = from_json_to_matrix(width, height, tiles, map);
    deliveryCoordinates = tiles.filter(t => t.delivery).map(t => ({x: t.x, y: t.y}));
});

const beliefset = new Map();

client.onAgentsSensing( ( agents ) => {
    
    for(let a of agents){
        beliefset.set(a.id, a);
    }
    // console.log("\nBELIEFSET:\n")
    let array = Array.from(beliefset.values()).map( ( {id, name, x, y, score} ) => {
        return `${name} (${id} - ${score}): ${x},${y}`;    
    }).join(' ')
    // console.log("\n")
    // console.log(array);
    
} )

/**
 * Beliefset revision loop
 */
function agentLoop() {

    // belief_revision_function()
    // const options = options() // desire pick up parcel p1 or p2
    // const selected = select(options) // p1 is closer!
    // intention_queue.push( [ selected.intention, selected.args ] );
    
    
    const options = [];
    for (const [id, parcell] of parcels.entries()) {
        if (!parcell.carriedBy) {

            let score = parcell.reward;

            var intrinsic_score = 0;
            intrinsic_score = score - distance(parcell, me) - distance(parcell, find_nearest(parcell.x, parcell.y, map)[2]);          // reward - distance from me to the parcel - distance from the parcel to the nearest delivery point

            if(intrinsic_score < 0)             //se l'intrinsic score è < 0 ignoro la parcella
                continue;

            var util = intrinsic_score;


            if(beliefset.size > 0){

                // console.log("\n\n-----> BELIEFSET SIZE: ", beliefset.size)
                // console.log("-----> BELIEFSET: ", beliefset, "\n\n")
                var min_score_parcel_agent = Number.MAX_VALUE;

                for(let a of beliefset.values()){
                    // console.log("\n\n-----> AGENT: ", a, "\n\n")
                    // console.log("\n\n-----> a.x: ", a.x, ", a.y: ", a.y, "\n\n")
                    var score_parcel_agent = distance(a, parcell);
                    if (score_parcel_agent < min_score_parcel_agent) {
                        min_score_parcel_agent = score_parcel_agent;
                    }
                }

                // console.log("\n\n-----> min_score_parcel_agent: ", min_score_parcel_agent, "\n\n")
                util += min_score_parcel_agent;
            }

            // console.log("\n\nUTILITY: ", utility, "\n\n")

            options.push({
                desire: 'go_pick_up',
                args: [parcell],
                utility: util
            })

            console.log("parcel args:", parcell)
        }
    }


    /**
     * Select best intention
     */
    
    let best_option = null;
    let nearest_distance = Number.MAX_VALUE;
    for (const option of options) {
        
        let parcel = option.args[0];
        let score = option.args[0].reward;
        
        const dist = distance(me, parcel);
        if (dist < nearest_distance && score > 2) {
            nearest_distance = dist;
            best_option = option;
        }
    }

    /**
     * Revise/queue intention 
     */
    if (best_option) {

        myAgent.push(best_option.desire, ...best_option.args, best_option.utility); 
        myAgent.push('go_put_down', [])

        // console.log("queue", myAgent.intention_queue)
            
    }
}
client.onParcelsSensing( agentLoop )
// client.onAgentsSensing( agentLoop )
// client.onYou( agentLoop )


const myAgent = new Agent()
myAgent.intentionLoop()
// setTimeout(() => {
//     // Code to be executed after 2 seconds
//     myAgent.push('go_pick_up', {x:2, y:2})
// }, 2000);



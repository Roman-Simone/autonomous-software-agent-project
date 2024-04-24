import { Agent } from "./agent.js";
import { client, parcels, distance, me } from "./utils.js";


/**
 * Beliefset revision loop
 */
function agentLoop() {

    // belief_revision_function()
    // const options = options() // desire pick up parcel p1 or p2
    // const selected = select(options) // p1 is closer!
    // intention_queue.push( [ selected.intention, selected.args ] );

    console.log("parcels", parcels.entries())

    
    const options = [];
    for (const [id, parcell] of parcels.entries()) {
        if (!parcell.carriedBy) {
            options.push({
                desire: 'go_pick_up',
                args: [parcell]
            })
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
        console.log("parcel", option)
        
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

        if (!(best_option.args[0].x == me.x && best_option.args[0].y == me.y)) {
            console.log("\n****** NEW OPTION ******")
            console.log('best_option', best_option)
            


            myAgent.push(best_option.desire, ...best_option.args);

            // myAgent.push('go_put_down', [])


            console.log("queue", myAgent.intention_queue)
            console.log("***********************\n")
        }
        
    }
}
client.onParcelsSensing( agentLoop )
// client.onAgentsSensing( agentLoop )
// client.onYou( agentLoop )


const myAgent = new Agent()
myAgent.intentionLoop()

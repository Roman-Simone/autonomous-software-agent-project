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
    
    let best_option;
    let nearest_distance = Number.MAX_VALUE;
    for (const option of options) {
        if (option.desire != 'go_pick_up') continue;
        let parcel = option.args[0];
        const dist = distance(me, parcel);
        if (dist < nearest_distance) {
            nearest_distance = dist;
            best_option = option;
        }
    }

    /**
     * Revise/queue intention 
     */
    if (best_option) {
        myAgent.queue(best_option.desire, ...best_option.args);

    }
}
client.onParcelsSensing( agentLoop )
// client.onAgentsSensing( agentLoop )
// client.onYou( agentLoop )


const myAgent = new Agent()
myAgent.intentionLoop()

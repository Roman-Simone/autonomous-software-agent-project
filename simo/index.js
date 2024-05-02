import { Agent } from "./agent.js";
import { distance, from_json_to_matrix, find_nearest, client, parcels, me } from "./utils.js";

var map = [];

var deliveryCoordinates = [];
await client.onMap((width, height, tiles) => {
    map = from_json_to_matrix(width, height, tiles, map);
    deliveryCoordinates = tiles.filter(t => t.delivery).map(t => ({ x: t.x, y: t.y }));
});

// const beliefset = new Map();

// client.onAgentsSensing((agents) => {

//     for (let a of agents) {
//         beliefset.set(a.id, a);
//     }
 
//     let array = Array.from(beliefset.values()).map(({ id, name, x, y, score }) => {
//         return `${name} (${id} - ${score}): ${x},${y}`;
//     }).join(' ')

// })

/**
 * Beliefset revision loop
 */
function agentLoop() {


    const options = [];
    for (const [id, parcell] of parcels.entries()) {
        if (!parcell.carriedBy) {

            let score = parcell.reward;
            var intrinsic_score = 0;

            intrinsic_score = score;

            if (intrinsic_score > 2) {

                options.push({
                    desire: 'go_pick_up',
                    args: [parcell],
                    utility: intrinsic_score
                })

            }

        }
    }


    /**
     * Select best intention
     */

    let best_option = null;
    let best_utility = Number.MIN_VALUE;
    for (const option of options) {

        let score = option.utility;

        if (best_utility < score && score > 2) {
            best_utility = score;
            best_option = option;
        }
    }

    /**
     * Revise/queue intention 
     */
    if (best_option) {

        myAgent.push(best_option.desire, ...best_option.args, best_option.utility);
        
        myAgent.push('go_put_down', [], 15)

    }
}
client.onParcelsSensing(agentLoop)
// client.onAgentsSensing( agentLoop )
// client.onYou( agentLoop )


const myAgent = new Agent()
myAgent.intentionLoop()

import { client } from "../socketConnection.js"
import { MyData, MyMap } from "../belief/belief.js";
import { positionsEqual, readFile } from "./utils_planner.js";
import { Intention } from '../intention&revision/intention.js';
import { PddlProblem, onlineSolver } from "@unitn-asa/pddl-client";

// Read the domain file for the PDDL planner
let domain = await readFile('./planners/domain.pddl');


/**
 * Plan class
 */
class Plan {

    // This is used to stop the plan
    #stopped = false;
    stop() {
        // this.log( 'stop plan' );
        this.#stopped = true;
        for (const i of this.#sub_intentions) {
            i.stop();
        }
    }
    get stopped() {
        return this.#stopped;
    }

    /**
     * #parent refers to caller
     */

    #parent;

    constructor(parent) {
        this.#parent = parent;
    }

    log(...args) {
        if (this.#parent && this.#parent.log)
            this.#parent.log('\t', ...args)
        else
            console.log(...args)
    }

    // this is an array of sub intention. Multiple ones could eventually being achieved in parallel.
    #sub_intentions = [];

    async subIntention(predicate) {
        const sub_intention = new Intention(this, predicate);
        this.#sub_intentions.push(sub_intention);
        return await sub_intention.achieve();
    }

}

/**
 * PddlMove class that extends Plan, used to move the agent to a specific position
 */
class PddlMove extends Plan {

    static isApplicableTo(go_to, x, y) {
        return go_to == 'go_to';
    }

    async execute(go_to, x, y) {
        // Define the PDDL goal
        let goal = 'at t' + x + '_' + y;
        
        // Update the beliefset with the map updated with position of enemies and others...
        MyMap.updateBeliefset();

        // Create the PDDL problem
        var pddlProblem = new PddlProblem(
            'deliveroo',
            MyMap.myBeliefset.objects.join(' '),
            MyMap.myBeliefset.toPddlString() + ' ' + '(at t' + MyData.pos.x + '_' + MyData.pos.y + ')',
            goal
        );

        let problem = pddlProblem.toPddlString();

        // Get the plan from the online solver
        var plan = await onlineSolver(domain, problem);

        // Parse the plan to get the path
        let path = []
        plan.forEach(action => {
            let end = action.args[1].split('_');
            path.push({
                x: parseInt(end[0].substring(1)),
                y: parseInt(end[1])
            });
        });

        // Set the countStacked to 1 if the agent is a SLAVE, otherwise to 12
        // We use two different stucked because if the MASTER Stuck the SLAVE the SLAVE escape before the MASTER 
        if (MyData.role == "MASTER") {
            var countStacked = 12
        }
        else{
            var countStacked = 2
        }
        
        // Get the deliveries and parcels on the path to pick up or put down is pass through them
        let deliveriesOnPath = [];
        let parcelsOnPath = [];

        for (let del of MyMap.deliveryCoordinates) {
            for (let p of path) {
                if (del.x == p.x && del.y == p.y) {
                    deliveriesOnPath.push(del);
                }
            }
        }

        for (let par of MyData.parcels) {
            for (let p of path) {
                if (par.x == p.x && par.y == p.y && (p.x != x && p.y != y)) {
                    parcelsOnPath.push(par);
                    // console.log("Parcel on path: ", par)
                }
            }
        }

        // Start moving the agent to the target position
        while (MyData.pos.x != x || MyData.pos.y != y) {

            // Check if the agent is on a delivery point or a parcel point
            if (deliveriesOnPath.some(del => positionsEqual(del, MyData.pos))) {
                if (this.stopped) throw ['stopped']; // if stopped then quit
                await client.putdown()
                if (this.stopped) throw ['stopped']; // if stopped then quit
            }

            if (parcelsOnPath.some(par => positionsEqual(par, MyData.pos))) {

                if (this.stopped) throw ['stopped']; // if stopped then quit
                // Pickup the parcel
                await client.pickup();
                if (this.stopped) throw ['stopped']; // if stopped then quit

                // Add parcels to MyData.parcelsInMind if they match the current position
                parcelsOnPath.forEach(par => {
                    if (par.x === MyData.pos.x && par.y === MyData.pos.y) {
                        MyData.parcelsInMind.push(par.id);
                    }
                });

                if (this.stopped) throw ['stopped']; // if stopped then quit
            }

            // Get the next coordinate to move to
            let coordinate = path.shift()
            let status_x = false;
            let status_y = false;

            if (coordinate.x == MyData.pos.x && coordinate.y == MyData.pos.y) {
                continue;
            }

            if (coordinate.x > MyData.pos.x)
                status_x = await client.move('right')
            else if (coordinate.x < MyData.pos.x)
                status_x = await client.move('left')

            if (status_x) {
                MyData.pos.x = status_x.x;
                MyData.pos.y = status_x.y;
            }

            if (this.stopped) throw ['stopped']; // if stopped then quit

            if (coordinate.y > MyData.pos.y)
                status_y = await client.move('up')
            else if (coordinate.y < MyData.pos.y)
                status_y = await client.move('down')

            if (status_y) {
                MyData.pos.x = status_y.x;
                MyData.pos.y = status_y.y;
            }

            // If the agent is stucked, wait for 500ms and try again
            if (!status_x && !status_y) {
                this.log('stucked ', countStacked);
                await timeout(500)
                if (countStacked <= 0) {
                    throw 'stopped';
                } else {
                    countStacked -= 1;
                }

            } else if (MyData.pos.x == x && MyData.pos.y == y) {
                // this.log('target reached');
            }
        }
        return true;
    }
}

/**
 * PddlPickUp class that extends Plan, used to pick up a parcel
 */
class PddlPickUp extends Plan {
    static isApplicableTo(go_pick_up, x, y) {
        return go_pick_up == 'go_pick_up';
    }

    async execute(go_pick_up, x, y) {

        // Check if the agent is on the parcel position and pick it up 
        if (MyData.pos.x == x && MyData.pos.y == y) {
            if (this.stopped) throw ['stopped']; // if stopped then quit
            await client.pickup()
            if (this.stopped) throw ['stopped']; // if stopped then quit
            return true;
        }

        // Move the agent to the parcel position and pick it up
        if (this.stopped) throw ['stopped']; // if stopped then quit
        await this.subIntention(['go_to', x, y]);
        if (this.stopped) throw ['stopped']; // if stopped then quit
        await client.pickup()
        if (this.stopped) throw ['stopped']; // if stopped then quit

        return true;
    }
}

/**
 * PddlPutDown class that extends Plan, used to put down a parcel
 */
class PddlPutDown extends Plan {

    static isApplicableTo(go_put_down, x, y) {
        return go_put_down == 'go_put_down';
    }

    async execute(go_put_down, x, y) {

        // Check if the agent is on the delivery point and put down the parcel
        if (MyData.pos.x == x && MyData.pos.y == y) {
            if (this.stopped) throw ['stopped']; // if stopped then quit
            await client.putdown()
            if (this.stopped) throw ['stopped']; // if stopped then quit
            return true;
        }

        // Move the agent to the delivery point and put down the parcel
        if (this.stopped) throw ['stopped']; // if stopped then quit
        await this.subIntention(['go_to', x, y]);
        if (this.stopped) throw ['stopped']; // if stopped then quit
        await client.putdown()
        if (this.stopped) throw ['stopped']; // if stopped then quit
        
        return true;
    }
}

/**
 * GoRandomDelivery class that extends Plan, used to move the agent to a random spawn point or delivery point
 */
class GoRandomDelivery extends Plan {
    static isApplicableTo(go_random_delivery, x, y, id, utility) {
        return go_random_delivery == 'go_random_delivery';
    }

    async execute(go_random_delivery, x, y) {

        if (this.stopped) throw ['stopped']; // if stopped then quit
        await this.subIntention(['go_to', x, y]);
        if (this.stopped) throw ['stopped']; // if stopped then quit
        return true;
    }
}


function timeout(mseconds) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, mseconds);
    });
}

// Array of plans
const plans = [];

plans.push(PddlMove)
plans.push(PddlPickUp)
plans.push(PddlPutDown)
plans.push(GoRandomDelivery)


export { plans };

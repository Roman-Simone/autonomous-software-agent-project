import { client } from "../socketConnection.js"
import { positionsEqual, readFile } from "./utils_planner.js";
import { Intention } from '../intention&revision/intention.js';
import { MyData, MyMap } from "../belief/belief.js";
import { PddlProblem, onlineSolver } from "@unitn-asa/pddl-client";

let domain = await readFile('./planners/domain.pddl');

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

class PddlMove extends Plan {

    static isApplicableTo(go_to, x, y) {
        return go_to == 'go_to';
    }

    async execute(go_to, x, y) {
        // Define the PDDL goal
        let goal = 'at t' + x + '_' + y;

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

        // console.log("Plan:", plan);

        let path = []
        plan.forEach(action => {
            let end = action.args[1].split('_');
            path.push({
                x: parseInt(end[0].substring(1)),
                y: parseInt(end[1])
            });
        });

        console.log("\n\nPath: ", path.length, "\n\n");

        // console.log("\n\nPath: ", path, "\n\n");

        let countStacked = 3

        let deliveriesOnPath = [];

        for (let del of MyMap.deliveryCoordinates) {
            for (let p of path) {
                if (del.x == p.x && del.y == p.y) {
                    deliveriesOnPath.push(del);
                }
            }
        }


        while (MyData.pos.x != x || MyData.pos.y != y) {

            // console.log("PASSO EFFETTUATO")

            if (deliveriesOnPath.some(del => positionsEqual(del, MyData.pos))) {
                if (this.stopped) throw ['stopped']; // if stopped then quit
                await client.putdown()
                if (this.stopped) throw ['stopped']; // if stopped then quit
            }

            let coordinate = path.shift()
            let status_x = false;
            let status_y = false;

            if (coordinate.x == MyData.pos.x && coordinate.y == MyData.pos.y) {
                continue;
            }

            if (coordinate.x > MyData.pos.x)
                status_x = await client.move('right')
            // status_x = await this.subIntention( 'go_to', {x: me.x+1, y: me.y} );
            else if (coordinate.x < MyData.pos.x)
                status_x = await client.move('left')
            // status_x = await this.subIntention( 'go_to', {x: me.x-1, y: me.y} );

            if (status_x) {
                MyData.pos.x = status_x.x;
                MyData.pos.y = status_x.y;
            }

            if (this.stopped) throw ['stopped']; // if stopped then quit

            if (coordinate.y > MyData.pos.y)
                status_y = await client.move('up')
            // status_x = await this.subIntention( 'go_to', {x: me.x, y: me.y+1} );
            else if (coordinate.y < MyData.pos.y)
                status_y = await client.move('down')
            // status_x = await this.subIntention( 'go_to', {x: me.x, y: me.y-1} );

            if (status_y) {
                MyData.pos.x = status_y.x;
                MyData.pos.y = status_y.y;
            }

            if (!status_x && !status_y) {
                this.log('stucked ', countStacked);
                //await this.subIntention( 'go_to', {x: x, y: y} );
                await timeout(1000)
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

class PddlPickUp extends Plan {
    static isApplicableTo(go_pick_up, x, y) {
        return go_pick_up == 'go_pick_up';
    }

    async execute(go_pick_up, x, y) {

        if (MyData.pos.x == x && MyData.pos.y == y) {
            if (this.stopped) throw ['stopped']; // if stopped then quit
            await client.pickup()
            if (this.stopped) throw ['stopped']; // if stopped then quit
            return true;
        }

        if (this.stopped) throw ['stopped']; // if stopped then quit
        await this.subIntention(['go_to', x, y]);
        if (this.stopped) throw ['stopped']; // if stopped then quit
        await client.pickup()
        if (this.stopped) throw ['stopped']; // if stopped then quit
        return true;
        // await this.subIntention( 'go_put_down');
    }
}


class PddlPutDown extends Plan {

    static isApplicableTo(go_put_down, x, y) {
        return go_put_down == 'go_put_down';
    }

    async execute(go_put_down, x, y) {

        if (MyData.pos.x == x && MyData.pos.y == y) {
            if (this.stopped) throw ['stopped']; // if stopped then quit
            await client.putdown()
            if (this.stopped) throw ['stopped']; // if stopped then quit
            return true;
        }

        if (this.stopped) throw ['stopped']; // if stopped then quit
        await this.subIntention(['go_to', x, y]);
        if (this.stopped) throw ['stopped']; // if stopped then quit
        await client.putdown()
        if (this.stopped) throw ['stopped']; // if stopped then quit
        return true;

    }

}

class GoRandomDelivery extends Plan {
    static isApplicableTo(go_random_delivery, x, y, id, utility) {
        return go_random_delivery == 'go_random_delivery';
    }

    async execute(go_random_delivery, x, y) {

        if (this.stopped) throw ['stopped']; // if stopped then quit
        await this.subIntention(['go_to', x, y]);
        if (this.stopped) throw ['stopped']; // if stopped then quit
        await client.putdown()
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


const plans = [];

plans.push(PddlMove)
plans.push(PddlPickUp)
plans.push(PddlPutDown)
plans.push(GoRandomDelivery)


export { plans };
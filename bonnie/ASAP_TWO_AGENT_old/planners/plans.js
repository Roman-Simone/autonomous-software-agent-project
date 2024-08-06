import { client } from "../socketConnection.js"
import { readFile } from "./utils_planner.js";
import { Intention } from '../intention&revision/intention.js';
import { CollaboratorData, MyData, MyMap } from "../belief/belief.js";
import { PddlProblem, onlineSolver, Beliefset } from "@unitn-asa/pddl-client";


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
        let goal = 'at ' + MyData.name + ' ' + 't' + x + '_' + y;

        // Create the PDDL problem
        var pddlProblem = new PddlProblem(
            'deliveroo',
            MyMap.myBeliefset.objects.join(' ') + ' ' + MyData.name,
            MyMap.myBeliefset.toPddlString() + ' ' + '(me ' + MyData.name + ')' + '(at ' + MyData.name + ' ' + 't' + MyData.pos.x + '_' + MyData.pos.y + ')',
            goal
        );

        let problem = pddlProblem.toPddlString();

        // Get the plan from the online solver
        var plan = await onlineSolver(domain, problem);


        let path = []
        plan.forEach(action => {
            let end = action.args[2].split('_');
            path.push({
                x: parseInt(end[0].substring(1)),
                y: parseInt(end[1])
            });
        });

        let countStacked = 3


        while (MyData.pos.x != x || MyData.pos.y != y) {
            if (MyMap[MyData.pos.x][MyData.pos.y] == 2){
                if (this.stopped) throw ['stopped']; // if stopped then quit
                    await client.putdown();
                if (this.stopped) throw ['stopped']; // if stopped then quit
            }

            if (this.stopped) throw ['stopped']; // if stopped then quit
                await client.pickup()

            if (this.stopped) throw ['stopped']; // if stopped then quit

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

        // Find the parcel at the destination
        let parcel = Array.from(MyData.parcels.values()).find(p => p.x === x && p.y === y);
        if (!parcel) {
            parcel = Array.from(CollaboratorData.parcels.values()).find(p => p.x === x && p.y === y);
        }
        if (!parcel) {
            throw new Error('No parcel found at the destination');
        }

        // Define the PDDL goal
        let goal = 'holding ' + MyData.name + ' ' + parcel.id;



        // Create the PDDL problem
        var pddlProblem = new PddlProblem(
            'deliveroo',
            MyMap.myBeliefset.objects.join(' ') + ' ' + MyData.name + ' ' + parcel.id,
            MyMap.myBeliefset.toPddlString() + ' ' + '(me ' + MyData.name + ')' + '(at ' + MyData.name + ' ' + 't' + MyData.pos.x + '_' + MyData.pos.y + ')' + ' (parcel ' + parcel.id + ')' + ' (at ' + parcel.id + ' t' + x + '_' + y + ')',
            goal
        );
        

        let problem = pddlProblem.toPddlString();


        // console.log("map: ", MyData.printMapAsTable())
        // console.log("problem: ", MyData.myBeliefset.toPddlString())

        // Get the plan from the online solver
        var plan = await onlineSolver(domain, problem);
        console.log("PICKUP---> 5");

        let path = [];
        plan.forEach(action => {

            if (action.action == 'PICK-UP') {
                path.push({
                    x: x,
                    y: y,
                    info: "Pickup"
                })
            }

            else {
                let end = action.args[2].split('_');
                path.push({
                    x: parseInt(end[0].substring(1)),
                    y: parseInt(end[1]),
                    info: "Move"
                });
            }
        });

        let countStacked = 3;
        var pick_up_flag = false;


        while (MyData.pos.x != x || MyData.pos.y != y || pick_up_flag != true) {

            if (MyMap[MyData.pos.x][MyData.pos.y] == 2){
                if (this.stopped) throw ['stopped']; // if stopped then quit
                    await client.putdown();
                if (this.stopped) throw ['stopped']; // if stopped then quit
            }

            if (this.stopped) throw ['stopped']; // if stopped then quit
                await client.pickup()
            if (this.stopped) throw ['stopped']; // if stopped then quit

            let coordinate = path.shift()
            let status_x = false;
            let status_y = false;

            if (coordinate.info == "Pickup") {

                await client.pickup()
                pick_up_flag = true;
            }

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


class PddlPutDown extends Plan {
    static isApplicableTo(go_put_down, x, y) {
        return go_put_down == 'go_put_down';
    }

    async execute(go_put_down, x, y) {
        // Define the PDDL goal
        let goal = 'posing ' + 't' + x + '_' + y;

        // Create the PDDL problem
        var pddlProblem = new PddlProblem(
            'deliveroo',
            MyMap.myBeliefset.objects.join(' ') + ' ' + MyData.name,
            MyMap.myBeliefset.toPddlString() + ' ' + '(me ' + MyData.name + ')' + '(at ' + MyData.name + ' ' + 't' + MyData.pos.x + '_' + MyData.pos.y + ')',
            goal
        );

        let problem = pddlProblem.toPddlString();
        // Get the plan from the online solver
        var plan = await onlineSolver(domain, problem);

        let path = [];
        plan.forEach(action => {

            if (action.action == 'PUT-DOWN') {
                path.push({
                    x: x,
                    y: y,
                    info: "Deliver"
                })
            }

            else {
                let end = action.args[2].split('_');
                path.push({
                    x: parseInt(end[0].substring(1)),
                    y: parseInt(end[1]),
                    info: "Move"
                });
            }
        });

        let countStacked = 3;
        var deliver_flag = false;

        while (MyData.pos.x != x || MyData.pos.y != y || deliver_flag != true) {

            if (MyMap[MyData.pos.x][MyData.pos.y] == 2){
                if (this.stopped) throw ['stopped']; // if stopped then quit
                    await client.putdown();
                if (this.stopped) throw ['stopped']; // if stopped then quit
            }

            if (this.stopped) throw ['stopped']; // if stopped then quit
                await client.pickup()
            if (this.stopped) throw ['stopped']; // if stopped then quit

            let coordinate = path.shift();
            let status_x = false;
            let status_y = false;

            if (coordinate.info == "Deliver") {
                await client.putdown();
                deliver_flag = true;
            }

            if (coordinate.x == MyData.pos.x && coordinate.y == MyData.pos.y) {
                continue;
            }

            if (coordinate.x > MyData.pos.x)
                status_x = await client.move('right');
            else if (coordinate.x < MyData.pos.x)
                status_x = await client.move('left');

            if (status_x) {
                MyData.pos.x = status_x.x;
                MyData.pos.y = status_x.y;
            }

            if (this.stopped) throw ['stopped']; // if stopped then quit

            if (coordinate.y > MyData.pos.y)
                status_y = await client.move('up');
            else if (coordinate.y < MyData.pos.y)
                status_y = await client.move('down');

            if (status_y) {
                MyData.pos.x = status_y.x;
                MyData.pos.y = status_y.y;
            }

            if (!status_x && !status_y) {
                this.log('stucked ', countStacked);
                await timeout(1000);
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
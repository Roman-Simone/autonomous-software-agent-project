
import { info } from 'console';
import { Intention } from './intention.js';
import { me, client, findPath_BFS, deliveryCoordinates, find_nearest_delivery, parcels, find_random_delivery } from './utils.js';
export { plans, Plan };
import { PddlDomain, PddlAction, PddlProblem, PddlExecutor, onlineSolver, Beliefset } from "@unitn-asa/pddl-client";
import fs from 'fs';



/**
 * Plan library
 */
async function check_tile(x, y){
    for(let parcel of parcels){
        if(x == parcel.x && y == parcel.y){
            await client.pickup()
        }
    }

    for(let del of deliveryCoordinates){
        if(x == del.x && y == del.y){
            await client.putdown()
        }
    }
}

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

class GoPickUp extends Plan {

    static isApplicableTo(go_pick_up, x, y, id, score) {
        return go_pick_up == 'go_pick_up';
    }

    async execute(go_pick_up, x, y) {
        if (this.stopped) throw ['stopped']; // if stopped then quit
        await this.subIntention(['go_to', x, y]);
        if (this.stopped) throw ['stopped']; // if stopped then quit
        await client.pickup()
        if (this.stopped) throw ['stopped']; // if stopped then quit
        return true;
        // await this.subIntention( 'go_put_down');
    }
}

class GoPutDown extends Plan {

    static isApplicableTo(go_put_down, x, y, id, utility) {
        return go_put_down == 'go_put_down';
    }

    async execute(go_put_down, x, y) {
        let nearest_delivery = { x: -1, y: -1 };
        var x = -1;
        var y = -1;
        if (this.stopped) throw ['stopped']; // if stopped then quit
        nearest_delivery = find_nearest_delivery();
        x = nearest_delivery.x;
        y = nearest_delivery.y;

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
        let nearest_delivery = { x: -1, y: -1 };
        var x = -1;
        var y = -1;
        if (this.stopped) throw ['stopped']; // if stopped then quit
        nearest_delivery = find_random_delivery();
        x = nearest_delivery.x;
        y = nearest_delivery.y;

        if (this.stopped) throw ['stopped']; // if stopped then quit
        await this.subIntention(['go_to', x, y]);
        if (this.stopped) throw ['stopped']; // if stopped then quit
        await client.putdown()
        if (this.stopped) throw ['stopped']; // if stopped then quit
        return true;
    }
}

class GoToBFS extends Plan {
    static isApplicableTo(go_to_BFS, x, y, id, utility) {
        return go_to_BFS == 'go_to_BFS';
    }

    async execute(go_to_BFS, x, y) {
        var path = findPath_BFS(x, y);

        for (var i = 1; i < path.length; i++) {
            if (this.stopped) throw ['stopped']; // if stopped then quit
            await client.pickup()
            if (this.stopped) throw ['stopped']; // if stopped then quit

            var next_x = path[i].x;
            var next_y = path[i].y;

            let status_x = false;
            let status_y = false;

            if (next_x == me.x + 1) {
                status_x = await client.move('right');
            }
            else if (next_x == me.x - 1) {
                status_x = await client.move('left');
            }

            if (status_x) {
                me.x = status_x.x;
                me.y = status_x.y;
                check_tile(next_x, next_y)
            }
            if (this.stopped) throw ['stopped']; // if stopped then quit

            if (next_y == me.y + 1) {
                status_y = await client.move('up');
            }
            else if (next_y == me.y - 1) {
                status_y = await client.move('down');
            }

            if (status_y) {
                me.x = status_y.x;
                me.y = status_y.y;
                check_tile(next_x, next_y)
            }

            if (!status_x && !status_y) {
                console.log('Failed moving')
                throw 'stucked';
            }
        }
    }
}
function readFile ( path ) {
    
    return new Promise( (res, rej) => {

        fs.readFile( path, 'utf8', (err, data) => {
            if (err) rej(err)
            else res(data)
        })

    })

}

const myBeliefset = new Beliefset();
client.onMap((width, height, tiles) => {
    
    for (let { x, y, delivery } of tiles) {
        myBeliefset.declare('tile t' + x + '_' + y);
        if (delivery) {
            myBeliefset.declare('delivery t' + x + '_' + y);
        }
        

        // Find the tile to the right
        let right = tiles.find(tile => tile.x === x + 1 && tile.y === y);
        if (right) {
            myBeliefset.declare('right t' + x + '_' + y + ' t' + right.x + '_' + right.y);
        }

        // Find the tile to the left
        let left = tiles.find(tile => tile.x === x - 1 && tile.y === y);
        if (left) {
            myBeliefset.declare('left t' + x + '_' + y + ' t' + left.x + '_' + left.y);
        }

        // Find the tile above
        let up = tiles.find(tile => tile.x === x && tile.y === y - 1);
        if (up) {
            myBeliefset.declare('up t' + x + '_' + y + ' t' + up.x + '_' + up.y);
        }

        // Find the tile below
        let down = tiles.find(tile => tile.x === x && tile.y === y + 1);
        if (down) {
            myBeliefset.declare('down t' + x + '_' + y + ' t' + down.x + '_' + down.y);
        }
    }
});

let domain = await readFile('./domain.pddl');


class PddlMove extends Plan{

    static isApplicableTo ( go_to, x, y ) {
        return go_to == 'go_to';
        
    }

    async execute ( go_to, x, y ) {


        // Define the PDDL goal
        let goal = 'at ' + me.name + ' ' + 't' + x + '_' + y;

        // Create the PDDL problem
        var pddlProblem = new PddlProblem(
            'deliveroo',
            myBeliefset.objects.join(' ') + ' ' + me.name,
            myBeliefset.toPddlString() + ' ' + '(me ' + me.name + ')' + '(at ' + me.name + ' ' + 't' + me.x + '_' + me.y + ')',
            goal
        );

        let problem = pddlProblem.toPddlString();
        // console.log('------------------problem------------------');
        // console.log(problem);
        // Get the plan from the online solver
        var plan = await onlineSolver(domain, problem);
        // console.log('------------------plan------------------');
        // console.log(plan);
        
        let path = []
        plan.forEach(action => {
            let end = action.args[2].split('_');   
            path.push({
                x: parseInt(end[0].substring(1)), 
                y: parseInt(end[1])                  
            });
        });

        let countStacked = 3
        console.log("path:")
        console.log(path)

        while ( me.x != x || me.y != y ) {
            
            if ( this.stopped ) throw ['stopped']; // if stopped then quit

            let coordinate = path.shift()
            //console.log(coordinate[0],coordinate[1])
            let status_x = false;
            let status_y = false;
            
            if(coordinate.x == me.x && coordinate.y == me.y){
                continue;
            }

            if ( coordinate.x > me.x )
                status_x = await client.move('right')
                // status_x = await this.subIntention( 'go_to', {x: me.x+1, y: me.y} );
            else if ( coordinate.x < me.x )
                status_x = await client.move('left')
                // status_x = await this.subIntention( 'go_to', {x: me.x-1, y: me.y} );

            if (status_x) {
                me.x = status_x.x;
                me.y = status_x.y;
            }

            if ( this.stopped ) throw ['stopped']; // if stopped then quit

            if ( coordinate.y > me.y )
                status_y = await client.move('up')
                // status_x = await this.subIntention( 'go_to', {x: me.x, y: me.y+1} );
            else if ( coordinate.y < me.y )
                status_y = await client.move('down')
                // status_x = await this.subIntention( 'go_to', {x: me.x, y: me.y-1} );

            if (status_y) {
                me.x = status_y.x;
                me.y = status_y.y;
            }
            
            if ( ! status_x && ! status_y) {
                this.log('stucked ', countStacked);
                //await this.subIntention( 'go_to', {x: x, y: y} );
                await timeout(1000)
                if(countStacked <= 0){
                    throw 'stopped'; 
                }else{
                    countStacked -= 1;
                }

            } else if ( me.x == x && me.y == y ) {
                // this.log('target reached');
            }
        }
        return true;
    }
}

class PddlPickUp extends Plan{
    static isApplicableTo ( go_to, x, y ) {
        return go_to == 'go_pick_up';
        
    }

    async execute ( go_to, x, y ) {


        // Find the parcel at the destination
        let parcel = Array.from(parcels.values()).find(p => p.x === x && p.y === y);
        if (!parcel) {
            throw new Error('No parcel found at the destination');
        }

        // Define the PDDL goal
        let goal = 'holding ' + me.name + ' ' + parcel.id;

        // Create the PDDL problem
        var pddlProblem = new PddlProblem(
            'deliveroo',
            myBeliefset.objects.join(' ') + ' ' + me.name + ' ' + parcel.id,
            myBeliefset.toPddlString() + ' ' + '(me ' + me.name + ')' + '(at ' + me.name + ' ' + 't' + me.x + '_' + me.y + ')' + ' (parcel ' + parcel.id + ')' + ' (at ' + parcel.id + ' t' + x + '_' + y + ')',
            goal
        );

        let problem = pddlProblem.toPddlString();
        // console.log('------------------problem------------------');
        // console.log(problem);
        // Get the plan from the online solver
        var plan = await onlineSolver(domain, problem);
        
        let path = [];
        plan.forEach(action => {
            console.log("action:");
            console.log(action);

            if (action.action == 'PICK-UP') {
                console.log("ADDDDDDDDDD Pickup")
                path.push({
                    x: x,
                    y: y,
                    info: "Pickup"
                })
            }

            else{
                let end = action.args[2].split('_');
                path.push({
                    x: parseInt(end[0].substring(1)), 
                    y: parseInt(end[1]),
                    info: "Move"                 
                });
            }
        });

        let countStacked = 3;
        console.log("path:");
        console.log(path);
        var pick_up_flag = false;


        while ( me.x != x || me.y != y || pick_up_flag != true) {
            
            if ( this.stopped ) throw ['stopped']; // if stopped then quit

            let coordinate = path.shift()
            //console.log(coordinate[0],coordinate[1])
            let status_x = false;
            let status_y = false;
            console.log("--------INFO--------")
            console.log(coordinate.info)

            if(coordinate.info == "Pickup"){
                
                await client.pickup()
                pick_up_flag = true;
            }

            if(coordinate.x == me.x && coordinate.y == me.y){
                continue;
            }

            if ( coordinate.x > me.x )
                status_x = await client.move('right')
                // status_x = await this.subIntention( 'go_to', {x: me.x+1, y: me.y} );
            else if ( coordinate.x < me.x )
                status_x = await client.move('left')
                // status_x = await this.subIntention( 'go_to', {x: me.x-1, y: me.y} );

            if (status_x) {
                me.x = status_x.x;
                me.y = status_x.y;
            }

            if ( this.stopped ) throw ['stopped']; // if stopped then quit

            if ( coordinate.y > me.y )
                status_y = await client.move('up')
                // status_x = await this.subIntention( 'go_to', {x: me.x, y: me.y+1} );
            else if ( coordinate.y < me.y )
                status_y = await client.move('down')
                // status_x = await this.subIntention( 'go_to', {x: me.x, y: me.y-1} );

            if (status_y) {
                me.x = status_y.x;
                me.y = status_y.y;
            }
            
            if ( ! status_x && ! status_y) {
                this.log('stucked ', countStacked);
                //await this.subIntention( 'go_to', {x: x, y: y} );
                await timeout(1000)
                if(countStacked <= 0){
                    throw 'stopped'; 
                }else{
                    countStacked -= 1;
                }

            } else if ( me.x == x && me.y == y ) {
                // this.log('target reached');
            }
        }
        return true;
    }
}


class PddlPutDown extends Plan {
    static isApplicableTo ( go_to, x, y ) {
        return go_to == 'go_put_down';
    }

    async execute ( go_to, x, y ) {
        let nearest_delivery = { x: -1, y: -1 };
        var x = -1;
        var y = -1;
        if (this.stopped) throw ['stopped']; // if stopped then quit
        nearest_delivery = find_nearest_delivery();
        x = nearest_delivery.x;
        y = nearest_delivery.y;
        // Define the PDDL goal
        let goal = 'posing ' + 't' + x + '_' + y;

        // Create the PDDL problem
        var pddlProblem = new PddlProblem(
            'deliveroo',
            myBeliefset.objects.join(' ') + ' ' + me.name,
            myBeliefset.toPddlString() + ' ' + '(me ' + me.name + ')' + '(at ' + me.name + ' ' + 't' + me.x + '_' + me.y + ')',
            goal
        );

        let problem = pddlProblem.toPddlString();
        console.log('------------------problem------------------');
        console.log(problem);
        // Get the plan from the online solver
        var plan = await onlineSolver(domain, problem);
        
        let path = [];
        plan.forEach(action => {
            console.log("action:");
            console.log(action);

            if (action.action == 'PUT-DOWN') {
                console.log("ADDDDDDDDDD Deliver")
                path.push({
                    x: x,
                    y: y,
                    info: "Deliver"
                })
            }

            else{
                let end = action.args[2].split('_');
                path.push({
                    x: parseInt(end[0].substring(1)), 
                    y: parseInt(end[1]),
                    info: "Move"                 
                });
            }
        });

        let countStacked = 3;
        console.log("path:");
        console.log(path);
        var deliver_flag = false;

        while ( me.x != x || me.y != y || deliver_flag != true) {
            
            if ( this.stopped ) throw ['stopped']; // if stopped then quit

            let coordinate = path.shift();
            let status_x = false;
            let status_y = false;
            console.log("--------INFO--------");
            console.log(coordinate.info);

            if(coordinate.info == "Deliver"){
                await client.putdown();
                deliver_flag = true;
            }

            if(coordinate.x == me.x && coordinate.y == me.y){
                continue;
            }

            if ( coordinate.x > me.x )
                status_x = await client.move('right');
            else if ( coordinate.x < me.x )
                status_x = await client.move('left');

            if (status_x) {
                me.x = status_x.x;
                me.y = status_x.y;
            }

            if ( this.stopped ) throw ['stopped']; // if stopped then quit

            if ( coordinate.y > me.y )
                status_y = await client.move('up');
            else if ( coordinate.y < me.y )
                status_y = await client.move('down');

            if (status_y) {
                me.x = status_y.x;
                me.y = status_y.y;
            }
            
            if ( ! status_x && ! status_y) {
                this.log('stucked ', countStacked);
                await timeout(1000);
                if(countStacked <= 0){
                    throw 'stopped'; 
                }else{
                    countStacked -= 1;
                }

            } else if ( me.x == x && me.y == y ) {
                // this.log('target reached');
            }
        }
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

// plans.push(GoPickUp)
// plans.push(GoPutDown)
plans.push(GoRandomDelivery)
// plans.push(GoToBFS)
plans.push(PddlMove)
plans.push(PddlPickUp)
plans.push(PddlPutDown)


import { Intention } from './intention.js';
import { me, client, findPath_BFS, deliveryCoordinates, find_nearest_delivery, mypos, updateMe, parcels, find_random_delivery } from './utils.js';
export { plans, Plan, GoPickUp };


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
        await this.subIntention(['go_to_BFS', x, y]);
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
        await this.subIntention(['go_to_BFS', x, y]);
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
        await this.subIntention(['go_to_BFS', x, y]);
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
        // console.log('path', path);
        // console.log(path.length)


        for (var i = 1; i < path.length; i++) {
            if (this.stopped) throw ['stopped']; // if stopped then quit
            await client.pickup()
            if (this.stopped) throw ['stopped']; // if stopped then quit
            // console.log("move")

            // let ok = false;

            var next_x = path[i].x;
            var next_y = path[i].y;


            let status_x = false;
            let status_y = false;

            if (next_x == me.x + 1) {
                status_x = await client.move('right');
                check_tile(next_x, next_y)
            }
            else if (next_x == me.x - 1) {
                status_x = await client.move('left');
                check_tile(next_x, next_y)
            }

            if (status_x) {
                me.x = status_x.x;
                me.y = status_x.y;
            }
            if (this.stopped) throw ['stopped']; // if stopped then quit

            if (next_y == me.y + 1) {
                status_y = await client.move('up');
                check_tile(next_x, next_y)
            }
            else if (next_y == me.y - 1) {
                status_y = await client.move('down');
                check_tile(next_x, next_y)
            }

            if (status_y) {
                me.x = status_y.x;
                me.y = status_y.y;
            }

            if (!status_x && !status_y) {
                console.log('Failed moving')
                throw 'stucked';
            }


            // await client.onYou(({ id, name, x_me, y_me, score }) => {
            //     // console.log('me', {id, name, x, y, score})
            //     me.id = id;
            //     me.name = name;
            //     if (x_me * 10 != me.x * 10)
            //         me.x = next_x;
            //     else
            //         me.x = x_me;
            //     if (y_me * 10 != me.y * 10)
            //         me.y = next_y;
            //     else
            //         me.y = y_me;
            //     me.score = score;

            //     // for(let p of parcels){
            //     //     if(p.x == me.x && p.y == me.y){
            //     //         ok = true;
            //     //     }
            //     // }

            // });

            //CHECK 
        }
    }
}

const plans = [];

plans.push(GoPickUp)
plans.push(GoPutDown)
plans.push(GoRandomDelivery)
plans.push(GoToBFS)

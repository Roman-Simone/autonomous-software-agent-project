import { Intention } from '../intention.js';
import { findPath_BFS, deliveryCoordinates } from '../intention&revision/utilsOptions.js';
import { MyData } from "../belief/belief.js";
import { client } from "../socketConnection.js"

// export { plans}


/**
 * Plan library
 */

async function check_tile(x, y) {
    for (let parcel of MyData.parcels) {
        if (x == parcel.x && y == parcel.y) {
            await client.pickup()
        }
    }

    for (let del of deliveryCoordinates) {
        if (x == del.x && y == del.y) {
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
    }
}

class GoPutDown extends Plan {

    static isApplicableTo(go_put_down, x, y, id, utility) {
        return go_put_down == 'go_put_down';
    }

    async execute(go_put_down, x, y) {

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

        for (var i = 1; i < path.length; i++) {
            if (this.stopped) throw ['stopped']; // if stopped then quit
            await client.pickup()
            if (this.stopped) throw ['stopped']; // if stopped then quit

            var next_x = path[i].x;
            var next_y = path[i].y;

            let status_x = false;
            let status_y = false;

            if (next_x == MyData.pos.x + 1) {
                status_x = await client.move('right');
            }
            else if (next_x == MyData.pos.x - 1) {
                status_x = await client.move('left');
            }
            if (status_x) {
                MyData.pos.x = status_x.x;
                MyData.pos.y = status_x.y;
                check_tile(next_x, next_y)
            }
            if (this.stopped) throw ['stopped']; // if stopped then quit

            if (next_y == MyData.pos.y + 1) {
                status_y = await client.move('up');
            }
            else if (next_y == MyData.pos.y - 1) {
                status_y = await client.move('down');
            }

            if (status_y) {
                MyData.pos.x = status_y.x;
                MyData.pos.y = status_y.y;
                check_tile(next_x, next_y)
            }

            if (!status_x && !status_y) {
                console.log('Failed moving')
                throw 'stucked';
            }
        }
    }
}

const plans = [];

plans.push(GoPickUp)
plans.push(GoPutDown)
plans.push(GoRandomDelivery)
plans.push(GoToBFS)

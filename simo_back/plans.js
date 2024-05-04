
import { Intention } from './intention.js';
import { me, client, findPath_BFS, find_nearest_delivery, mypos, updateMe } from './utils.js';
export { plans, Plan, GoPickUp };


/**
 * Plan library
 */


class Plan {

    // This is used to stop the plan
    #stopped = false;
    stop () {
        // this.log( 'stop plan' );
        this.#stopped = true;
        for ( const i of this.#sub_intentions ) {
            i.stop();
        }
    }
    get stopped () {
        return this.#stopped;
    }

    /**
     * #parent refers to caller
     */
    #parent;

    constructor ( parent ) {
        this.#parent = parent;
    }

    log ( ...args ) {
        if ( this.#parent && this.#parent.log )
            this.#parent.log( '\t', ...args )
        else
            console.log( ...args )
    }

    // this is an array of sub intention. Multiple ones could eventually being achieved in parallel.
    #sub_intentions = [];

    async subIntention ( predicate ) {
        const sub_intention = new Intention( this, predicate );
        this.#sub_intentions.push( sub_intention );
        return await sub_intention.achieve();
    }

}

class GoPickUp extends Plan {

    static isApplicableTo ( go_pick_up, x, y, id, score ) {
        return go_pick_up == 'go_pick_up';
    }

    async execute ( go_pick_up, x, y ) {
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
        await this.subIntention( ['go_to_BFS', x, y] );
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
        await client.pickup()
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
        return true;
        // await this.subIntention( 'go_put_down');
    }
}

class GoPutDown extends Plan {
    
        static isApplicableTo ( go_put_down, x, y, id, utility ) {
            return go_put_down == 'go_put_down';
        }
    
        async execute ( go_put_down, x, y ) {
            let nearest_delivery = {x: -1, y: -1};
            var x = -1;
            var y = -1;
            nearest_delivery = find_nearest_delivery();
            x = nearest_delivery.x;
            y = nearest_delivery.y;
            
            if ( this.stopped ) throw ['stopped']; // if stopped then quit
            await this.subIntention( ['go_to_BFS', x, y] );
            if ( this.stopped ) throw ['stopped']; // if stopped then quit
            await client.putdown()
            if ( this.stopped ) throw ['stopped']; // if stopped then quit
            return true;
            
        }
    
    
}

class BlindMove extends Plan {

    isApplicableTo ( desire ) {
        return desire == 'go_to';
    }

    async execute ( {x, y} ) {        
        while ( me.x != x || me.y != y ) {

            let status_x = undefined;
            let status_y = undefined;
            
            console.log('me', me, 'xy', x, y);

            if ( x > me.x )
                status_x = await client.move('right')
                // status_x = await this.subIntention( 'go_to', {x: me.x+1, y: me.y} );
            else if ( x < me.x )
                status_x = await client.move('left')
                // status_x = await this.subIntention( 'go_to', {x: me.x-1, y: me.y} );

            if (status_x) {
                me.x = status_x.x;
                me.y = status_x.y;
            }

            if ( y > me.y )
                status_y = await client.move('up')
                // status_x = await this.subIntention( 'go_to', {x: me.x, y: me.y+1} );
            else if ( y < me.y )
                status_y = await client.move('down')
                // status_x = await this.subIntention( 'go_to', {x: me.x, y: me.y-1} );

            if (status_y) {
                me.x = status_y.x;
                me.y = status_y.y;
            }
            
            if ( ! status_x && ! status_y) {
                console.log('stucked')
                break;
            } else if ( me.x == x && me.y == y ) {
                console.log('target reached')
            }
            
        }

    }
}




class GoToBFS extends Plan {
    static isApplicableTo ( go_to_BFS, x, y, id, utility ) {
        return go_to_BFS == 'go_to_BFS';
    }

    async execute ( go_to_BFS, x, y ) {
        var path = findPath_BFS(x, y);
        console.log('path', path);
        console.log(path.length)


        for (var i = 1; i < path.length; i++) {
            if ( this.stopped ) throw ['stopped']; // if stopped then quit
            // console.log("move")

            // await client.pickup()

            var next_x = path[i].x;
            var next_y = path[i].y;
            

            let status_x = false;
            let status_y = false;

            if (next_x == me.x + 1) {
                console.log('move right')
                status_x = await client.move('right');
            } 
            else if (next_x == me.x - 1) {
                console.log('move left')
                status_x = await client.move('left');
            } 

            if (status_x) {
                me.x = status_x.x;
                me.y = status_x.y;
            }

            if (next_y == me.y + 1) {
                console.log('move up')
                status_y = await client.move('up');
            } 
            else if (next_y == me.y - 1) {
                console.log('move down')
                status_y = await client.move('down');
            }

            if (status_y) {
                me.x = status_y.x;
                me.y = status_y.y;
            }
            console.log('status_x', status_x)
            console.log('status_y', status_y)
            
            if ( ! status_x && ! status_y) {
                console.log('Failed moving')
                throw 'stucked';
            }

        }
    }
}

const plans = [];

plans.push( GoPickUp )
// plans.push( new BlindMove() )
plans.push( GoToBFS )
plans.push( GoPutDown )
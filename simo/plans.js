
import { Intention } from './intention.js';
import { me, client, findPath_BFS, find_nearest_delivery, mypos, updateMe } from './utils.js';
// import { intention_queue } from './agent.js';
export { plans };


/**
 * Plan library
 */

class Plan {

    stop () {
        console.log( 'stop plan and all sub intentions');
        for ( const i of this.#sub_intentions ) {
            i.stop();
        }
    }

    #sub_intentions = [];

    async subIntention ( desire, ...args ) {
        const sub_intention = new Intention( desire, ...args );
        this.#sub_intentions.push(sub_intention);
        return await sub_intention.achieve();
    }

}

class GoPickUp extends Plan {

    isApplicableTo ( desire ) {
     
        return desire == 'go_pick_up';
    }

    // async execute ( {x, y} ) {
    //     await this.subIntention( 'go_to_BFS', {x, y} );
    //     await client.pickup()
    //     // await this.subIntention( 'go_put_down');
    // }
    async execute ( ...args) {
      
        await this.subIntention( 'go_to_BFS', ...args);
        await client.pickup()
        // await this.subIntention( 'go_put_down');
    }
}

class GoPutDown extends Plan {
    
        isApplicableTo ( desire ) {
            return desire == 'go_put_down';
        }
    
        async execute ( ) {
            let nearest_delivery = {x: -1, y: -1};
            var x = -1;
            var y = -1;
            nearest_delivery = find_nearest_delivery();
            x = nearest_delivery.x;
            y = nearest_delivery.y;

            await this.subIntention( 'go_to_BFS', {x, y} );
            await client.putdown()
            
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



class BFS extends Plan {
    isApplicableTo ( desire ) {
        return desire == 'go_to_BFS';
    }

    async execute ( ...args ) {
        var x = args[0].x;
        var y = args[0].y;
        var path = findPath_BFS(x, y);


        for (var i = 0; i < path.length; i++) {
            var next_x = path[i].x;
            var next_y = path[i].y;

            if (next_x == me.x + 1) {
                await client.move('right');
            } 
            else if (next_x == me.x - 1) {
                await client.move('left');
            } 
            else if (next_y == me.y + 1) {
                await client.move('up');
            } 
            else if (next_y == me.y - 1) {
                await client.move('down');
            }
            
            await client.onYou(({ id, name, x_me, y_me, score }) => {
                // console.log('me', {id, name, x, y, score})
                me.id = id;
                me.name = name;
                if (x_me * 10 != me.x * 10)
                    me.x = next_x;
                else
                    me.x = x_me;
                if (y_me * 10 != me.y * 10)
                    me.y = next_y;
                else
                    me.y = y_me;
                me.score = score;
            });

        }
    }
}

const plans = [];

plans.push( new GoPickUp() )
plans.push( new BlindMove() )
plans.push( new BFS() )
plans.push( new GoPutDown() )
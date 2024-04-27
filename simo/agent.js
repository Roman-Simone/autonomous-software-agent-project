import { Intention } from './intention.js';
import { parcels } from './utils.js';
export { Agent };



/**
 * Intention execution loop
 */
class Agent {

    intention_queue = new Array();

    async intentionLoop ( ) {
        while ( true ) {
            // Consumes intention_queue if not empty
            if ( this.intention_queue.length > 0 ) {
                // Current intention
                const intention = this.intention_queue[0];
            
            
                // Start achieving intention
                await intention.achieve();

                // Remove from the queue
                this.intention_queue.shift();
            }
            await new Promise( res => setImmediate( res ) );
        }
    }



    async push ( desire, ...args ) {
        
        const current = new Intention( desire, ...args )
        this.intention_queue.push( current );
    }

    async stop ( ) {
        // console.log( 'stop agent queued intentions');
        for (const intention of this.intention_queue) {
            intention.stop();
        }
    }


}
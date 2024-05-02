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
       
        //Check if the intention is already in the queue and in case upadate it
        for (let i = 0; i < this.intention_queue.length; i++) {
            
            if (this.intention_queue[i].desire == "go_pick_up" && args[0].id == this.intention_queue[i].args[0].id){
                this.intention_queue.splice(i, 1);
            }
            
            if (this.intention_queue[i].desire == "go_put_down" && desire == "go_put_down"){
                this.intention_queue.splice(i, 1);
            }
        }
        
        const current = new Intention( desire, ...args )
        this.intention_queue.push( current );

        this.sortQueue();

        this.printQueue("push");
    }

    async stop ( ) {
        // console.log( 'stop agent queued intentions');
        for (const intention of this.intention_queue) {
            intention.stop();
        }
    }

    sortQueue () {
        this.intention_queue.sort((a, b) => a.args[1].utility - b.args[1].utility);
    }

    printQueue (zone = "") {
        console.log('\n[START QUEUE] called from ' + zone);
        for (let i = 0; i < this.intention_queue.length; i++) {
            console.log("\t[ELEMENT " + i + "]: " + this.intention_queue[i].desire + " PARCELL->" + this.intention_queue[i].args[0] + " UTILITY->" + this.intention_queue[i].args[1]);
        }
        console.log('[END QUEUE]\n')
    }
}
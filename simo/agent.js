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
                // console.log( 'intentionRevision.loop', this.intention_queue.map(i=>i.predicate) );
            
                // Current intention
                const intention = this.intention_queue[0];
                
                
                // console.log(intention.getArgs())
                
                // Is queued intention still valid? Do I still want to achieve it?
                // TODO this hard-coded implementation is an example
                // let id = intention.args


                //[INFO]  control if the parcel is still available
                if ( intention.desire == 'go_pick_up' ) {
                    var id = intention.args[0].id

                    let p = parcels.get(id)
                    if ( p && p.carriedBy ) {
                        console.log( 'Skipping intention because no more valid', intention.args)
                        this.intention_queue.shift();
                        continue;
                    }

                    if ( p && p.reward < 2 ) { 
                        console.log( 'Skipping intention because no reward', intention.args)
                        this.intention_queue.shift();
                        continue;
                    }
                }

                // Start achieving intention
                await intention.achieve()
                // Catch eventual error and continue
                .catch( error => {
                    console.log( 'Failed intention', ...intention.args, 'with error:', ...error )
                } );

                // Remove from the queue
                
                this.intention_queue.shift();
            }
            // const intention = this.intention_queue.shift();
            // if ( intention )
            //     await intention.achieve();
            await new Promise( res => setImmediate( res ) );
        }
    }

    async push ( desire, ...args ) {
        const last = this.intention_queue.at( this.intention_queue.length - 1 );
        
        // if ( last && last.predicate.join(' ') == desire.join(' ') ) {
        //     return; // intention is already being achieved
        // }
        
        const current = new Intention( desire, ...args )
        this.intention_queue.push( current );

        // if ( last ) {
        //     last.stop();
        // }
    }

    async stop ( ) {
        console.log( 'stop agent queued intentions');
        for (const intention of this.intention_queue) {
            intention.stop();
        }
    }

   

}
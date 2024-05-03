import { Intention } from './intention.js';
import { parcels } from './utils.js';
export { Agent };



/**
 * Intention execution loop
 */
class Agent {

    intention_queue = new Array();

    async intentionLoop() {
        // while (true) {

        //     // Consumes intention_queue if not empty
        //     if (this.intention_queue.length > 0) {
        //         // Current intention
        //         const intention = this.intention_queue[0];
                

                
        //         // Start achieving intention
        //         await intention.achieve();

        //         .catch( error => {
        //             // console.log( 'Failed intention', ...intention.predicate, 'with error:', ...error )
        //         } );

        //         // Remove from the queue
        //         this.intention_queue.shift();
        //     }
        //     await new Promise(res => setImmediate(res));

        // }
        while ( true ) {
            // Consumes intention_queue if not empty
            if ( this.intention_queue.length > 0 ) {
                // Current intention
                const intention = this.intention_queue[0];

                // Start achieving intention
                await intention.achieve()
                // Catch eventual error and continue
                .catch( error => {
                    // console.log( 'Failed intention', ...intention.predicate, 'with error:', ...error )
                } );

                // Remove from the queue
                this.intention_queue.shift();
            }
            // Postpone next iteration at setImmediate
            await new Promise( res => setImmediate( res ) );
        }
    }


    createString(predicate) {
        if (predicate[0] == "go_pick_up") {
            return predicate[0] + predicate[3];
        }
        else if (predicate[0] == "go_put_down") {
            return predicate[0];
        }
        return "undefined";
    }

    checkSwitch(last) {

        let ret = false
        console.log("last --> " + last);

        if (last) {
            if (this.createString(last.predicate) != this.createString(this.intention_queue[0].predicate)) {
                ret = true;
            }
        }
        return ret;
    }

    async push(predicate) {

        const last = this.intention_queue[0];

        let update = false;
        //Check if the intention is already in the queue and in case upadate it
        for (let i = 0; i < this.intention_queue.length; i++) {
            // console.log("comparing " + this.createString(predicate) + " with " + this.createString(this.intention_queue[i].predicate));
            if (this.createString(predicate) == this.createString(this.intention_queue[i].predicate)) {
                this.intention_queue[i].predicate[4] = predicate[4];
                update = true;
            }
        }

        if (!update) {
            const current = new Intention(this, predicate)
            this.intention_queue.push(current);
        }




        this.intention_queue = this.bubbleSort(this.intention_queue);

        this.printQueue("push");

        // console.log(this.createString(current) + " pushed");

        if (this.checkSwitch(last)) {
            console.log("switching intention");
            last.stop();
        }
    }

    async stop() {
        // console.log( 'stop agent queued intentions');
        for (const intention of this.intention_queue) {
            intention.stop();
        }
    }

    bubbleSort(arr) {
        const n = arr.length;
        let swapped;

        do {
            swapped = false;
            for (let i = 0; i < n - 1; i++) {
                if (arr[i].predicate[4] < arr[i + 1].predicate[4]) {  //switch < > to change sorting order
                    const temp = arr[i];
                    arr[i] = arr[i + 1];
                    arr[i + 1] = temp;
                    swapped = true;
                }
            }
        } while (swapped);

        return arr;
    }

    printQueue(zone = "") {
        console.log('\n[START QUEUE] called from ' + zone);
        for (let i = 0; i < this.intention_queue.length; i++) {
            console.log("\t[ELEMENT " + i + "]: " + this.intention_queue[i].predicate[0] + " PARCELL->" + this.intention_queue[i].predicate[3] + " UTILITY->" + this.intention_queue[i].predicate[4]);
        }
        console.log('[END QUEUE]\n')
    }
}
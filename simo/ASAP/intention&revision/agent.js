import { Intention } from './intention.js';
import { MyData } from "../belief/belief.js";


/**
 * Agent class
 */
class Agent {

    intention_queue = new Array();
    async intentionLoop() {

        while (true) {
            // Consumes intention_queue if not empty
            if (this.intention_queue.length > 0) {
                // Current intention
                const intention = this.intention_queue[0];
                // console.log(intention.predicate[0]);

                // Start achieving intention
                let ret = await intention.achieve()
                    // Catch eventual error and continue
                    .catch(error => {
                        // console.log( 'Failed intention', ...intention.predicate);
                        this.remove(intention.predicate);

                    });

                // If intention is achieved
                if (ret == true) {
                    // Add parcel taken to MyData.parcelsInMind
                    if (intention.predicate[0] == "go_pick_up") {
                        let entry = intention.predicate[3]
                        MyData.parcelsInMind.push(entry);
                    }
                    // Reset parcelsInMind if intention is go_put_down
                    else if (intention.predicate[0] == "go_put_down") {
                        for (let parcel of MyData.parcelsInMind) {
                            // remove parcels in mind from MyData.parcels
                            MyData.parcels = MyData.parcels.filter(p => p.id != parcel.id);
                        }

                        MyData.parcelsInMind = [];
                    }
                }
                // Remove from the queue
                this.remove(intention.predicate);
            }
            // Postpone next iteration at setImmediate
            await new Promise(res => setImmediate(res));
        }
    }

    /**
     * Remove an intention from the queue
     * @param {Array} predicate
     * @returns {Boolean} true if the intention is removed, false otherwise
    */
    async remove(predicate) {

        for (let i = 0; i < this.intention_queue.length; i++) {
            if (this.createString(predicate) == this.createString(this.intention_queue[i].predicate)) {
                this.intention_queue.splice(i, 1);
                return true;
            }
        }

        return false;
    }

    /**
     * Push an intention in the queue and check if it is better than the last one
     * @param {Array} predicate
    */
    async push(predicate) {

        // Take the last intention in the queue
        const last = this.intention_queue[0];

        let update = false;

        //Check if the intention is already in the queue and in case update it
        for (let i = 0; i < this.intention_queue.length; i++) {
            if (this.createString(predicate) == this.createString(this.intention_queue[i].predicate)) {
                this.intention_queue[i].predicate[4] = predicate[4];
                update = true;
            }
        }

        // If the intention is not in the queue, add it
        if (!update) {
            // console.log("[INFO] ", "NEW intention ->", predicate)
            const current = new Intention(this, predicate)
            this.intention_queue.push(current);
        }

        // Sort the queue in base of the utility value
        this.intention_queue = this.bubbleSort(this.intention_queue);

        // If I have better intentions in the queue, stop the last one and start the new one
        if (this.checkSwitch(last)) {
            console.log("[INFO] ", "Switching from " + this.createString(last.predicate) + " to " + this.createString(this.intention_queue[0].predicate));
            last.stop();
        }
    }

    /**
     * Stop all intentions in the queue
     */
    async stop() {
        for (const intention of this.intention_queue) {
            intention.stop();
        }
    }

    /**
     * Create a string from the predicate useful to compare intentions
     * @param {Array} predicate
     * @returns {String} the string created
    */
    createString(predicate) {
        if (predicate[0] == "go_pick_up") {
            return predicate[0] + predicate[3];
        }
        else {
            return predicate[0];
        }
    }

    /**
     * Check if the last intention in the queue is different from the first in the queue (the new best intention)
     * 
     * @param {Intention} last
     * @returns {Boolean} true if the intentions are different, false otherwise
    */
    checkSwitch(last) {

        let ret = false

        if (last) {
            if (this.createString(last.predicate) != this.createString(this.intention_queue[0].predicate)) {
                ret = true;
            }
        }
        return ret;
    }

    /**
     *  Bubble sort algorithm to sort the queue in base of the utility value
     * @param {Array} arr
     * @returns {Array} the sorted array
    */
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

    /**
     * Print the queue  (useful for debugging)
     * @param {String} zone
    */
    printQueue(zone = "") {
        console.log('\n[START QUEUE] called from ' + zone);
        for (let i = 0; i < this.intention_queue.length; i++) {
            console.log("\t[ELEMENT " + i + "]: " + this.intention_queue[i].predicate[0] + " PARCELL->" + this.intention_queue[i].predicate[3] + " UTILITY->" + this.intention_queue[i].predicate[4]);
        }
        console.log('[END QUEUE]\n')
    }
}

export { Agent };

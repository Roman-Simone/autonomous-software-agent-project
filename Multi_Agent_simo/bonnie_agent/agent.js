import { Intention } from './intention.js';
import { CollaboratorData, MyData  } from "./communication/coordination.js";
export { Agent };

//try

/**
 * Intention execution loop
 */
class Agent {

    intention_queue = new Array();
    parcelsInMind = [];

    get_inmind_score() {
        var tot_score = 0;
        for (let parcelInMind of this.parcelsInMind) {
            for (let parcel of MyData.parcels) {
                if (parcelInMind === id) {
                    if (parcel.reward <= 1) {
                        this.parcelsInMind = this.parcelsInMind.filter(parcel => parcel !== parcelInMind);
                    }
                    else {
                        tot_score += parcel.reward;
                    }
                }
            }
        }

        return tot_score;
    }

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

                        // console.log( 'Failed intention', ...intention.predicate, 'with error:', ...error )
                        this.remove(intention.predicate);

                    });

                if (ret == true) {
                    if (intention.predicate[0] == "go_pick_up") {
                        let entry = intention.predicate[3]
                        this.parcelsInMind.push(entry);
                    }
                    else if (intention.predicate[0] == "go_put_down") {
                        this.parcelsInMind = [];
                    }
                }
                // console.log("inmind", this.parcelsInMind);
                // Remove from the queue
                this.remove(intention.predicate);
            }
            // Postpone next iteration at setImmediate
            await new Promise(res => setImmediate(res));
        }
    }

    async remove(predicate) {
        // if (predicate[0] == "go_put_down") {
        //     return;
        // }
        for (let i = 0; i < this.intention_queue.length; i++) {
            if (this.createString(predicate) == this.createString(this.intention_queue[i].predicate)) {
                this.intention_queue.splice(i, 1);
                return true;
            }
        }
        console.log("Predicate not found in queue");
        return false;
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

        // this.printQueue("push");

        if (this.checkSwitch(last)) {
            last.stop();
        }
    }

    async stop() {
        // console.log( 'stop agent queued intentions');
        for (const intention of this.intention_queue) {
            intention.stop();
        }
    }


    createString(predicate) {
        if (predicate[0] == "go_pick_up") {
            return predicate[0] + predicate[3];
        }
        else {
            return predicate[0];
        }
    }

    checkSwitch(last) {

        let ret = false
        // console.log("last --> " + last);

        if (last) {
            if (this.createString(last.predicate) != this.createString(this.intention_queue[0].predicate)) {
                ret = true;
            }
        }
        return ret;
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
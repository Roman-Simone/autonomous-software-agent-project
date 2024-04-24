import { plans } from './plans.js';
export { Intention };


/**
 * Intention
 */
class Intention extends Promise {

    #current_plan;
    stop () {
        console.log( 'stop intention and current plan');
        this.#current_plan.stop();
    }

    desire;
    args;

    #resolve;
    #reject;

    constructor (desire, ...args ) {
        var resolve, reject;
        super( async (res, rej) => {
            resolve = res; reject = rej;
        } )
        this.#resolve = resolve
        this.#reject = reject
        this.desire = desire;
        this.args = args;
    }

    async getArgs () {
        return this.args;
    }

    #started = false;
    async achieve () {
        if ( this.#started)
            return this;
        else
            this.#started = true;

        for (const plan of plans) {
            if ( plan.isApplicableTo( this.desire ) ) {
                this.#current_plan = plan;
                console.log('\nachievingdesire', this.desire, ...this.args, 'with plan', plan);
                try {
                    const plan_res = await plan.execute( ...this.args );
                    this.#resolve( plan_res );
                    console.log( 'plan', plan, 'succesfully achieved intention', this.desire, ...this.args, 'with result', plan_res ,'\n');
                    return plan_res
                } catch (error) {
                    console.log( 'plan', plan, 'failed while trying to achieve intention', this.desire, ...this.args, 'with error', error );
                }
            }
        }

        this.#reject();
        console.log('no plan satisfied thedesire ', this.desire, ...this.args);
        throw 'no plan satisfied thedesire ' + this.desire;
    }

}
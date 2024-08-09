import { existAgentById } from "./utilsBelief.js"; 
export { AgentData }

class AgentData {

    //INFORMATION ABOUT THE AGENT
    name = ""
    id = ""
    pos = { x: -1, y: -1 };
    score = 0
    role = ""
    parcels = [];
    inmind = 0;
    options = [];
    best_option = [];
    adversaryAgents = [];
    parcelsInMind = [];

    constructor() {
        this.name = "";
        this.id = "";
        this.pos = { x: -1, y: -1 };
        this.score = 0;
        this.role = "NOTHING";
        this.parcels = [];
        this.options = [];
        this.best_option = [];
        this.adversaryAgents = [];
        this.parcelsInMind = [];
    }

    // Copy the data from another CommunicationData object
    copy(data) {
        this.name = data.name;
        this.id = data.id;
        this.pos = data.pos;
        this.score = data.score;
        this.role = data.role;
        this.parcels = data.parcels;
        this.options = data.options;
        this.best_option = data.best_option;
        this.adversaryAgents = data.adversaryAgents;
        this.parcelsInMind = data.parcelsInMind;

        // this.myBeliefset = data.myBeliefset;       // With this doesn't work
    }

    // ID out is the id of the agent MASTER or SLAVE because if there isn't problem with PDDL!!!!
    updateEnemies(otherEnemies, idout) {
        for (let a of otherEnemies) {
            let now = new Date().getTime();
            
            if(now - a.timestamp > 10000){
                this.adversaryAgents = this.adversaryAgents.filter(agent => agent.id !== a.id);
            } else if(a.id !== idout){
                if (!this.adversaryAgents.some(agent => existAgentById(a.id, agent.id))) {
                    a.direction = 'none';
                    this.adversaryAgents.push(a)
                }
            }
        }
    }

    get_inmind_score() {
        var tot_score = 0;
        for (let parcelInMind of this.parcelsInMind) {
            for (let parcel of this.parcels) {
                if (parcelInMind === parcel.id) {
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

    // Search for a parcel by id
    getParcelById(idToFind) {
        for (let parcel of this.parcels) {
            if (idToFind == parcel.id) {
                return parcel;
            }
        }
        return false;
    }

    getParcelsInMindIds() {
        var ids = [];

        for (let parcelInMind of this.parcelsInMind) {

            for (let parcel of this.parcels) {
                if (parcelInMind === parcel.id) {
                    ids.push(parcel);
                }
            }
        }

        return ids;
    }

    // Print all the parcels
    printParcels() {
        for (let elem of this.parcels) {
            console.log(elem)
        }
    }

    // Print all the data
    print() {
        console.log("name: ", this.name);
        console.log("id: ", this.id);
        console.log("role: ", this.role);
        console.log("pos: ", this.pos);
        console.log("best_option: ", this.best_option);
        console.log
    }
}
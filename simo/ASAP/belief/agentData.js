import { existAgentById } from "./utilsBelief.js"; 

class AgentData {

    // INFORMATION ABOUT THE AGENT
    name = ""              // Name of the agent
    id = ""                // Unique identifier of the agent
    pos = { x: -1, y: -1 } // Position of the agent 
    role = ""              // Role of the agent, default is "NOTHING"
    parcels = []           // Array to store parcels seen by the agent
    options = []           // Options available to the agent
    best_option = []       // The best option 
    adversaryAgents = []   // List of adversary agents
    parcelsInMind = []     // Parcels that the agent is currently had in mind

    constructor() {
        // Initialize all the properties of the agent
        this.name = "";
        this.id = "";
        this.pos = { x: -1, y: -1 };
        this.role = "NOTHING";  // Default role is "NOTHING"
        this.parcels = [];
        this.options = [];
        this.best_option = [];
        this.adversaryAgents = [];
        this.parcelsInMind = [];
    }

    // Copy the data from another agent
    // This method is used to clone or synchronize the data of another agent
    copy(data) {
        this.name = data.name;            
        this.id = data.id;                
        this.role = data.role;             
        this.parcels = data.parcels;       
        this.options = data.options;      
        this.best_option = data.best_option; 
        this.adversaryAgents = data.adversaryAgents;
        this.parcelsInMind = data.parcelsInMind;     
    }

    // Update the adversary agents list with the enemies from another agent
    updateEnemies(otherEnemies) {
        
        for (let a of otherEnemies) {
            let now = new Date().getTime();     // Get the current time
            
            // If the agent has not been seen for 10 seconds, remove it from the list
            if(now - a.timestamp > 10000){
                this.adversaryAgents = this.adversaryAgents.filter(agent => agent.id !== a.id);
            } 
            // If the enemy is NOT the current agent and is not already in the list, add it
            else if(a.id !== this.id){
                if (!this.adversaryAgents.some(agent => existAgentById(a.id, agent.id))) {
                    a.direction = 'none';   // Set default direction to 'none'
                    this.adversaryAgents.push(a); // Add the agent to the adversary list
                }
            }
        }
    }

    // Calculate the score for parcels in mind
    get_inmind_score() {
        let tot_score = 0; // Initialize total score
        for (let parcelInMind of this.parcelsInMind) { // Iterate over parcels in mind
            for (let parcel of this.parcels) { // Iterate over known parcels
                if (parcelInMind === parcel.id) { // Check if parcel is in mind
                    if (parcel.reward <= 1) { // If the reward is too low
                        this.parcelsInMind = this.parcelsInMind.filter(parcel => parcel !== parcelInMind); // Remove it from parcels in mind
                    }
                    else {
                        tot_score += parcel.reward; // Add the parcel's reward to the total score
                    }
                }
            }
        }

        return tot_score; // Return the total score
    }

    // Search for a parcel by its ID
    getParcelById(idToFind) {
        for (let parcel of this.parcels) { // Iterate over all parcels
            if (idToFind == parcel.id) { // If the parcel ID matches the one we're looking for
                return parcel; // Return the parcel
            }
        }
        return undefined; // If not found, return undefined
    }

    // Get the IDs of parcels that are in the agent's mind
    getParcelsInMindIds() {
        var ids = []; // Initialize an empty array to store IDs

        for (let parcelInMind of this.parcelsInMind) { // Iterate over parcels in mind

            for (let parcel of this.parcels) { // Iterate over known parcels
                if (parcelInMind === parcel.id) { // If the parcel is in mind
                    ids.push(parcel); // Add the parcel to the list
                }
            }
        }

        return ids; // Return the list of parcel IDs
    }

    // Print all the parcels known by the agent
    printParcels() {
        for (let elem of this.parcels) { // Iterate over all parcels
            console.log(elem); // Print each parcel
        }
    }

    // Print all the data related to the agent
    print() {
        console.log("name: ", this.name);          
        console.log("id: ", this.id);               
        console.log("role: ", this.role);           
        console.log("pos: ", this.pos);             
        console.log("best_option: ", this.best_option); 
        console.log(""); // Empty console log to add a line break
    }
}


export { AgentData }
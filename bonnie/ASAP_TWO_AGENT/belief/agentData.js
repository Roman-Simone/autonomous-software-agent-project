import { Beliefset } from "@unitn-asa/pddl-client";
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
    map = [];
    original_map = [];
    deliveryCoordinates = [];
    myBeliefset = new Beliefset();
    adversaryAgents = [];


    constructor() {
        this.name = "";
        this.id = "";
        this.pos = { x: -1, y: -1 };
        this.score = 0;
        this.role = "";
        this.parcels = [];
        this.inmind = 0;
        this.options = [];
        this.best_option = [];
        this.map = [];
        this.original_map = [];
        this.deliveryCoordinates = [];
        this.myBeliefset = new Beliefset();
        this.adversaryAgents = [];
    }

    // Copy the data from another CommunicationData object
    copy(data) {
        this.name = data.name;
        this.id = data.id;
        this.pos = data.pos;
        this.score = data.score;
        this.role = data.role;
        this.parcels = data.parcels;
        this.inmind = data.inmind;
        this.options = data.options;
        this.best_option = data.best_option;
        this.map = data.map;
        this.original_map = data.original_map;
        this.deliveryCoordinates = data.deliveryCoordinates;
        this.adversaryAgents = data.adversaryAgents;
        // this.myBeliefset = data.myBeliefset;       //With this doesn't work
    }

    printOriginalMapAsTable() {
        if (this.original_map.length === 0) {
            console.log("The matrix is empty.");
            return;
        }
    
        // Create the table string
        let table = "";
        for (const row of this.original_map) {
            table += row.join("\t") + "\n";
        }
    
        // Print the table
        console.log(table);
    }

    printMapAsTable() {
        if (this.map.length === 0) {
            console.log("The matrix is empty.");
            return;
        }
    
        // Create the table string
        let table = "";
        for (const row of this.map) {
            table += row.join("\t") + "\n";
        }
    
        // Print the table
        console.log(table);
    }

    

    // Update the beliefset based on the map
    updateBeliefset() {
        let width = this.map.length;
        let height = this.map[0].length;

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (this.map[x][y] == 0) {
                    continue;
                }

                this.myBeliefset.declare('tile t' + x + '_' + y);

                if (this.map[x][y] == 2) {
                    this.myBeliefset.declare('delivery t' + x + '_' + y);
                }

                // Find the tile to the right
                if ((x + 1) < width && this.map[x + 1][y] > 0) {
                    this.myBeliefset.declare('right t' + x + '_' + y + ' t' + (x + 1) + '_' + y);
                }

                // Find the tile to the left
                if ((x - 1) >= 0 && this.map[x - 1][y] > 0) {
                    this.myBeliefset.declare('left t' + x + '_' + y + ' t' + (x - 1) + '_' + y);
                }

                // Find the tile above
                if ((y + 1) < height && this.map[x][y + 1] > 0) {
                    this.myBeliefset.declare('up t' + x + '_' + y + ' t' + x + '_' + (y + 1));
                }

                // Find the tile below
                if ((y - 1) >= 0 && this.map[x][y - 1] > 0) {
                    this.myBeliefset.declare('down t' + x + '_' + y + ' t' + x + '_' + (y - 1));
                }
            }
        }

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

    }
}
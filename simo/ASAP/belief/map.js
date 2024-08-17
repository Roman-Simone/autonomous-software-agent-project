import { Beliefset } from "@unitn-asa/pddl-client";

class Map {
    map = [];        // map updated 0 = free, 1 = wall, 2 = parcel, 3 = delivery
    original_map = [];      // original map used to reset the map
    deliveryCoordinates = [];       // delivery coordinates in the map used for go put down
    spawningCoordinates = [];       // spawning coordinates in the map used for go pick up
    myBeliefset = new Beliefset();  // beliefset used for the planner
    width = 0;       // width of the map
    height = 0;     // height of the map
    parcel_reward_avg = 0;       // average reward of the parcels
    parcel_observation_distance;         // distance to observe parcels
    decade_frequency;       // frequency of the parcels decading for the agent

    constructor() {
        this.map = []      
        this.original_map = []  
        this.deliveryCoordinates = []   
        this.spawningCoordinates = []   
        this.myBeliefset = new Beliefset()      
        this.width = 0     
        this.height = 0     
        this.parcel_reward_avg = 0     
        this.parcel_observation_distance = 0   
        this.decade_frequency = 0       
    }

    // function to adjust the corner of compute spawning score
    validateAndAdjustCorner(corner) {
        if (corner.x <= 0) corner.x = 0;
        if (corner.y <= 0) corner.y = 0;
        if (corner.x >= this.width) corner.x = this.width - 1;
        if (corner.y >= this.height) corner.y = this.height - 1;

        return corner;
    }

    // function to compute the spawning score for random delivery 
    computeSpawningScore(x, y) {

        let score = 0;      // score of the spawning coordinates
        this.width = this.original_map.length;     // width of the map
        this.height = this.original_map[0].length;      // height of the map

        // corners of the window to observ the best spawning coordinates
        let left_upper_corner = { x: x - this.parcel_observation_distance, y: y + this.parcel_observation_distance };
        let right_upper_corner = { x: x + this.parcel_observation_distance, y: y + this.parcel_observation_distance };
        let left_lower_corner = { x: x - this.parcel_observation_distance, y: y - this.parcel_observation_distance };
        let right_lower_corner = { x: x + this.parcel_observation_distance, y: y - this.parcel_observation_distance };

        left_lower_corner = this.validateAndAdjustCorner(left_lower_corner);
        right_lower_corner = this.validateAndAdjustCorner(right_lower_corner);
        left_upper_corner = this.validateAndAdjustCorner(left_upper_corner);
        right_upper_corner = this.validateAndAdjustCorner(right_lower_corner);

        let minX = Math.min(left_upper_corner.x, left_lower_corner.x);
        let maxX = Math.max(right_upper_corner.x, right_lower_corner.x);
        let minY = Math.min(left_lower_corner.y, right_lower_corner.y);
        let maxY = Math.max(left_upper_corner.y, right_upper_corner.y);


        // Find the score of the spawning coordinates (the nmber of spawning coordinates in the window)
        for (let i = minX; i <= maxX; i++) {
            for (let j = minY; j <= maxY; j++) {
                if (this.map[i][j] === 3) {
                    score += 1;
                }
            }
        }

        return score;
    }

    // function to get the best spawning coordinates
    getBestSpawningCoordinates() {
        let best = { x: 0, y: 0, score: 0 };
        for (let c of this.spawningCoordinates) {
            if (c.score > best.score) {
                best = c;
            }
        }

        return best;
    }

    // function util to print the map as table
    printOriginalMapAsTable() {
        if (this.original_map.length === 0) {
            console.log("The matrix is empty.");
            return;
        }

        // Transpose the matrix
        let transposedMap = [];
        for (let i = 0; i < this.original_map[0].length; i++) {
            transposedMap[i] = [];
            for (let j = 0; j < this.original_map.length; j++) {
                transposedMap[i][j] = this.original_map[j][i];
            }
        }

        // Reverse the order of rows
        transposedMap.reverse();

        // Create the table string
        let table = "";
        for (const row of transposedMap) {
            table += row.join("\t") + "\n";
        }

        // Print the table
        console.log(table);
    }

    // function util to print the map as table
    printMapAsTable() {
        if (this.map.length === 0) {
            console.log("The matrix is empty.");
            return;
        }

        // Transpose the matrix
        let transposedMap = [];
        for (let i = 0; i < this.map[0].length; i++) {
            transposedMap[i] = [];
            for (let j = 0; j < this.map.length; j++) {
                transposedMap[i][j] = this.map[j][i];
            }
        }

        // Reverse the order of rows
        transposedMap.reverse();

        // Create the table string
        let table = "";
        for (const row of transposedMap) {
            table += row.join("\t") + "\n";
        }

        // Print the table
        console.log(table);
    }


    // function util to print specific position in the map 
    printValuesOfMap(val){
        for (let i = 0; i < this.map[0].length; i++) {
            for (let j = 0; j < this.map.length; j++) {
                if(this.map[i][j] <= val){
                    console.log("Value ", this.map[i][j], " at coordinates ", i, ", ", j)
                }
            }
        }
    }

    // function to reset the map with original map
    resetMap(val) {
        let copy = [];
        for (let i = 0; i < this.original_map.length; i++) {
            copy[i] = [];
            for (let j = 0; j < this.original_map[i].length; j++) {
                if (this.map[i][j] == val) {
                    copy[i][j] = this.original_map[i][j];
                } else {
                    copy[i][j] = this.map[i][j];
                }
            }
        }
        this.map = copy;
    }

    // function to  update the map with a specific value and position
    updateMap(x, y, value) {
        let rows = this.map.length;
        let columns = this.map[0].length;
        x = Math.round(x);
        y = Math.round(y);
        
        if (x >= 0 && x < rows && y >= 0 && y < columns) {
            this.map[x][y] = value;
        } else {
            //if agent is going in the direction of bound, this part is triggered
            console.log('Error: trying to set value out of bounds: (', x, ', ', y, ") while rows and columns: ", this.map.length, ', ', this.map[0].length);
        }
    }

    // function to update the beliefset used in planning
    // this function use the map to find the tiles and their neighbors 
    updateBeliefset() {

        this.myBeliefset = new Beliefset();

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.map[x][y] === 0 || this.map[x][y] === -1 ) {
                    // console.log("Tile ", x, " ", y, " skipped  (val = ", this.map[x][y], ")")
                    continue;
                }

                // Find the tile to the right
                if ((x + 1) < this.width && this.map[x + 1][y] > 0) {
                    this.myBeliefset.declare('right t' + x + '_' + y + ' t' + (x + 1) + '_' + y);
                }

                // Find the tile to the left
                if ((x - 1) >= 0 && this.map[x - 1][y] > 0) {
                    this.myBeliefset.declare('left t' + x + '_' + y + ' t' + (x - 1) + '_' + y);
                }

                // Find the tile above
                if ((y + 1) < this.height && this.map[x][y + 1] > 0) {
                    this.myBeliefset.declare('up t' + x + '_' + y + ' t' + x + '_' + (y + 1));
                }

                // Find the tile below
                if ((y - 1) >= 0 && this.map[x][y - 1] > 0) {
                    this.myBeliefset.declare('down t' + x + '_' + y + ' t' + x + '_' + (y - 1));
                }
            }
        }
    }
}


export { Map }
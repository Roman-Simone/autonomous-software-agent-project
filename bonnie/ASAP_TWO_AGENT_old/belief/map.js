import { MyData, MyMap } from "./belief.js";
import { Beliefset } from "@unitn-asa/pddl-client";

export { Map }

class Map {
    map = [];
    original_map = [];
    deliveryCoordinates = [];
    myBeliefset = new Beliefset();
    
    
    constructor() {
        this.map = []
        this.original_map = []
        this.deliveryCoordinates = []
        this.myBeliefset = new Beliefset()
    }


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

    deepCopyMap() {
        const copy = [];
        for (let i = 0; i < this.original_map.length; i++) {
            copy[i] = [];
            for (let j = 0; j < this.original_map[i].length; j++) {
                copy[i][j] = this.original_map[i][j];
            }
        }

        this.map = copy;
    }

    updateMap(x, y, value) {
        let rows = this.map.length;
        let columns = this.map[0].length;
        x = Math.round(x);
        y = Math.round(y);
        // console.log("--------------------------------------> Trying to update ", x, y, " with value ", value, " in map of size ", rows, columns, "\n")
        if (x >= 0 && x < rows && y >= 0 && y < columns) {
            this.map[x][y] = value;
        } else {
            console.log('Error: trying to set value out of bounds: (', x, ', ', y, ") while rows and columns: ", MyData.map.length, ', ', MyData.map[0].length);
        }
    }


    // Update the beliefset based on the map
    updateBeliefset() {
        let width = this.map.length;
        let height = this.map[0].length;
        let count = 0;
        this.myBeliefset = new Beliefset();

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (this.map[x][y] === -1) {
                    // console.log("\nCell at coordinates (" + x + ", " + y + ") has value -1\n");
                    count += 1;
                }

            }

        }

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (this.map[x][y] === 0 || this.map[x][y] === -1) {
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

        if (count !== 0) {
            // console.log("\nBeliefset: ", this.myBeliefset.toPddlString(), "\n");
        }

    }

}

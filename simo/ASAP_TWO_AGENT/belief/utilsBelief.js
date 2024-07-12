import { MyData } from "./belief.js";
export { from_json_to_matrix,deepCopyMap, updateMap };

function from_json_to_matrix(width, height, tiles) {
    var map = [];
    for (let i = 0; i < width; i++) {
        map[i] = [];
        for (let j = 0; j < height; j++) {
            map[i][j] = 0;                                       // '0' are blocked tiles (empty or not_tile)
            for (let k = 0; k < tiles.length; k++) {
                if (tiles[k].x == i && tiles[k].y == j) {
                    map[i][j] = 1;                               // '1' are walkable non-spawning tiles 
                    if (tiles[k].parcelSpawner) map[i][j] = 3;   // '3' are walkable spawning tiles  
                    if (tiles[k].delivery) map[i][j] = 2;        // '2' are delivery tiles
                }
            }
        }
    }
    return map;
}

function deepCopyMap(original) {
    const copy = [];
    for (let i = 0; i < original.length; i++) {
        copy[i] = [];
        for (let j = 0; j < original[i].length; j++) {
            copy[i][j] = original[i][j];
        }
    }
    return copy;
}

function updateMap(x, y, value) {
    let rows = MyData.map.length;
    let columns = MyData.map[0].length;
    x = Math.round(x);
    y = Math.round(y);
    // console.log("--------------------------------------> Trying to update ", x, y, " with value ", value, " in map of size ", rows, columns, "\n")
    if (x >= 0 && x < rows && y >= 0 && y < columns) {
        MyData.map[x][y] = value;
    } else {
        console.log('Error: trying to set value out of bounds: (', x, ', ', y, ") while rows and columns: ", MyData.map.length, ', ', MyData.map[0].length);
    }
}
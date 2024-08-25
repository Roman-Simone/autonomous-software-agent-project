/** 
 * Function to convert the json map to a matrix
 * 
 * @param {number} width - The width of the map
 * @param {number} height - The height of the map
 * @param {Array} tiles - The tiles of the map
 * @returns {Array} map - The map represented as a matrix
*/
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

/**
 * Function to check if an agent with id1 exists
*/
function existAgentById(id1, id2) {
    return id1 === id2
}

export { from_json_to_matrix, existAgentById };

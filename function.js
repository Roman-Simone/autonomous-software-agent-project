import PriorityQueue from 'js-priority-queue';

function printMap(width, height, map){
    console.log("map:");
    for (let j = height - 1; j >= 0; j--) {
        let row = "";
        for (let i = 0; i < width; i++) {
            row += map[i][j] + " ";
        }
        console.log(row);
    }
}

export function from_json_to_matrix(width, height, tiles, map){
    var map = [];
    for (let i = 0; i < width; i++) {
        map[i] = [];
        for (let j = 0; j < height; j++) {
            map[i][j] = 0;                                       // '0' are blocked tiles (empty or not_tile)
            for(let k=0; k<tiles.length; k++){
                if(tiles[k].x == i && tiles[k].y == j){
                    map[i][j] = 3;                               // '3' are walkable non-spawning tiles 
                    if (tiles[k].parcelSpawner) map[i][j] = 1;   // '1' are walkable spawning tiles  
                    if (tiles[k].delivery) map[i][j] = 2;        // '2' are delivery tiles
                }
            }
        }
    }

    printMap(width, height, map);
    return map;
}



function manhattan(me_x1, me_y1, target_x2, target_y2) {
    return Math.abs(me_x1 - target_x2) + Math.abs(me_y1 - target_y2);
}


export function find_nearest(me_x, me_y, map){

    let dist_0 = 1000000;
    let dist_1 = 1000000;
    let dist_2 = 1000000;   
    let dist_3 = 1000000;

    let coordinates = [];
    for (var i = 0; i < 4; i++) {
        coordinates.push({ x: -1, y: -1, type: -1});
    }

    for (var i = 0; i < map.length; i++) {
        for (var j = 0; j < map[i].length; j++) {
            if(i == me_x && j == me_y){
                continue;
            }
            switch (map[i][j]) {
                case 0:
                    if(manhattan(me_x, me_y, i, j) < dist_0){
                        dist_0 = manhattan(me_x, me_y, i, j);
                        coordinates[0] = { x: i, y: j, type: 0};
                    }
                    break;
                case 1:
                    if(manhattan(me_x, me_y, i, j) < dist_1){
                        dist_1 = manhattan(me_x, me_y, i, j);
                        coordinates[1] = { x: i, y: j, type: 1};
                    }
                    break;
                case 2:
                    if(manhattan(me_x, me_y, i, j) < dist_2){
                        dist_2 = manhattan(me_x, me_y, i, j);
                        coordinates[2] = { x: i, y: j, type: 2};
                    }
                    break;
                case 3:
                    if(manhattan(me_x, me_y, i, j) < dist_3){
                        dist_3 = manhattan(me_x, me_y, i, j);
                        coordinates[3] = { x: i, y: j, type: 3};
                    }
                    break;
                default:
                    // Handle other cases if needed
                    break;
            }
        }
    }

    return coordinates;
}

export function findPath_BFS(startX, startY, endX, endY, map) {
    const visited = new Set();
    const queue = [];
    const path = [];

    queue.push({ x: startX, y: startY, pathSoFar: [] });
    visited.add(`${startX},${startY}`);

    while (queue.length > 0) {
        const { x, y, pathSoFar } = queue.shift();

        if (x === endX && y === endY) {
            // Found the end point, return the path
            return [...pathSoFar, { x: endX, y: endY }]; // Include the end point in the path
        }

        const neighbors = getNeighbors(x, y, map);
        for (const neighbor of neighbors) {
            const { x: neighborX, y: neighborY } = neighbor;

            if (!visited.has(`${neighborX},${neighborY}`)) {
                visited.add(`${neighborX},${neighborY}`);
                queue.push({ x: neighborX, y: neighborY, pathSoFar: [...pathSoFar, { x, y }] });
            }
        }
    }

    // If no path is found, return an empty array
    return [];
}

function getNeighbors(x, y, map) {
    const neighbors = [];
    const directions = [
        { dx: -1, dy: 0 },  // left
        { dx: 1, dy: 0 },   // right
        { dx: 0, dy: -1 },  // down
        { dx: 0, dy: 1 }    // up
    ];

    for (const direction of directions) {
        const neighborX = x + direction.dx;
        const neighborY = y + direction.dy;

        if (isValidPosition(neighborX, neighborY, map)) {
            neighbors.push({ x: neighborX, y: neighborY });
        }
    }

    return neighbors;
}

function isValidPosition(x, y, map) {
    const width = map.length;
    const height = map[0].length;

    return x >= 0 && x < width && y >= 0 && y < height && map[x][y] !== 0;
}
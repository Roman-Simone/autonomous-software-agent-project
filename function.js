import { default as config } from "./config.js";
import PriorityQueue from 'js-priority-queue';
import { DeliverooApi, timer } from "@unitn-asa/deliveroo-js-client";
const client = new DeliverooApi( config.host, config.token )

// export async function best_option(me_x, me_y, map){
    

//     scores.sort((a, b) => b[0] - a[0]); // Sort scores array in descending order
//     const best_score = scores[0]; // Assign the first element as the best_score
//     console.log("best_score: ", best_score);

//     // argmax
//     return findPath_BFS(me_x, me_y, best_score.x, best_score.y, map);
// }

export async function move(me_x, me_y, path, deliveryCoordinates, beliefset){
    for (var i = 0; i < path.length; i++) {
        var next_x = path[i].x;
        var next_y = path[i].y;
        if (next_x == me_x + 1) {
            await client.move('right');
            await client.pickup();
            for(let d of deliveryCoordinates){
                if(d.x == next_x && d.y == next_y){
                    await client.putdown();
                }
            }
        } else if (next_x == me_x - 1) {
            await client.move('left');
            await client.pickup();
            for(let d of deliveryCoordinates){
                if(d.x == next_x && d.y == next_y){
                    await client.putdown();
                }
            }
        } else if (next_y == me_y + 1) {
            await client.move('up');
            await client.pickup();
            for(let d of deliveryCoordinates){
                if(d.x == next_x && d.y == next_y){
                    await client.putdown();
                }
            }
        } else if (next_y == me_y - 1) {
            await client.move('down');
            await client.pickup();
            for(let d of deliveryCoordinates){
                if(d.x == next_x && d.y == next_y){
                    await client.putdown();
                }
            }
        }
        me_x = next_x;
        me_y = next_y;
    }

    return;
}

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

export function manhattan(me_x1, me_y1, target_x2, target_y2) {
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

export function findPath_Astar(startX, startY, endX, endY, map) {
    const openSet = new PriorityQueue({ comparator: (a, b) => a.f - b.f });
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    const path = [];

    openSet.enqueue({ x: startX, y: startY, f: 0 });
    gScore.set(`${startX},${startY}`, 0);
    fScore.set(`${startX},${startY}`, manhattan(startX, startY, endX, endY));

    while (!openSet.isEmpty()) {
        const current = openSet.dequeue();
        const { x, y } = current;

        if (x === endX && y === endY) {
            // Reconstruct the path
            path.push({ x, y });
            let node = current;
            while (cameFrom.has(`${node.x},${node.y}`)) {
                node = cameFrom.get(`${node.x},${node.y}`);
                path.unshift({ x: node.x, y: node.y });
            }
            return path;
        }

        const neighbors = getNeighbors(x, y, map);
        for (const neighbor of neighbors) {
            const { x: neighborX, y: neighborY } = neighbor;
            const tentativeGScore = gScore.get(`${x},${y}`) + 1;

            if (tentativeGScore < gScore.get(`${neighborX},${neighborY}`) || !gScore.has(`${neighborX},${neighborY}`)) {
                cameFrom.set(`${neighborX},${neighborY}`, { x, y });
                gScore.set(`${neighborX},${neighborY}`, tentativeGScore);
                fScore.set(`${neighborX},${neighborY}`, tentativeGScore + manhattan(neighborX, neighborY, endX, endY));

                if (!openSet.has({ x: neighborX, y: neighborY })) {
                    openSet.enqueue({ x: neighborX, y: neighborY, f: fScore.get(`${neighborX},${neighborY}`) });
                }
            }
        }
    }

    // If no path is found, return an empty array
    return [];
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

        if (isValidPosition(neighborX, neighborY, map[0].length, map.length, map)) {
            neighbors.push({ x: neighborX, y: neighborY });
        }
    }

    return neighbors;
}

function isValidPosition(x, y, width, height, map) {
    if (x < 0 || x >= width || y < 0 || y >= height) {
        return false;
    }
    if (map[x] === undefined || map[x][y] === undefined) {
        return false;
    }
    return map[x][y] !== 0;
}
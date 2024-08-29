import fs from 'fs';
import { MyData, MyMap } from "../belief/belief.js";


/**
 * Read the content of a file
 * 
 * @param {string} path - path to the file 
 * @returns {Promise<string>} - the content of the file
 */
function readFile(path) {
    return new Promise((res, rej) => {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) rej(err)
            else res(data)
        })
    })
}


/**
 * Check if two positions are equal
 * 
 * @param {{x:number, y:number}} pos1 
 * @param {{x:number, y:number}} pos2 
 * @returns 
 */
function positionsEqual(pos1, pos2) {
    return pos1.x === pos2.x && pos1.y === pos2.y;
}


/**
 * Retrieves all valid neighboring positions (up, down, left, right) from a given (x, y) coordinate.
 * 
 * @param {number} x - The x-coordinate of the current position.
 * @param {number} y - The y-coordinate of the current position.
 * @returns {Array} neighbors - An array of valid neighboring positions, each represented as an object with x and y properties.
 */
function getNeighbors(x, y) {
    const neighbors = [];
    const directions = [
        { dx: -1, dy: 0 },  // left
        { dx: 1, dy: 0 },   // right
        { dx: 0, dy: -1 },  // down
        { dx: 0, dy: 1 }    // up
    ];

    // Iterate through each possible direction to calculate neighboring positions
    for (const direction of directions) {
        const neighborX = x + direction.dx;
        const neighborY = y + direction.dy;

        // Check if the calculated neighboring position is valid
        if (isValidPosition(neighborX, neighborY)) {
            neighbors.push({ x: neighborX, y: neighborY });
        }
    }

    return neighbors;
}

/**
 * Checks if a given position (x, y) is within the map bounds and is traversable. (Used for BFS)
 * 
 * @param {number} x - The x-coordinate of the position to check.
 * @param {number} y - The y-coordinate of the position to check.
 * @returns {boolean} True if the position is valid and traversable, false otherwise.
 */
function isValidPosition(x, y) {
    x = Math.round(x);  // Ensure x is an integer
    y = Math.round(y);  // Ensure y is an integer
    const width = MyMap.map.length;        // Get the width of the map
    const height = MyMap.map[0].length;    // Get the height of the map

    // Return true if the position is within bounds and the position on the map is traversable (map value > 0)
    return x >= 0 && x < width && y >= 0 && y < height && MyMap.map[x][y] > 0;
}

/**
 * Implements a Breadth-First Search (BFS) algorithm to find the shortest path from the agent's current position to a target position.
 * This function is used not to move (we use PDDL) but for the calculation of the utility of the parcels because it's faster than PDDL
 * 
 * @param {number} endX - The x-coordinate of the target position.
 * @param {number} endY - The y-coordinate of the target position.
 * @returns {Array} The shortest path to the target position as an array of coordinates. 
 *                  Returns an empty array if no path is found.
 */
function findPath_BFS(endX, endY) {

    const visited = new Set();  // Keeps track of visited positions
    const queue = [];           // Queue for BFS traversal

    // Start position (agent's current position)
    var startX = MyData.pos.x;
    var startY = MyData.pos.y;

    // Initialize BFS with the start position and an empty path
    queue.push({ x: startX, y: startY, pathSoFar: [] });
    visited.add(`${startX},${startY}`);  // Mark start position as visited

    // Perform BFS
    while (queue.length > 0) {
        const { x, y, pathSoFar } = queue.shift();

        // Check if the target position is reached
        if (x === endX && y === endY) {
            // Return the path to the target, including the target position
            return [...pathSoFar, { x: endX, y: endY }];
        }

        // Get valid neighboring positions
        const neighbors = getNeighbors(x, y);
        for (const neighbor of neighbors) {
            const { x: neighborX, y: neighborY } = neighbor;

            // If the neighbor has not been visited, mark it as visited and add it to the queue
            if (!visited.has(`${neighborX},${neighborY}`)) {
                visited.add(`${neighborX},${neighborY}`);
                queue.push({ x: neighborX, y: neighborY, pathSoFar: [...pathSoFar, { x, y }] });
            }
        }
    }

    // Return an empty array if no path is found
    return [];
}

/**
 * Another implementation of BFS but now the start position is passed as an argument
 * 
 * @param {number} startX 
 * @param {number} startY 
 * @param {number} endX 
 * @param {number} endY 
 * @returns {Array} The shortest path to the target position as an array of coordinates.
 */
function findPath_BFS_notMe(startX, startY, endX, endY) {

    const visited = new Set();
    const queue = [];

    queue.push({ x: startX, y: startY, pathSoFar: [] });
    visited.add(`${startX},${startY}`);

    while (queue.length > 0) {
        const { x, y, pathSoFar } = queue.shift();

        if (x === endX && y === endY) {
            // Found the end point, return the path
            return [...pathSoFar, { x: endX, y: endY }]; // Include the end point in the path
        }

        const neighbors = getNeighbors(x, y);
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

/**
 * Find the nearest delivery point from the agent's current
 * ignoreCoordinates is used in case of Multi-Agent System to prevent the agent to go to the same delivery point of the other agent
 * 
 * @param {{x:number, y:number}} ignoreCoordinates 
 * @returns {{x:number, y:number}} The nearest delivery point   
 */
function find_nearest_delivery(ignoreCoordinates = undefined) {

    let min_distance = Number.MAX_VALUE;
    let nearest_delivery = { x: -1, y: -1 };
    for (var i = 0; i < MyMap.deliveryCoordinates.length; i++) {
        if (distanceBFS(MyMap.deliveryCoordinates[i]) < min_distance && isReachable(MyMap.deliveryCoordinates[i].x, MyMap.deliveryCoordinates[i].y)) {

            let del_x = MyMap.deliveryCoordinates[i].x;
            let del_y = MyMap.deliveryCoordinates[i].y;

            if (ignoreCoordinates != undefined && del_x == ignoreCoordinates.x && del_y == ignoreCoordinates.y) continue;

            if (MyMap.map[del_x][del_y] != 2) continue;            // this is the second check over the validity of the delivery tile 
            // because if the best_option has changed, the MASTER can't know if 
            // an adversary (or the SLAVE) is over it 

            min_distance = distanceBFS(MyMap.deliveryCoordinates[i]);
            nearest_delivery = MyMap.deliveryCoordinates[i];
        }
    }

    return nearest_delivery;
}

/**
 * Find the furthest delivery point from the agent's current position.
 * ignoreCoordinates is used in case of Multi-Agent System to prevent the agent from going to the same delivery point as the other agent.
 * 
 * @param {{x:number, y:number}} ignoreCoordinates 
 * @returns {{x:number, y:number}} The furthest delivery point   
 */
function find_furthest_delivery(ignoreCoordinates = undefined) {

    let max_distance = -1;
    let furthest_delivery = { x: -1, y: -1 };
    for (var i = 0; i < MyMap.deliveryCoordinates.length; i++) {

        let current_distance = distanceBFS(MyMap.deliveryCoordinates[i]);

        if (current_distance > max_distance && isReachable(MyMap.deliveryCoordinates[i].x, MyMap.deliveryCoordinates[i].y)) {

            let del_x = MyMap.deliveryCoordinates[i].x;
            let del_y = MyMap.deliveryCoordinates[i].y;

            if (ignoreCoordinates != undefined && del_x == ignoreCoordinates.x && del_y == ignoreCoordinates.y) continue;

            if (MyMap.map[del_x][del_y] != 2) continue;  // Ensure the delivery tile is valid

            max_distance = current_distance;
            furthest_delivery = MyMap.deliveryCoordinates[i];
        }
    }

    return furthest_delivery;
}

/**
 * @param {{x:number, y:number}} - The target position
 * @returns {number} - The distance from the agent's current position to the target position
 */
function distanceBFS({ x: x, y: y }) {
    return findPath_BFS(x, y).length;
}

/**
 * @param {{x:number, y:number} {x:number, y:number}} - The start and target positions
 * @returns {number} - The distance from the start position to the target position
 */
function distanceBFS_notMe({ x: startX, y: startY }, { x: endX, y: endY }) {
    return findPath_BFS_notMe(startX, startY, endX, endY).length;
}

/**
 * function to check if a target position is reachable
 * 
 * @param {number} x 
 * @param {number} y 
 * @returns {boolean} - True if the target position is reachable, false otherwise
 */
function isReachable(x, y) {
    return findPath_BFS(x, y).length != 0 || positionsEqual(MyData.pos, { x: x, y: y });
}

export { positionsEqual, readFile, findPath_BFS, findPath_BFS_notMe, find_nearest_delivery, find_furthest_delivery, distanceBFS, distanceBFS_notMe, isReachable };

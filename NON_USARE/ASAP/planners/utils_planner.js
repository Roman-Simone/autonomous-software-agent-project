import fs from 'fs';
import { MyData, MyMap } from "../belief/belief.js";
export { positionsEqual, readFile, findPath_BFS, findPath_BFS_notMe, find_nearest_delivery, distanceBFS, distanceBFS_notMe };

function readFile(path) {

    return new Promise((res, rej) => {

        fs.readFile(path, 'utf8', (err, data) => {
            if (err) rej(err)
            else res(data)
        })

    })

}

function positionsEqual(pos1, pos2) {
    return pos1.x === pos2.x && pos1.y === pos2.y;
}

//* BFS
function getNeighbors(x, y) {
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

        if (isValidPosition(neighborX, neighborY)) {
            neighbors.push({ x: neighborX, y: neighborY });
        }
    }

    return neighbors;
}

function isValidPosition(x, y) {
    x = Math.round(x);
    y = Math.round(y);
    const width = MyMap.map.length;
    const height = MyMap.map[0].length;

    return x >= 0 && x < width && y >= 0 && y < height && MyMap.map[x][y] > 0;
}

function findPath_BFS(endX, endY) {

    const visited = new Set();
    const queue = [];


    var startX = MyData.pos.x;
    var startY = MyData.pos.y;

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

//* Find nearest delivery 
function find_nearest_delivery(ignoreCoordinates = undefined) {

    let min_distance = Number.MAX_VALUE;
    let nearest_delivery = { x: -1, y: -1 };
    for (var i = 0; i < MyMap.deliveryCoordinates.length; i++) {
        if (distanceBFS(MyMap.deliveryCoordinates[i]) < min_distance) {

            let del_x = MyMap.deliveryCoordinates[i].x;
            let del_y = MyMap.deliveryCoordinates[i].y;

            if (ignoreCoordinates != undefined && del_x == ignoreCoordinates.x && del_y == ignoreCoordinates.y) continue;

            if (MyMap.map[del_x][del_y] != 2 ) continue;            // this is the second check over the validity of the delivery tile 
                                                                    // because if the best_option has changed, the MASTER can't know if 
                                                                    // an adversary (or the SLAVE) is over it 

            min_distance = distanceBFS(MyMap.deliveryCoordinates[i]);
            nearest_delivery = MyMap.deliveryCoordinates[i];
        }
    }

    // console.log("nearest_delivery: ", nearest_delivery, "(I'm on x: ", me.x, " y: ", me.y, ")");
    return nearest_delivery;
}

function distanceBFS({ x: x, y: y }) {
    return findPath_BFS(x, y).length;
}

function distanceBFS_notMe({ x: startX, y: startY }, { x: endX, y: endY }) {
    return findPath_BFS_notMe(startX, startY, endX, endY).length;
}



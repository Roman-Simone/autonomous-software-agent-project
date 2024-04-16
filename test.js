
function manhattan(me_x1, me_y1, target_x2, target_y2) {
    return Math.abs(me_x1 - target_x2) + Math.abs(me_y1 - target_y2);
}


function analize_cell(me_x, me_y, map){

    let dist_0 = 1000000;
    let dist_1 = 1000000;
    let dist_2 = 1000000;   
    let dist_3 = 1000000;

    let coordinates = [];
    for (var i = 0; i < 4; i++) {
        coordinates.push([-1, -1]);
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
                        coordinates[0] = [i, j];
                    }
                    break;
                case 1:
                    if(manhattan(me_x, me_y, i, j) < dist_1){
                        dist_1 = manhattan(me_x, me_y, i, j);
                        coordinates[1] = [i, j];
                    }
                    break;
                case 2:
                    if(manhattan(me_x, me_y, i, j) < dist_2){
                        dist_2 = manhattan(me_x, me_y, i, j);
                        coordinates[2] = [i, j];
                    }
                    break;
                case 3:
                    if(manhattan(me_x, me_y, i, j) < dist_3){
                        dist_3 = manhattan(me_x, me_y, i, j);
                        coordinates[3] = [i, j];
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



async function agentLoop () {


    // '0' are blocked tiles (empty or not_tile)
    // '1' are walkable spawning tiles
    // '2' are delivery tiles
    // '3' are walkable non-spawning tiles

    const matrix = [
        [0, 3, 0, 2, 3, 3, 1, 1],
        [0, 3, 0, 2, 3, 3, 1, 1],
        [0, 3, 0, 2, 3, 3, 1, 1],
        [2, 3, 2, 2, 1, 3, 2, 3],
        [0, 3, 0, 2, 3, 3, 1, 1],
        [1, 3, 1, 3, 2, 1, 3, 1]
    ];

    var me_x = 0;
    var me_y = 0;



    var cordinates = analize_cell(me_x, me_y, matrix)

    console.log(cordinates);
    
}

agentLoop()
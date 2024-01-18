/**
 * algorithm from https://lodev.org/cgtutor/raycasting.html 
 */
let grid;

let start, end;
const Vector = p5.Vector;
function setup() {
    createCanvas(600, 600);
    background(0);
    let gw = 25, gh = 25;
    grid = {
        width: gw,
        height: gh,
        states: new Array(gw * gh).fill(0),
    }
    grid.cellSize = new Vector(width / grid.width, height / grid.height);
    start = new Vector(random(width), random(height));
    end = new Vector(random(width), random(height));
}

function draw() {
    background(0);
    // draw the grid
    stroke(255);
    strokeWeight(1);
    noFill()
    rect(0, 0, width, height);
    for (let x = grid.cellSize.x; x < width; x += grid.cellSize.x) {
        line(x, 0, x, height);
    }
    for (let y = grid.cellSize.y; y < height; y += grid.cellSize.y) {
        line(0, y, width, y);
    }
    grid.states.forEach((g,i) => {
        if (g > 0) {
            let x = i % grid.width * grid.cellSize.x;
            let y = Math.floor(i / grid.width) * grid.cellSize.y;
            noStroke();
            fill(0,0,255);
            rect(x,y,grid.cellSize.x, grid.cellSize.y);
        }
    });

    //start
    if (keyIsPressed) {
        if (key === 'w') {
            start.y --;
            start.y = (start.y + height) % height;
        } else if (key === 's') {
            start.y ++;
            start.y = (start.y + height) % height;
        } else if (key === 'a') {
            start.x --;
            start.x = (start.x + width) % width;
        } else if (key === 'd') {
            start.x ++;
            start.x = (start.x + width) % width;
        }
    }
    stroke(0,255,0);
    strokeWeight(5);
    point(start.x, start.y);

    //end
    end.x = mouseX, end.y = mouseY;
    stroke(255,0,0);
    strokeWeight(5);
    point(end.x, end.y);

    //intersection
    let intersection = rayCasting(start, Vector.sub(end, start).normalize());
    if (intersection !== null) {
        stroke(255);
        strokeWeight(1);
        noFill();
        circle(intersection.x, intersection.y,3);

        if (Math.abs(intersection.x - start.x) < Math.abs(end.x -start.x)) {
            stroke(200);
            strokeWeight(1);
            line(start.x, start.y, intersection.x, intersection.y);
        } else {
            stroke(200);
            strokeWeight(1);
            line(start.x, start.y, end.x, end.y);
        }
    } else {
        stroke(200);
        strokeWeight(1);
        line(start.x, start.y, end.x, end.y);
    }
}

function mouseClicked(){
    let mx = Math.floor(mouseX / grid.cellSize.x);
    let my = Math.floor(mouseY / grid.cellSize.y);
    let idx = mx + my * grid.width;
    if (idx < 0 || idx > grid.states.length) return
    if (grid.states[idx] > 0) {
        grid.states[idx] = 0;
    } else {
        grid.states[idx] = 1;
    }
}


/**
 * 
 * @param {Vector} startingPoint 
 * @param {Vector} direction 
 */
function rayCasting(startingPoint, direction) {
    // which cell the starting point is in
    let mapX = Math.floor(startingPoint.x / grid.cellSize.x);
    let mapY = Math.floor(startingPoint.y / grid.cellSize.y);

    // length of the ray in different axis (x or y)
    let sideDistX, sideDistY;

    // if advance one unit (cell), length increase of the ray
    //wd we don't the accurate value but rather just two number to decide the ratio between them
    let deltaDistX = Math.abs(1 / direction.x);
    let deltaDistY = Math.abs(1 / direction.y);


    // direction to step in x or y axis
    let stepX, stepY;
    if (direction.x < 0) {
        stepX = -1;
        sideDistX = (startingPoint.x / grid.cellSize.x - mapX) * deltaDistX;
    } else {
        stepX = 1;
        sideDistX = ((mapX + 1) - startingPoint.x / grid.cellSize.x) * deltaDistX;
    }

    if (direction.y < 0) {
        stepY = -1;
        sideDistY = (startingPoint.y / grid.cellSize.y - mapY) * deltaDistY;
    } else {
        stepY = 1;
        sideDistY = ((mapY + 1) - startingPoint.y / grid.cellSize.y) * deltaDistY;
    }
    let hit = false;
    let maxDistance = Math.max(width * 2, height * 2);
    let distance = 0;
    //which side of the cell we are checking x : 0, y : 1
    let side = 0;
    while (!hit && distance < maxDistance){
        if (sideDistX < sideDistY) {
            distance = sideDistX
            sideDistX += deltaDistX;
            mapX += stepX;
            side = 0;
        } else {
            distance = sideDistY;
            sideDistY += deltaDistY
            mapY += stepY;
            side = 1;
        }
        if (mapX < 0 || mapX > grid.width || mapY < 0 || mapY > grid.height) break;
        if (grid.states[mapX + mapY*grid.width] > 0) hit = true;
    }

    let intersection = null;
    if (hit) {
        scalar = side === 0 ? grid.cellSize.x : grid.cellSize.y
        intersection = Vector.add(startingPoint, direction.normalize().mult(distance * scalar));
    }

    return intersection;
}
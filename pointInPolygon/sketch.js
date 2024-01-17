const Vector = p5.Vector;
/**
 * class to store a polygon
 */
class Polygon {
    /**
     * 
     * @param {Vector[]} points points of the close polygon in order, alternatively it can be an array of [x1,y1,x2,y2 ...];
     */
    constructor(points) {
        //this.segments = [];
        this.points = [];
        if (!points || !points.length) {
            throw ("invalid points");
        }
        if (points[0] instanceof Vector) {
            let endIndex = points.length;
            if (points[0].x === points[points.length - 1].x && points[0].y === points[points.length - 1].y) {
                endIndex--;
            }
            for (let i = 0; i < endIndex; i++) {
                this.points.push(points[i].x);
                this.points.push(points[i].y);
            }
            this.points.push(points[0].x);
            this.points.push(points[0].y);
        }

        if (typeof points[0] === "number") {
            if (points.length % 2 !== 0) throw ("invalid points");
            let endIndex = points.length;
            if (points[0] === points[points.length - 2] && points[1] == points[points.length - 1]) endIndex -= 2;
            for (let i = 0; i < endIndex; i++) {
                this.points.push(points[i]);
            }
            this.points.push(points[0]);
            this.points.push(points[1]);
        }

        if (this.points.length === 0) throw ("invalid points");
    }

    /**
     * 
     * @param {Vector} point point to check, alternatively can be an array [x, y];
     */
    check(point) {
        let x, y;
        if (point instanceof Vector) {
            x = point.x;
            y = point.y;
        } else if (Array.isArray(point)) {
            x = point[0];
            y = point[1];
        } else {
            throw ("invalid point");
        }
        let intersection = 0;
        for (let i = 0; i < this.points.length - 2; i += 2) {
            let x1, y1, x2, y2;
            x1 = this.points[i];
            y1 = this.points[i + 1];
            x2 = this.points[i + 2];
            y2 = this.points[i + 3];
            if (((y < y1) !== (y < y2)) && ((x < x1) !== (x < x2)) && (x2 - x1) * (y - y1) === (x - x1) * (y2 - y1)) return "on side";
            if (((y < y1) !== (y < y2)) && x < (x2 - x1) * (y - y1) / (y2 - y1) + x1) intersection++;
        }

        if (intersection % 2 === 1) return "in side";
        return "out side";
    }
}

let polygon = new Polygon([130, 350, 30, 150, 30, 20, 320, 20, 410, 200, 120, 170, 220, 370, 150, 430, 30, 350]);

function setup() {
    createCanvas(500, 500);
    background(0);
    noFill();
    stroke(255);
    beginShape();
    for (let i = 0; i < polygon.points.length; i += 2) {
        vertex(polygon.points[i], polygon.points[i + 1]);
    }
    endShape();
    strokeWeight(4);
}

function draw() {

}

function mouseClicked() {
    let res = polygon.check([mouseX, mouseY]);
    switch (res) {
        case "on side":
            stroke(0, 0, 255);
            break;
        case "in side":
            stroke(0, 255, 0);
            break;
        case "out side":
            stroke(255, 0, 0);
            break;
    }
    point(mouseX, mouseY);
}
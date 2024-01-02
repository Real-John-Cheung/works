let physicsScene = {
    gravity: new p5.Vector(0, 0),
    paused: false,
    balls: [],
    obstacles: [],
    deltaT: 1 / 60,
    restitution: 1
}

/**
 * moving balls
 */
class Ball {
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} r r
     * @param {number} m mass
     * @param {Vector} v 
     */
    constructor(x, y, r, v) {
        this.loc = new p5.Vector(x, y);
        this.v = v || new p5.Vector(random(-5, 5), random(-5, 5)); // velocity
        this.r = r;
        this.m = r * r * PI;
        this.acc = new p5.Vector(0, 0); // acceleration
    }

    /**
     * 
     * @param {Vector} f 
     */
    applyForce(f) {
        this.acc.add(f.div(this.m)); // F = ma
    }

    update() {
        this.v.add(this.acc.mult(physicsScene.deltaT)); // v = at
        this.acc.mult(0);
        this.loc.add(this.v);
        if (this.loc.x < this.r) {
            this.loc.x = this.r;
            this.v.x = - this.v.x;
        }
        if (this.loc.x > width - this.r) {
            this.loc.x = width - this.r;
            this.v.x = - this.v.x;
        }
        if (this.loc.y < this.r) {
            this.loc.y = this.r;
            this.v.y = - this.v.y;
        }
        if (this.loc.y > height - this.r) {
            this.loc.y = height - this.r;
            this.v.y = - this.v.y;
        }
    }

    display() {
        fill(255, 0, 0);
        circle(this.loc.x, this.loc.y, this.r * 2);
    }
}

/**
 * an obstacle can not be pushed to move (i.e it has infinite mass)
 */
class Obstacle {
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} w 
     * @param {number} h 
     */
    constructor(x, y, w, h) {
        this.loc = new p5.Vector(x, y);
        this.w = w;
        this.h = h;
        this.mass = Number.POSITIVE_INFINITY;
        this.body = [new p5.Vector(x-w/2, y - h/2), new p5.Vector(x+w/2, y - h/2), new p5.Vector(x+w/2,y+h/2), new p5.Vector(x-w/2, y + h/2)];
    }

    update() {

    }

    display() {
        push();
        fill(0, 0, 255);
        translate(this.loc.x, this.loc.y);
        rectMode(CENTER);
        rect(0, 0, this.w, this.h);
        pop();
    }

    /**
     * 
     * @param {Vector} point 
     * @returns {object} res.distanceSq, res.closestPoint
     */
    distanceSqTo(point) {
        let segments = [[this.body[0], this.body[1]],
                        [this.body[1], this.body[2]],
                        [this.body[2], this.body[3]],
                        [this.body[3], this.body[0]]];
        let dist = Number.POSITIVE_INFINITY, cp;
        segments.forEach(segment => {
            let lcp = closestPointOnSegment(point, segment[0], segment[1]);
            let d = distanceSq(lcp, point);
            //console.log(d,dist);
            if (d < dist) {
                dist = d;
                cp = lcp;
            }
        });
        return { distSq: dist, closestPoint: cp };
    }
}

/**
 * an obstacle that's rotating (something like a rotating stick that stairs the balls)
 */
class RotatingObstacle extends Obstacle {
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} w 
     * @param {number} h 
     * @param {number} angularVel 
     * @param {Vector} rotatingCenter 
     */
    constructor(x, y, w, h, angularVel, rotatingCenter) {
        super(x, y, w, h);
        this.rotatingCenter = rotatingCenter || p5.Vector.copy(this.loc);
        this.angularVel = angularVel;
        this.rotation = 0;
    }

    update() {
        this.rotation += this.angularVel * physicsScene.deltaT;
        this.rotation = this.rotation % (Math.PI * 2);
        for(let i = 0; i < this.body.length; i ++){
            this.body[i] = rotationCoordinateCalculation(this.body[i],this.rotatingCenter,this.angularVel * physicsScene.deltaT);
        }
    }

    /**
     * over ride
     */
    display() {
        push();
        translate(this.rotatingCenter.x, this.rotatingCenter.y);
        fill(0, 0, 255);
        rotate(this.rotation);
        rectMode(CENTER);
        rect(this.loc.x - this.rotatingCenter.x, this.loc.y - this.rotatingCenter.y, this.w, this.h);
        fill(0,255,0);
        circle(0,0,3);
        pop();
    }
}

/**
 * find the closest point on a line segment to a point
 * @param {Vector} point 
 * @param {Vector} vertexA 
 * @param {Vector} vertexB 
 * @returns {Vector}
 */
function closestPointOnSegment(point, vertexA, vertexB) {
    let line = p5.Vector.sub(vertexB, vertexA);
    if (line.magSq() === 0) return p5.Vector.copy(vertexA);
    let ratio = Math.max(0, Math.min(1, (point.dot(line) - vertexA.dot(line)) / line.magSq()));
    let res = p5.Vector.copy(vertexA);
    return res.add(line.mult(ratio));
}

/**
 * 
 * @param {Vector} pointToCalculate 
 * @param {Vector} newOrigin 
 * @param {number} rotation 
 */
function rotationCoordinateCalculation(pointToCalculate, rotatingCenter, rotation) {
    if (!rotation || rotation == 0) return pointToCalculate.copy();
    //translate
    pointToCalculate.x -= rotatingCenter.x;
    pointToCalculate.y -= rotatingCenter.y;
    //rotate
    let newX = pointToCalculate.x * Math.cos(rotation) - pointToCalculate.y * Math.sin(rotation);
    let newY = pointToCalculate.x * Math.sin(rotation) + pointToCalculate.y * Math.cos(rotation);
    pointToCalculate.x = newX;
    pointToCalculate.y = newY;
    //translate back
    return new p5.Vector(pointToCalculate.x + rotatingCenter.x, pointToCalculate.y + rotatingCenter.y);
}


/**
 * 
 * @param {Vector} point1 
 * @param {Vector} point2 
 */
function distanceSq(point1, point2) {
    return (point1.x - point2.x) * (point1.x - point2.x) + (point1.y - point2.y) * (point1.y - point2.y);
}

function distance(point1, point2) {
    return Math.sqrt(distanceSq(point1, point2));
}

function collisionBetweenBalls(ball1, ball2, restitution) {
    let distSq = (ball1.loc.x - ball2.loc.x) * (ball1.loc.x - ball2.loc.x) + (ball1.loc.y - ball2.loc.y) * (ball1.loc.y - ball2.loc.y);
    // is the balls colliding?
    if (distSq === 0 || distSq > (ball1.r + ball2.r) * (ball1.r + ball2.r)) return;

    // colliding direction
    let dir = p5.Vector.sub(ball2.loc, ball1.loc);
    dir = dir.normalize();

    // separate the balls
    let intersectLength = (ball1.r + ball2.r - Math.sqrt(distSq)) / 2;
    ball1.loc = ball1.loc.sub(p5.Vector.mult(dir, intersectLength));
    ball2.loc = ball2.loc.add(p5.Vector.mult(dir, intersectLength));

    // conservation of momentum: m1 * u1 + m2 * u2 = m1 * v1 + m2 * v2
    // coefficient of restitution: (CoR/ε) degree of elasticity of the colliding bodies
    // v2 − v1 = ε(u1 − u2),
    // if CoR = 1: kinetic energy is not changed
    // if 0 <= CoR < 1: kinetic energy lost in collision
    // if CoR > 1: kinetic energy increased in collision (e.g. an explosion happened)

    // velocity on the collision direction
    let v1 = ball1.v.dot(dir);
    let v2 = ball2.v.dot(dir);
    let m1 = ball1.m, m2 = ball2.m;

    //calculated the new velocity on the direction
    let newV1 = ((m1 - restitution * m2) * v1 + m2 * (1 + restitution) * v2) / (m1 + m2);
    let newV2 = (m1 * (1 + restitution) * v1 + (m2 - restitution * m1) * v2) / (m1 + m2);

    ball1.v = ball1.v.add(p5.Vector.mult(dir, newV1 - v1));
    ball2.v = ball2.v.add(p5.Vector.mult(dir, newV2 - v2));
}

function collisionBetweenBallAndObstacle(ball, obstacle, restitution) {
    let { distSq, closestPoint } = obstacle.distanceSqTo(ball.loc);
    //is there a collision?
    if (distSq === 0 || distSq > ball.r * ball.r) return;

    //collision direction
    let dir = p5.Vector.sub(ball.loc, closestPoint);
    dir = dir.normalize();
    let intersectLength = ball.r - Math.sqrt(distSq);
    ball.loc.add(p5.Vector.mult(dir, intersectLength));

    // new speed
    let v = ball.v.dot(dir);
    let m = ball.m;
    let newV = - v * restitution;

    ball.v = ball.v.add(p5.Vector.mult(dir, newV - v));
}

function simulate() {
    if (physicsScene.paused) return
    for (let k = 0; k < physicsScene.obstacles.length; k++) {
        const obstacle = physicsScene.obstacles[k];
        for (let i = 0; i < physicsScene.balls.length; i++) {
            const ballI = physicsScene.balls[i];
            collisionBetweenBallAndObstacle(ballI,obstacle,physicsScene.restitution);
            for (let j = i + 1; j < physicsScene.balls.length; j++) {
                const ballJ = physicsScene.balls[j];
                collisionBetweenBalls(ballI, ballJ, physicsScene.restitution);
            }
            ballI.update();
        }
        obstacle.update();
    }
}

function setup() {
    createCanvas(600, 600);
    background(255);
    noStroke();
    for(let i = 0; i < 10; i++){
        physicsScene.balls.push(new Ball(random(50, width - 50), random(50, height - 50), random(20, 50)))
    }
    physicsScene.obstacles.push(new Obstacle(300, 150, 50, 100));
    physicsScene.obstacles.push(new RotatingObstacle(300, 300, 20, 150, 1, new p5.Vector(300, 350)));
}

function draw() {
    background(255)
    simulate();

    physicsScene.balls.forEach(b => b.display());
    physicsScene.obstacles.forEach(o => o.display());
}

function mousePressed() {
    loop();
}
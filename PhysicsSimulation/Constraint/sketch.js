let physicsScene = {
    gravity: new p5.Vector(0, 9.8),
    deltaT: 0.1,
    paused: false,
    pendulums: [],
}
const Vector = p5.Vector;

class Rod {
    /**
     * 
     * @param {Vector} fixedPoint 
     * @param {number} length 
     */
    constructor(fixedPoint, length) {
        this.fixedPoint = fixedPoint.copy();
        this.length = length;
    }
}

class Mass {
    constructor(radius, m) {
        this.r = radius;
        this.m = m || this.r * this.r * Math.PI;
        this.loc = new Vector();
    }
}

class Pendulum {
    /**
     * 
     * @param {Rod} rod 
     * @param {Mass} mass 
     * @param {number} angle 
     */
    constructor(rod, mass, angle) {
        this.rod = rod;
        this.mass = mass;
        this.angle = angle;
        this.updateMassLoc();
        this.v = 0; // angular velocity
    }

    updateMassLoc() {
        this.mass.loc.x = this.rod.fixedPoint.x - Math.sin(this.angle) * this.rod.length;
        this.mass.loc.y = this.rod.fixedPoint.y + Math.cos(this.angle) * this.rod.length;
    }

    update() {
        let g = physicsScene.gravity.y;
        let dt = physicsScene.deltaT;
        //angular acceleration for a pendulum
        //a = -g * sin(theta) / R theta is the angle of the pendulum, 0 when vertical
        let acc = - g * Math.sin(this.angle) / this.rod.length;
        this.v += acc * dt;
        this.angle += this.v * dt;
        this.updateMassLoc();
        //console.log(this.angle);
    }

    /**
     * 
     * @param {number} color 
     */
    display(c) {
        stroke(0);
        line(this.rod.fixedPoint.x, this.rod.fixedPoint.y, this.mass.loc.x, this.mass.loc.y);
        fill(c);
        noStroke();
        circle(this.mass.loc.x, this.mass.loc.y, this.mass.r * 2);
    }
}

class PBDPendulum {
    /**
     * 
     * @param {Rod} rod 
     * @param {Mass} mass 
     * @param {number} angle 
     */
    constructor(rod, mass, angle) {
        this.rod = rod;
        this.mass = mass;
        this.mass.loc.x = this.rod.fixedPoint.x - Math.sin(angle) * this.rod.length;
        this.mass.loc.y = this.rod.fixedPoint.y + Math.cos(angle) * this.rod.length;
        this.mass.v = new Vector();//velocity of the mass
        this.mass.prevLoc = this.mass.loc.copy();
    }

    update() {
        let dt = physicsScene.deltaT / steps;
        for (let step = 0; step < steps; step++) {
            this.mass.v.y += physicsScene.gravity.y * dt;
            this.mass.prevLoc.x = this.mass.loc.x;
            this.mass.prevLoc.y = this.mass.loc.y;
            this.mass.loc.x += this.mass.v.x * dt;
            this.mass.loc.y += this.mass.v.y * dt;

            let dir = Vector.sub(this.mass.loc, this.rod.fixedPoint);
            let len = dir.mag();
            if (len > 0) {
                dir = dir.normalize();
                let lambda = this.rod.length - len;
                this.mass.loc.x += dir.x * lambda;
                this.mass.loc.y += dir.y * lambda;
            }
            this.mass.v.x = (this.mass.loc.x - this.mass.prevLoc.x) * (1 / dt);
            this.mass.v.y = (this.mass.loc.y - this.mass.prevLoc.y) * (1 / dt);
        }
    }

    /**
     * 
     * @param {number} color 
     */
    display(c) {
        stroke(0);
        line(this.rod.fixedPoint.x, this.rod.fixedPoint.y, this.mass.loc.x, this.mass.loc.y);
        fill(c);
        noStroke();
        circle(this.mass.loc.x, this.mass.loc.y, this.mass.r * 2);
    }
}

let steps = 1000;

function setup() {
    createCanvas(600, 600);
    physicsScene.pendulums.push(new Pendulum(new Rod(new Vector(width / 2, height / 2), 250), new Mass(20), -Math.PI / 2));
    physicsScene.pendulums.push(new PBDPendulum(new Rod(new Vector(width / 2, height / 2), 250), new Mass(10), -Math.PI / 2));
    background(255);
    frameRate(60);
}

function draw() {
    background(255);
    fill(0);
    text("steps: " + steps, 10, 10);
    physicsScene.pendulums[0].display("red");
    physicsScene.pendulums[0].update();
    physicsScene.pendulums[1].display("green");
    physicsScene.pendulums[1].update();
    //noLoop();
}


function mousePressed() {
    loop();
}

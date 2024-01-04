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

    update(dt) {


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

    display(c) {
        stroke(0);
        line(this.rod.fixedPoint.x, this.rod.fixedPoint.y, this.mass.loc.x, this.mass.loc.y);
        fill(c);
        noStroke();
        circle(this.mass.loc.x, this.mass.loc.y, this.mass.r * 2);
    }
}

/**
 * 
 * @param {Mass} mass1 
 * @param {Mass} mass2 
 */
function handleCollision(mass1, mass2) {
    let restitution = physicsScene.restitution || 1;
    let dir = Vector.sub(mass2.loc, mass1.loc);
    let d = dir.mag();
    if (d === 0 || d > mass1.r + mass2.r) return;
    dir = dir.normalize();
    let corr = (mass1.r + mass2.r - d) / 2;
    mass1.loc.x -= dir.x * corr;
    mass1.loc.y -= dir.y * corr;
    mass2.loc.x += dir.x * corr;
    mass2.loc.y += dir.y * corr;
    let v1 = mass1.v.dot(dir);
    let v2 = mass2.v.dot(dir);

    let m1 = mass1.m;
    let m2 = mass2.m;
    let newV1 = (m1 * v1 + m2 * v2 - m2 * (v1 - v2) * restitution) / (m1 + m2);
    let newV2 = (m1 * v1 + m2 * v2 - m1 * (v2 - v1) * restitution) / (m1 + m2);

    mass1.v.x += dir.x * (newV1 - v1);
    mass1.v.y += dir.y * (newV1 - v1);
    mass2.v.x += dir.x * (newV2 - v2);
    mass2.v.y += dir.y * (newV2 - v2);
}

function simulate(){
    const sdt = physicsScene.deltaT / steps;
    for (let step = 0; step < steps; step++) {
        for (let i = 0; i < physicsScene.pendulums.length; i++) {
            const pendulumI = physicsScene.pendulums[i];
            pendulumI.update(sdt);
            for (let j = i + 1; j < physicsScene.pendulums.length; j++) {
                const pendulumJ =  physicsScene.pendulums[j];
                handleCollision(pendulumI.mass, pendulumJ.mass);
            }
        }
    }
}

let steps = 500;

function setup() {
    createCanvas(600, 600);
    background(255);
    let ang = - Math.PI;
    let numOfPendulum = 10;
    for (let i = 0; i < numOfPendulum; i++) {
        physicsScene.pendulums.push(new PBDPendulum(new Rod(new Vector(width / 2, height / 2), 250), new Mass(random(10, 30)), ang));
        ang += Math.PI * 2 / numOfPendulum;
    }
}

function draw(){
    background(255);
    simulate();
    physicsScene.pendulums.forEach(p => p.display("red"));
}
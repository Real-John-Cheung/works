const Vector = p5.Vector;
const physicsScene = {
    gravity: new p5.Vector(0, 9.8),
    deltaT: 0.1,
    paused: false,
    pendulums: [],
};

class TriplePendulum {
    /**
     * 
     * @param {Vector} loc 
     * @param {Array} masses 
     * @param {Array} lengths 
     * @param {Array} angles 
     * @param {boolean} usePDB 
     */
    constructor(loc, masses, lengths, angles, usePDB) {
        this.loc = loc.copy();
        if (!(masses.length === lengths.length && lengths.length === angles.length)) throw new Error(`invalid: masses: ${masses.length}, lengths: ${lengths.length}, angles: ${angles.length}, `);
        this.usePDB = usePDB || false;
        this.trail = new Int32Array(1000), this.trailStart = 0, this.trailEnd = 0;
        this.masses = [0], this.massLocs = [new Vector(0,0)], this.lengths = [0];
        if (usePDB) {
            this.prevMassLocs = [new Vector()], this.massVels = [new Vector()];
            let x = 0;
            let y = 0;
            for (let i = 0; i < masses.length; i++) {
                this.masses.push(masses[i]);
                this.lengths.push(lengths[i]);
                x -= lengths[i] * Math.sin(angles[i]);
                y += lengths[i] * Math.cos(angles[i]);
                this.massLocs.push(new Vector(x, y));
                this.prevMassLocs.push(new Vector(x, y));
                this.massVels.push(new Vector());
            }
        } else {
            this.angles = [0], this.deltaAngle = [0];
            let x = 0;
            let y = 0;
            for (let i = 0; i < masses.length; i++) {
                this.masses.push(masses[i]);
                this.lengths.push(lengths[i]);
                x -= lengths[i] * Math.sin(angles[i]);
                y += lengths[i] * Math.cos(angles[i]);
                this.massLocs.push(new Vector(x, y));
                this.angles.push(angles[i]);
                this.deltaAngle.push(0);
            }
        }
    }

    simulate(s) {
        let steps = s || 10000;
        let dt = physicsScene.deltaT / steps;
        for (let step = 0; step < steps; step++) {
            if (this.usePDB) {
                this.simulatePBD(dt);
            } else {
                this.simulateAnalytic(dt);
            }
        }
    }

    simulateAnalytic(dt) {
        let g = physicsScene.gravity.y;
        let m1 = this.masses[1], m2 = this.masses[2], m3 = this.masses[3];
        let l1 = this.lengths[1], l2 = this.lengths[2], l3 = this.lengths[3];
        let ang1 = this.angles[1], ang2 = this.angles[2], ang3 = this.angles[3];
        let w1 = this.deltaAngle[1], w2 = this.deltaAngle[2], w3 = this.deltaAngle[3];

        let b1 = g * l1 * m1 * Math.sin(ang1) + g * l1 * m2 * Math.sin(ang1) + g * l1 * m3 * Math.sin(ang1) + m2 * l1 * l2 * Math.sin(ang1 - ang2) * w1 * w2 +
            m3 * l1 * l3 * Math.sin(ang1 - ang3) * w1 * w3 + m3 * l1 * l2 * Math.sin(ang1 - ang2) * w1 * w2 +
            m2 * l1 * l2 * Math.sin(ang2 - ang1) * (w1 - w2) * w2 +
            m3 * l1 * l2 * Math.sin(ang2 - ang1) * (w1 - w2) * w2 +
            m3 * l1 * l3 * Math.sin(ang3 - ang1) * (w1 - w3) * w3;
        let a11 = l1 * l1 * (m1 + m2 + m3);
        let a12 = m2 * l1 * l2 * Math.cos(ang1 - ang2) + m3 * l1 * l2 * Math.cos(ang1 - ang2);
        let a13 = m3 * l1 * l3 * Math.cos(ang1 - ang3);
        let b2 =
            g * l2 * m2 * Math.sin(ang2) + g * l2 * m3 * Math.sin(ang2) + w1 * w2 * l1 * l2 * Math.sin(ang2 - ang1) * (m2 + m3) +
            m3 * l2 * l3 * Math.sin(ang2 - ang3) * w2 * w3 +
            (m2 + m3) * l1 * l2 * Math.sin(ang2 - ang1) * (w1 - w2) * w1 +
            m3 * l2 * l3 * Math.sin(ang3 - ang2) * (w2 - w3) * w3;

        let a21 = (m2 + m3) * l1 * l2 * Math.cos(ang2 - ang1);
        let a22 = l2 * l2 * (m2 + m3);
        let a23 = m3 * l2 * l3 * Math.cos(ang2 - ang3);

        let b3 =
            m3 * g * l3 * Math.sin(ang3) - m3 * l2 * l3 * Math.sin(ang2 - ang3) * w2 * w3 - m3 * l1 * l3 * Math.sin(ang1 - ang3) * w1 * w3 +
            m3 * l1 * l3 * Math.sin(ang3 - ang1) * (w1 - w3) * w1 +
            m3 * l2 * l3 * Math.sin(ang3 - ang2) * (w2 - w3) * w2;

        let a31 = m3 * l1 * l3 * Math.cos(ang1 - ang3);
        let a32 = m3 * l2 * l3 * Math.cos(ang2 - ang3);
        let a33 = m3 * l3 * l3;

        b1 = -b1;
        b2 = -b2;
        b3 = -b3;

        let det = a11 * (a22 * a33 - a23 * a32) + a21 * (a32 * a13 - a33 * a12) + a31 * (a12 * a23 - a13 * a22);
        if (det === 0)
            return;

        let a1 = b1 * (a22 * a33 - a23 * a32) + b2 * (a32 * a13 - a33 * a12) + b3 * (a12 * a23 - a13 * a22);
        let a2 = b1 * (a23 * a31 - a21 * a33) + b2 * (a33 * a11 - a31 * a13) + b3 * (a13 * a21 - a11 * a23);
        let a3 = b1 * (a21 * a32 - a22 * a31) + b2 * (a31 * a12 - a32 * a11) + b3 * (a11 * a22 - a12 * a21);

        a1 /= det;
        a2 /= det;
        a3 /= det;
        this.deltaAngle[1] += a1 * dt;
        this.deltaAngle[2] += a2 * dt;
        this.deltaAngle[3] += a3 * dt;
        this.angles[1] += this.deltaAngle[1] * dt;
        this.angles[2] += this.deltaAngle[2] * dt;
        this.angles[3] += this.deltaAngle[3] * dt;
        let x = 0, y = 0;
        for (let i = 1; i < this.masses.length; i++) {
            x -= this.lengths[i] * Math.sin(this.angles[i]);
            y += this.lengths[i] * Math.cos(this.angles[i]);
            this.massLocs[i].x = x;
            this.massLocs[i].y = y;
        }
    }

    simulatePBD(dt) {
       
        
            for (let i = 1; i < this.masses.length; i++) {
                this.massVels[i].y += dt * physicsScene.gravity.y;
                this.prevMassLocs[i].x = this.massLocs[i].x;
                this.prevMassLocs[i].y = this.massLocs[i].y;
                this.massLocs[i].x += this.massVels[i].x * dt;
                this.massLocs[i].y += this.massVels[i].y * dt;
            }

            for (let i = 1; i < this.masses.length; i++) {
                let dx = this.massLocs[i].x - this.massLocs[i - 1].x;
                let dy = this.massLocs[i].y - this.massLocs[i - 1].y;
                let d = Math.sqrt(dx * dx + dy * dy);
                let w0 = this.masses[i - 1] > 0 ? 1 / this.masses[i - 1] : 0;
                let w1 = this.masses[i] > 0 ? 1 / this.masses[i] : 0;
                let corr = (this.lengths[i] - d) / d ;
                
                this.massLocs[i - 1].x -= (w0/ (w0+w1)) * corr * dx;
                this.massLocs[i - 1].y -= (w0/ (w0+w1)) * corr * dy;

                this.massLocs[i].x += (w1/ (w0+w1)) * corr * dx;
                this.massLocs[i].y += (w1/ (w0+w1)) * corr * dy;
            }
            for (let i = 1; i < this.masses.length; i++) {

                this.massVels[i].x = (this.massLocs[i].x - this.prevMassLocs[i].x) / dt;
                this.massVels[i].y = (this.massLocs[i].y - this.prevMassLocs[i].y) / dt;
            }
        
    }

    updateTrail(){
        this.trail[this.trailEnd] = this.massLocs[this.masses.length - 1].x;
        this.trail[this.trailEnd + 1] = this.massLocs[this.masses.length - 1].y;
        this.trailEnd = (this.trailEnd + 2) % this.trail.length;
        if (this.trailEnd === this.trailStart) {
            this.trailStart = (this.trailStart + 2) % this.trail.length;
        }
    }

    display(c){
        push();
        translate(this.loc.x, this.loc.y);
        stroke(c);
        strokeWeight(1);
        if (this.trailEnd !== this.trailStart) {
            let i = this.trailStart;
            let j = i;
            i = (i + 2) % this.trail.length;
            while(i !== this.trailEnd){
                line(this.trail[j], this.trail[j + 1], this.trail[i], this.trail[i + 1]);
                j = i;
                i = (i + 2) % this.trail.length;
            }
        }

        stroke(0);
        strokeWeight(2);
        for (let i = 1; i < this.masses.length; i++) {
            line(this.massLocs[i].x, this.massLocs[i].y, this.massLocs[i-1].x, this.massLocs[i-1].y);
        }

        fill(c);
        noStroke();
        for (let i = 0; i < this.masses.length; i++) {
            let r =  Math.sqrt(this.masses[i] / Math.PI) * 50;
            circle(this.massLocs[i].x, this.massLocs[i].y, r * 2);
        }

        pop();
    }
}

function setup() {
    createCanvas(600, 600);
    physicsScene.pendulums.push(new TriplePendulum(new Vector(300,300), [1, 1, 1], [100,100,100], [-Math.PI/2, -Math.PI, -Math.PI], false));
    physicsScene.pendulums.push(new TriplePendulum(new Vector(300,300), [1, 1, 1], [100,100,100], [-Math.PI/2, -Math.PI, -Math.PI], true));
    background(255);
}

function draw(){
    background(255);
    physicsScene.pendulums[0].display("red");
    physicsScene.pendulums[1].display("green");
    physicsScene.pendulums[0].simulate();
    physicsScene.pendulums[1].simulate();
    physicsScene.pendulums[0].updateTrail();
    physicsScene.pendulums[1].updateTrail();
    
    //noLoop();
}

function mousePressed(){
    loop();
}
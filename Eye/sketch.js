// inspired by https://people.computing.clemson.edu/~sjoerg/docs/Duchowski15_PinkNoise.pdf 
class Eye {
    constructor(x, y, r) {
        this.loc = createVector(x, y);
        this.r = r;
        this.currentR = this.r;
        this.internalNoisep0 = random(500);
        this.internalNoisep1 = random(500, 1000);
        this.internalNoisep2 = random(1000, 1500);
        // below is new
        this.blinkGap = Math.floor(random(150, 300));
        this.lidY = 0;
        this.pinkNoiseX = new PinkNoise();
        this.pinkNoiseY = new PinkNoise();
        for (let i = 0; i < random(1000); i++) {
            this.pinkNoiseX.next();
        }

        for (let i = 0; i < random(1000); i++) {
            this.pinkNoiseY.next();
        }

        this.microsaccadicOffset = new p5.Vector();
        this.lookingAt = createVector(random(width), random(height));
        this.noisePC = random(1000);
        this.p = random(0.001, 0.05); // 0.001 - 0.05?
    }

    update() {
        this.internalNoisep0 += 0.005;
        this.internalNoisep1 += 0.007;
        this.internalNoisep2 += 0.007;
        this.noisePC += 0.003;
        this.lookingAt.x = noise(this.internalNoisep1) * width;
        this.lookingAt.y = noise(this.internalNoisep2) * height;
    }

    display() {
        push();
        translate(this.loc.x, this.loc.y);
        //outer boundary
        noFill();
        stroke(0,0,100);
        circle(0, 0, this.r * 2);
        //ir

        let th = 0;
        let p = 0;
        for (let i = 0; i < 62; ++i) {
            let h;
             h = (noise(th * 5, this.internalNoisep2 * 0.5) * 0.3 + 0.7) * this.r;
            // if (h > this.r) h = this.r;
            // h = this.r;
            let secNum = 20;
            let sw = 20;
            let prevX = 0, prevY = 0;
            push();
            rotate(th);
            let secL = h / secNum;
            for (let ii = 1; ii < secNum; ii++) {
                let x = secL * ii
                let y;
                y = (noise(x * 0.05, (th + 40) * 2, (this.internalNoisep2 + 40) * 2) - 0.5) * sw;
                // y = sin(x * 2 + (this.internalNoisep2 + 40) * 2) * sw * (0.5 + noise(th * 2, this.internalNoisep2 + 40) * 0.5);
                let hue = noise(p, this.noisePC) * 720 % 360;
                stroke(hue,80,100);
                line(x, y, prevX, prevY);
                prevX = x;
                prevY = y;
                p += this.p;
            }
            pop();
            th += TWO_PI / 63;
        }
        //inner ball
        fill(0,0,0, 240);
        noStroke();
        //let microsaccadicOffset;
        // microsaccadicOffset = p5.Vector.fromAngle(noise(this.internalNoisep0 * 0.05) * TWO_PI)
        // // PVector microsaccadicOffset = PVector.fromAngle(noise(this.internalNoisep0) * TWO_PI);
        // microsaccadicOffset.setMag(noise(this.internalNoisep1 * 0.05) * this.r * 0.4);
        //microsaccadicOffset = new p5.Vector(0,0);
        // microsaccadicOffset.x = (noise(this.internalNoisep0 * 0.005) - 0.5) * this.r * 0.8;
        // microsaccadicOffset.y = (noise(this.internalNoisep1 * 0.005) - 0.5) * this.r * 0.8;
        let direVec = p5.Vector.sub(this.lookingAt, this.loc);
        let direM = direVec.mag();
        const maxRange = 0.7
        direM = map(direM, 0, width, 0, this.r * maxRange);
        if (direM > this.r * maxRange) direM = this.r * maxRange;
        direVec = direVec.normalize();
        direVec = direVec.mult(direM);
        let newX = (this.pinkNoiseX.next() / 1.8 - 0.5) * this.r * 0.15;
        let newY = (this.pinkNoiseY.next() / 1.8 - 0.5) * this.r * 0.15;
        this.microsaccadicOffset.x = lerp(this.microsaccadicOffset.x, newX, 0.8);
        this.microsaccadicOffset.y = lerp(this.microsaccadicOffset.y, newY, 0.8);
        let rr = noise((this.loc.x + offset0) * locNoiseCoff, (this.loc.y + offset1) * locNoiseCoff, noiseP0);
        rr = map(rr, 0, 1, 0.2, 0.5);
        let currentR = this.r * rr;
        circle(direVec.x + this.microsaccadicOffset.x, direVec.y + this.microsaccadicOffset.y, currentR * 2);
        this.blink();
        pop();

        //debug
        // push();
        // stroke(0,100,100);
        // strokeWeight(5);
        // point(this.lookingAt.x, this.lookingAt.y);
        // pop();
    }

    blink() { // new
        if (this.blinkGap > 0) {
            this.blinkGap--;
            return
        }

        if (this.lidY < 2 * this.r) {
            this.lidY += this.r / 4 * map(abs(this.lidY - this.r), 0, this.r, 1, 1.5);
            let y = this.lidY > this.r ? 2 * this.r - this.lidY : this.lidY
            let ang = Math.acos((this.r - y) / this.r);
            fill(0,0,100,150);
            noStroke();
            arc(0, 0, 2 * this.r, 2 * this.r, - (Math.PI / 2 + ang), - (Math.PI / 2 - ang), OPEN);
            arc(0, 0, 2 * this.r, 2 * this.r, (Math.PI / 2 - ang), (Math.PI / 2 + ang), OPEN);

        } else {
            this.blinkGap = Math.floor(random(150, 300));
            this.lidY = 0;
        }

    }

}
let noiseP0, offset0, offset1;
const locNoiseCoff = 0.01;
let eye;

function setup() {
    colorMode(HSB);
    noiseP0 = random(100);
    offset0 = random(-5000, 5000);
    offset1 = random(-5000, 5000);
    createCanvas(1000, 1000);
    background(0,0,0);
    eye = new Eye(width / 2, height / 2, 100);
    frameRate(30);
}

function draw() {
    background(0,0,0);
    eye.update();
    eye.display();
    noiseP0 += 0.01;
    //noLoop();
}
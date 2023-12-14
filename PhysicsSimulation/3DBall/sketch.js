class Ball {
    /**
     * create a ball instance
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @param {number} r 
     */
    constructor(x, y, z, r) {
        this.loc = new p5.Vector(x, y, z); // location
        this.r = r;
        this.acc = new p5.Vector(0, 0, 0); //acceleration
        this.v = new p5.Vector(random(-10,10), 0, random(-10,10)); // velocity 
        this.m = 1; //mass
    }

    /**
     * apply force to the ball
     * 
     * @param {Vector} force 
     */
    applyForce(force){
        this.acc = this.acc.add(force.div(this.m)); // F = ma
    }

    /**
     * update the status of the ball
     */
    update() {
        this.v = this.v.add(this.acc.mult(deltaT)); // update velocity: v = at
        this.acc = this.acc.mult(0); // reset acceleration
        this.loc = this.loc.add(this.v);// update location
    }

    /**
     * display the ball
     */
    display(){
        push();
        translate(this.loc.x, this.loc.y, this.loc.z);
        fill(255,0,0);
        noStroke();
        sphere(this.r * 2);
        pop();
    }
}

const g = new p5.Vector(0, 9.8, 0);
const deltaT = 1.0 / 60.0;
let ball;
let containerSize = 300;

function setup() {
    createCanvas(600, 600, WEBGL);
    background(255);
    noStroke();
    fill(126);
    frameRate(60);
    ball = new Ball(random(-containerSize/2 + 10, containerSize/2 - 10), random(-containerSize/2 + 10, containerSize/2 - 10), random(-containerSize/2 + 10, containerSize/2 - 10), 5);
    console.log(ball);
}

function draw(){
    background(0);
    orbitControl();
    stroke(255);
    noFill();
    box(containerSize);
    //draw container box
    simulate();
    ball.display();
}

/**
 * do the physics simulation
 */
function simulate(){
    //apply gravity
    ball.applyForce(g);
    ball.update();
    //handle boundary bouncing
    if (ball.loc.x < -containerSize/2) {
        ball.loc.x = -containerSize/2;
        ball.v.x = - ball.v.x;
    }
    if (ball.loc.y < -containerSize/2) {
        ball.loc.y = -containerSize/2;
        ball.v.y = - ball.v.y;
    }
    if (ball.loc.x > containerSize/2) {
        ball.loc.x = containerSize/2;
        ball.v.x = - ball.v.x;
    }
    if (ball.loc.y > containerSize/2) {
        ball.loc.y = containerSize/2;
        ball.v.y = - ball.v.y;
    }
    if (ball.loc.z > containerSize/2) {
        ball.loc.z = containerSize/2;
        ball.v.z = - ball.v.z;
    }
    if (ball.loc.z < -containerSize/2) {
        ball.loc.z = -containerSize/2;
        ball.v.z = - ball.v.z;
    }
}
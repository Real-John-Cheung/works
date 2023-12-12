class Ball {
    /**
     * create a ball instance
     * @param {number} x 
     * @param {number} y 
     * @param {number} r 
     */
    constructor(x, y, r) {
        this.loc = new p5.Vector(x, y); // location
        this.r = r;
        this.acc = new p5.Vector(0, 0); //acceleration
        this.v = new p5.Vector(0, 0); // velocity 
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
        circle(this.loc.x, this.loc.y, this.r * 2);
    }
}

const g = new p5.Vector(0, 9.8);
const deltaT = 1.0 / 60.0;
let ball;

function setup() {
    createCanvas(600, 600);
    background(255);
    noStroke();
    fill(126);
    frameRate(60);
    ball = new Ball(random(10,width-10), random(10,height-10), 5);
    ball.v.x = random(-10,10); // random horizontal velocity
}

function draw(){
    background(255);
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
    if (ball.loc.x < 0) {
        ball.loc.x = 0;
        ball.v.x = - ball.v.x;
    }
    if (ball.loc.y < 0) {
        ball.loc.y = 0;
        ball.v.y = - ball.v.y;
    }
    if (ball.loc.x > width) {
        ball.loc.x = width;
        ball.v.x = - ball.v.x;
    }
    if (ball.loc.y > height) {
        ball.loc.y = height;
        ball.v.y = - ball.v.y;
    }
}
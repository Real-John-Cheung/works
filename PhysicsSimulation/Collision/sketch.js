let physicsScene = {
    gravity: new p5.Vector(0,0),
    deltaT: 1/60,
    paused: false,
    balls: [],
    restitution: 1
}

class Ball{
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} r r
     * @param {number} m mass
     * @param {Vector} v 
     */
    constructor(x,y,r,v){
        this.loc = new p5.Vector(x,y);
        this.v = v || new p5.Vector(random(-10, 10), random(-10,10)); // velocity
        this.r = r;
        this.m = r * r * PI;
        this.acc = new p5.Vector(0,0); // acceleration
    }

    /**
     * 
     * @param {Vector} f 
     */
    applyForce(f){
        this.acc.add(f.div(this.m)); // F = ma
    }

    update(){

        this.v.add(this.acc.mult(physicsScene.deltaT)); // v = at
        this.acc.mult(0);
        this.loc.add(this.v);
    }

    display(){
        circle(this.loc.x, this.loc.y, this.r * 2);
    }
}

/**
 * 
 * @param {Ball} ball1 
 * @param {Ball} ball2 
 * @param {number} restitution 
 */
function detectCollision(ball1, ball2, restitution){
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
    let newV1 = ((m1 - restitution * m2)*v1 + m2 * (1 + restitution) * v2) / (m1 + m2);
    let newV2 = (m1 * (1 + restitution) * v1 + (m2 - restitution * m1)*v2) / (m1 + m2);
    
    ball1.v = ball1.v.add(p5.Vector.mult(dir, newV1 - v1));
    ball2.v = ball2.v.add(p5.Vector.mult(dir, newV2 - v2));
}

function simulate(){
    for (let i = 0; i < physicsScene.balls.length; i++) {
        let ballI = physicsScene.balls[i];
        
        for (let j = i + 1; j < physicsScene.balls.length; j++) {
            let ballJ = physicsScene.balls[j];
            detectCollision(ballI, ballJ, physicsScene.restitution);
        }

        // Think: below code give a what kind of collision between the balls and the wall?
        if (ballI.loc.x < ballI.r){
            ballI.loc.x = ballI.r;
            ballI.v.x = - ballI.v.x;
        }
        if (ballI.loc.x > width - ballI.r){
            ballI.loc.x = width - ballI.r;
            ballI.v.x = - ballI.v.x;
        }
        if (ballI.loc.y < ballI.r){
            ballI.loc.y = ballI.r;
            ballI.v.y = - ballI.v.y;
        }
        if (ballI.loc.y > height - ballI.r){
            ballI.loc.y = height - ballI.r;
            ballI.v.y = - ballI.v.y;
        }
    }
}

function setup(){
    createCanvas(600,600);
    background(255);
    fill(255,0,0);
    noStroke();
    for (let i = 0; i < 20; i++) {
        let r = random(10,20);
        physicsScene.balls.push(new Ball(random(20, width - 20), random(20, height - 20), r));
    }

    //physicsScene.balls = [new Ball(100,300,20,new p5.Vector(10,0)), new Ball(300,300,30,new p5.Vector(-10,0))]
}

function draw(){
    background(255);
    simulate();
    physicsScene.balls.forEach(b => {
        b.display();
        b.applyForce(physicsScene.gravity)
        b.update();
    });
    
    //noLoop();
}

function mousePressed(){
    loop()
}
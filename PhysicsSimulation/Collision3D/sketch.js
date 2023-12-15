import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
let threeScene;
let renderer;
let camera;
let cameraControl;
let physicsScene = {
    gravity: new THREE.Vector3(0,0,0),
    deltaT: 1/60,
    paused: false,
    balls: [],
    restitution: 1
}

function random(min, max){
    return min + Math.random() * (max - min);
}

class Ball{
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @param {number} r 
     * @param {Vector3} v
     */
    constructor(x,y,z,r,v){
        this.loc = new THREE.Vector3(x,y,z);
        this.r = r;
        this.m = r*r*r*Math.PI;
        this.acc = new THREE.Vector3(0,0,0);
        this.v = v || new THREE.Vector3(random(-0.1,0.1), random(-0.1,0.1), random(-0.1,0.1));
        let geometry = new THREE.SphereGeometry(r, 32, 32);
        let mat = new THREE.MeshPhongMaterial({color: 0xff0000});
        this.mesh = new THREE.Mesh(geometry, mat);
        this.mesh.position.copy(this.loc);
        threeScene.add(this.mesh);
    }

    /**
     * 
     * @param {Vector3} f 
     */
    applyForce(f){
        this.acc.add(f.divideScalar(this.m)); // F = ma;
    }

    update(){
        this.v.addScaledVector(this.acc, physicsScene.deltaT);
        this.acc.multiplyScalar(0);
        this.loc.add(this.v);
        this.mesh.position.copy(this.loc);
    }
}

function checkCollision(ball1, ball2, restitution){
    let dir = new THREE.Vector3;
    dir.subVectors(ball2.loc, ball1.loc);

    // check if collision is happening
    if (dir.lengthSq() === 0 || dir.lengthSq() > (ball1.r + ball2.r) * (ball1.r + ball2.r)) return;

    let d = dir.length();
    dir = dir.normalize();

    //separate the balls
    let intersectLength = (ball1.r + ball2.r - d) / 2;
    ball1.loc = ball1.loc.addScaledVector(dir, - intersectLength);
    ball2.loc = ball2.loc.addScaledVector(dir, intersectLength);

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

    ball1.v = ball1.v.addScaledVector(dir, newV1 - v1);
    ball2.v = ball2.v.addScaledVector(dir, newV2 - v2);
}

function simulate(){
    for (let i = 0; i < physicsScene.balls.length; i++) {
        let ballI = physicsScene.balls[i];
        
        for (let j = i + 1; j < physicsScene.balls.length; j++) {
            let ballJ = physicsScene.balls[j];
            checkCollision(ballI, ballJ, physicsScene.restitution);
        }

        if (ballI.loc.x < - 2 + ballI.r){
            ballI.loc.x = - 2 + ballI.r;
            ballI.v.x = - ballI.v.x;
        }
        if (ballI.loc.x > 2 - ballI.r){
            ballI.loc.x = 2 - ballI.r;
            ballI.v.x = - ballI.v.x;
        }
        if (ballI.loc.y < - 2 + ballI.r){
            ballI.loc.y = - 2 + ballI.r;
            ballI.v.y = - ballI.v.y;
        }
        if (ballI.loc.y > 2 - ballI.r){
            ballI.loc.y = 2 - ballI.r;
            ballI.v.y = - ballI.v.y;
        }
        if (ballI.loc.z < - 2 + ballI.r){
            ballI.loc.z = - 2 + ballI.r;
            ballI.v.z = - ballI.v.z;
        }
        if (ballI.loc.z > 2 - ballI.r){
            ballI.loc.z = 2 - ballI.r;
            ballI.v.z = - ballI.v.z;
        }

        ballI.update();
    }
}

function init(){
    threeScene = new THREE.Scene(); 
    threeScene.add(new THREE.AmbientLight(0xffffff));
    threeScene.fog = new THREE.Fog( 0x000000, 0, 15 );

    let box = new THREE.BoxGeometry(4,4,4);
    box = new THREE.EdgesGeometry(box, 15)
    let container = new THREE.LineSegments(box, new THREE.LineBasicMaterial({color: 0xffffff}));

    threeScene.add(container);

    renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true;
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( 600,600 );
    document.getElementById("container").appendChild(renderer.domElement);
    //renderer.domElement.onclick = simulate;
    camera = new THREE.PerspectiveCamera( 70, 1, 0.01, 2000);
	camera.position.set(0, 1, 4);
	camera.updateMatrixWorld();	
	threeScene.add( camera );
    cameraControl = new OrbitControls(camera, renderer.domElement);
    cameraControl.zoomSpeed = 2.0;
    cameraControl.panSpeed = 0.4;

    for (let i = 0; i < 20; i++) {
        let r = random(.1,.2);
        physicsScene.balls.push(new Ball(random(-1.5,1.5),random(-1.5,1.5),random(-1.5,1.5), r));
    }
}

function update(){
    simulate();
    renderer.render(threeScene, camera)
    requestAnimationFrame(update)
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    update();
})
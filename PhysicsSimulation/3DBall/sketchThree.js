import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
let threeScene;
let renderer;
let camera;
let cameraControl;

function random(min, max){
    return min + Math.random() * (max - min);
}

/**
 * object for physics information
 */
let physicsScene = {
    gravity: new THREE.Vector3(0, -0.98, 0),
    deltaT :1 / 60,
    objects : [],
    paused : true,
}

class Ball {
    /**
     * create a ball instance
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @param {number} r 
     */
    constructor(x, y, z, r) {
        this.loc = new THREE.Vector3(x, y, z); // location
        this.r = r;
        this.acc = new THREE.Vector3(0, 0, 0); //acceleration
        this.v = new THREE.Vector3(random(-0.1,0.1), 0, random(-0.1,.1)); // velocity 
        this.m = 1; //mass
        let geometry = new THREE.SphereGeometry(r, 32, 32);
        let mat = new THREE.MeshPhongMaterial({color: 0xff0000});
        this.mesh = new THREE.Mesh(geometry, mat);
        this.mesh.position.copy(this.loc);
        threeScene.add(this.mesh);
    }

    /**
     * apply force to the ball
     * 
     * @param {Vector} force 
     */
    applyForce(force){
        this.acc = this.acc.add(force.divideScalar(this.m)); // F = ma
    }

    /**
     * update the status of the ball
     */
    update() {
        this.v = this.v.add(this.acc.multiplyScalar(physicsScene.deltaT)); // update velocity: v = at
        this.acc = this.acc.multiplyScalar(0); // reset acceleration
        this.loc = this.loc.add(this.v);// update location
        this.mesh.position.copy(this.loc);
        //console.log(this.loc, this.mesh.position);
    }

}

function init(){
    threeScene = new THREE.Scene();
    threeScene.add(new THREE.AmbientLight(0xffffff));
    threeScene.fog = new THREE.Fog( 0x000000, 0, 15 );

    let box = new THREE.BoxGeometry(3,3,3);
    box = new THREE.EdgesGeometry(box, 15)
    let container = new THREE.LineSegments(box, new THREE.LineBasicMaterial({color: 0xffffff}));

    threeScene.add(container);

    renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true;
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( 400,400 );
    document.getElementById("container").appendChild(renderer.domElement);
    //renderer.domElement.onclick = simulate;
    camera = new THREE.PerspectiveCamera( 70, 1, 0.01, 2000);
	camera.position.set(0, 1, 4);
	camera.updateMatrixWorld();	
	threeScene.add( camera );
    cameraControl = new OrbitControls(camera, renderer.domElement);
    cameraControl.zoomSpeed = 2.0;
    cameraControl.panSpeed = 0.4;

    let ball = new Ball(0,random(0,1.3),0, .2);
    physicsScene.objects.push(ball);
    physicsScene.paused = false;
}

function simulate(){
    if (physicsScene.paused) return;
    physicsScene.objects.forEach(o => {
        o.applyForce(physicsScene.gravity);
        if (o.loc.x < - 1.3) {
            o.loc.x = - 1.3;
            o.v.x = - o.v.x;
        }
        if (o.loc.x > 1.3){
            o.loc.x = 1.3;
            o.v.x = - o.v.x;
        }
        if (o.loc.y < - 1.3) {
            o.loc.y = - 1.3;
            o.v.y = - o.v.y;
        }
        if (o.loc.y > 1.3){
            o.loc.y = 1.3;
            o.v.y = - o.v.y;
        }
        if (o.loc.z < - 1.3) {
            o.loc.z = - 1.3;
            o.v.z = - o.v.z;
        }
        if (o.loc.z > 1.3){
            o.loc.z = 1.3;
            o.v.z = - o.v.z;
        }
        o.update();
    });
}

function update(){
    simulate();
    renderer.render(threeScene, camera);
    cameraControl.update();
    requestAnimationFrame(update);
}

init();
update();
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
let threeScene;
let renderer;
let camera;
let cameraControl;

function init(){
    threeScene = new THREE.Scene(); 
    threeScene.add(new THREE.AmbientLight(0xffffff));
    threeScene.fog = new THREE.Fog( 0x000000, 0, 15 );

    renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true;
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( 600,600 );
    document.getElementById("container").appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera( 70, 1, 0.01, 2000);
	camera.position.set(0, 1, 4);
	camera.updateMatrixWorld();	
	threeScene.add( camera );
    cameraControl = new OrbitControls(camera, renderer.domElement);
    cameraControl.zoomSpeed = 2.0;
    cameraControl.panSpeed = 0.4;
}

function update(){
    renderer.render(threeScene, camera);
    requestAnimationFrame(update);
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    update();
})
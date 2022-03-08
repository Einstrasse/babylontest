import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import * as MATERIALS from '@babylonjs/materials/legacy/legacy';
import { FirstPersonCamera } from './camera';

// Required side effects to populate the Create methods on the mesh class. Without this, the bundle would be smaller but the createXXX methods from mesh would not be accessible.
import "@babylonjs/core/Meshes/meshBuilder";


const canvas = document.getElementById("renderCanvas"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

// Add your code here matching the playground format
const createScene = function () {

    const scene = new BABYLON.Scene(engine);  

    scene.gravity = new BABYLON.Vector3(0, -0.35, 0);
    scene.collisionsEnabled = true;

    const box = BABYLON.MeshBuilder.CreateBox("box", {width: 1.5, height: 1.5, depth: 1.5});
    box.position.y = 4;
    box.checkCollisions = true;

    const camera = new FirstPersonCamera("FPCamera", scene);
    camera.attachControl(canvas, true);
    scene.initAfterRender = function() {
        camera.initAfterRender();
    }
    // const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0));
    
    //Camera settings end



    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0));
    const material = new MATERIALS.GridMaterial("groundMaterial", scene);
    material.gridRatio = 0.1;

    // const ground = BABYLON.Mesh.CreateGround("ground", 12, 12, 2, scene);
    // BABYLON.SceneLoader.ImportMeshAsync(["semi_house"], "https://assets.babylonjs.com/meshes/", "both_houses_scene.babylon");

    BABYLON.SceneLoader.ImportMeshAsync(["ground", "semi_house"], "https://assets.babylonjs.com/meshes/", "both_houses_scene.babylon").then((res) => {
        const ground = scene.getMeshByName("ground");
        ground.scaling.x = 5;
        ground.scaling.z = 5;
        ground.material = material;
        ground.checkCollisions = true;
    });

    return scene;
};

const scene = createScene(); //Call the createScene function
scene.render();
scene.initAfterRender();
// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
    scene.render();
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});
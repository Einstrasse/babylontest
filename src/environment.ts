import { Scene, Mesh, Vector3, Color3, TransformNode, SceneLoader, ParticleSystem, Color4, Texture, PBRMetallicRoughnessMaterial, VertexBuffer, AnimationGroup, Sound, ExecuteCodeAction, ActionManager, Tags, MeshBuilder, AbstractMesh } from "@babylonjs/core";
import { GridMaterial } from '@babylonjs/materials';

export class Environment {
    private _scene : Scene;

    constructor(scene: Scene) {
        this._scene = scene;
    }

    public async load() {
        const assets = await this._loadAsset();

        assets.allMeshes.forEach(m => {
            m.receiveShadows = true;
            m.checkCollisions = true;
            m.showBoundingBox = true;
        });
    }

    private async _loadAsset() {

        let allMeshes = [];
        //load game environment
        let box: Mesh = MeshBuilder.CreateBox("box", { size: 2 });
        box.position.y = 1;
        box.position.x = -2;
        box.checkCollisions = true;
        // box.isVisible = false;
        
        let sphere: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, this._scene);
        sphere.position.y = 0.5;
        sphere.position.x = 3;

        const material = new GridMaterial("groundMaterial", this._scene);
        material.gridRatio = 0.1;

        const result = await SceneLoader.ImportMeshAsync(["ground", "semi_house"], "https://assets.babylonjs.com/meshes/", "both_houses_scene.babylon", this._scene);

        const ground = this._scene.getMeshByName("ground");
        ground.scaling.x = 5;
        ground.scaling.z = 5;
        ground.material = material;
        // ground.checkCollisions = true;

        const house = result.meshes[1];
        house.position.x = 2;
        house.position.z = 2;

        allMeshes.push(box);
        allMeshes.push(sphere);
        allMeshes.push(house);
        allMeshes.push(ground);

        return {
            allMeshes: allMeshes as AbstractMesh[]
        };

        
    }
}
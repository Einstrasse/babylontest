import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import { Engine, Scene, Matrix, FreeCamera, Mesh, HemisphericLight, Vector3, MeshBuilder, Quaternion, SceneLoader, TransformNode, Camera, ShadowGenerator, PointLight, Color3 } from '@babylonjs/core';
import { GridMaterial } from '@babylonjs/materials';
import { Player } from './characterController';
import { PlayerInput } from './inputController';

enum State { START = 0, GAME = 1, LOSE = 2, CUTSCENE = 3 }

class App {

    public camera: Camera;
    public assets;

    private _scene : Scene;
    private _canvas : HTMLCanvasElement;
    private _engine: Engine;
    private _camRoot: TransformNode;
    private _yTilt: TransformNode;
    private _player: Player;
    private _input: PlayerInput;


    private _state : State;

    private _createCanvas() : HTMLCanvasElement {
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);
        return canvas;
    }
    constructor() {
        // create the canvas html element and attach it to the webpage
        this._canvas = this._createCanvas();

        // initialize babylon scene and engine
        this._engine = new Engine(this._canvas, true);
        this._scene = new Scene(this._engine);

        this._setInspector();
        this._main();
    }
    
    private _setInspector() {
        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (this._scene.debugLayer.isVisible()) {
                    this._scene.debugLayer.hide();
                } else {
                    this._scene.debugLayer.show();
                }
            }
        });
    }
    
    private async _main(): Promise<void> {
        await this._goToStart();
        // run the main render loop
        this._engine.runRenderLoop(() => {
            switch (this._state) {
                case State.START:
                    this._scene.render();
                    break;
            }
        });
    }

    //load the character model
    private async _loadCharacterAssets(scene): Promise<any> {

        async function loadCharacter() {
            //collision mesh
            const outer = MeshBuilder.CreateBox("outer", { width: 2, depth: 1, height: 3 }, scene);
            outer.isVisible = false;
            outer.isPickable = false;
            outer.checkCollisions = true;

            //move origin of box collider to the bottom of the mesh (to match player mesh)
            outer.bakeTransformIntoVertices(Matrix.Translation(0, 1.5, 0))
            //for collisions
            outer.ellipsoid = new Vector3(1, 1.5, 1);
            outer.ellipsoidOffset = new Vector3(0, 1.5, 0);

            outer.rotationQuaternion = new Quaternion(0, 1, 0, 0); // rotate the player mesh 180 since we want to see the back of the player
            
            //--IMPORTING MESH--
            return SceneLoader.ImportMeshAsync("", "./models/dude/", "dude.babylon", scene).then((result) =>{
                const root = result.meshes[0];
                root.scaling.x = 0.02;
                root.scaling.y = 0.02;
                root.scaling.z = 0.02;
                
                //body is our actual player mesh
                const body = root;
                body.parent = outer;
                body.isPickable = false;
                body.getChildMeshes().forEach(m => {
                    m.isPickable = false;
                })

                //return the mesh and animations
                return {
                    mesh: outer as Mesh,
                    animationGroups: result.animationGroups,
                    skeleton: result.skeletons[0]
                }
            });
        }

        return loadCharacter().then(assets => {
            this.assets = assets;
        });
    }

    private _createGameScene(scene: Scene): Scene {
        // let scene = new Scene(this._engine);
        // scene.clearColor = new Color4(0, 0, 0, 1);
    
                
        // var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
        var sphere: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);
        sphere.position.y = 0.5;
        sphere.position.x = 3;
    
        // let camera: FreeCamera = new FreeCamera("Camera", new Vector3(5, 5, -5), scene);
        // camera.attachControl(this._canvas, true);
        // camera.setTarget(Vector3.Zero());

        const material = new GridMaterial("groundMaterial", scene);
        material.gridRatio = 0.1;

        SceneLoader.ImportMeshAsync(["ground", "semi_house"], "https://assets.babylonjs.com/meshes/", "both_houses_scene.babylon").then((res) => {
            const ground = scene.getMeshByName("ground");
            const house = res.meshes[1];
            ground.scaling.x = 5;
            ground.scaling.z = 5;
            ground.material = material;
            ground.checkCollisions = true;

            house.position.x = 2;
            house.position.z = 2;
        });

        return scene;
    }

    private async _goToStart() {
        this._engine.displayLoadingUI();
        this._scene.detachControl();
        await this._setUpGame();
        this._engine.hideLoadingUI();
    }

    private async _initGameAsync(scene): Promise<void> {
        //temporary light to light the entire scene
        var light0 = new HemisphericLight("HemiLight", new Vector3(0, 1, 0), scene);

        const light = new PointLight("sparklight", new Vector3(0, 0, 0), scene);
        light.diffuse = new Color3(0.08627450980392157, 0.10980392156862745, 0.15294117647058825);
        light.intensity = 0.3;
        light.radius = 1;

        const shadowGenerator = new ShadowGenerator(1024, light);
        shadowGenerator.darkness = 0.4;

        //Create the player
        this._player = new Player(this.assets, scene, shadowGenerator, this._input); //dont have inputs yet so we dont need to pass it in
        const camera = this._player.activatePlayerCamera();
    }
    
    private async _setUpGame() {
        let scene = new Scene(this._engine);
        this._input = new PlayerInput(scene);
        await this._loadCharacterAssets(scene);
        await this._initGameAsync(scene);
        scene = this._createGameScene(scene);
        await scene.whenReadyAsync();
        this._scene.dispose();
        this._scene = scene;
        this._state = State.START;
    }
}
new App();
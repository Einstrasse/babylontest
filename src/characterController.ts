import { Engine, Scene, UniversalCamera, FreeCamera, Mesh, HemisphericLight, Vector3, MeshBuilder, Color4, SceneLoader, Quaternion, TransformNode, Camera, ShadowGenerator, ArcRotateCamera, Skeleton, Animatable, Ray, Vector2 } from '@babylonjs/core';
import { PlayerInput } from "./inputController";

export class Player extends TransformNode {
    public camera;
    public scene: Scene;
    private _input: PlayerInput;
    private _camRoot : TransformNode;
    private _yTilt: TransformNode;
    private _camAngle: number = 0;

    //player movement vars
    private _deltaTime: number = 0;
    private _h: number; //x-axis
    private _v: number; //z-axis
    private _grounded: boolean;
    private _gravity: Vector3 = new Vector3();

    private _moveDirection: Vector3 = new Vector3(); // vector that holds movement information
    private _inputAmt: number;
 
    private static readonly ORIGINAL_TILT: Vector3 = new Vector3(0.3534119456780721, 0, 0);

    //const values
    private static readonly PLAYER_SPEED: number = 0.025 * 2;
    private static readonly GRAVITY: number = 0.05;
    private static readonly WALK_ANIMATION_SPEED: number = 1.0 * 2;
    private static readonly CAMERA_ROTATION_SPEED: number = 0.05;


    //Player
    public mesh: Mesh; //outer collision box of player
    public skeleton: Skeleton;
    public walkingAnimation: Animatable;

    public tutorial_move;

    constructor(assets, scene: Scene, shadowGenerator: ShadowGenerator, input?) {
        super("player", scene);
        this.scene = scene;
        this._setupPlayerCamera();
        this.mesh = assets.mesh;
        this.mesh.parent = this;
        this.skeleton = assets.skeleton;

        shadowGenerator.addShadowCaster(assets.mesh);
        this._input = input;
        this.walkingAnimation = null;

    }

    public activatePlayerCamera(): UniversalCamera {
        this.scene.registerBeforeRender(() => {

            this._beforeRenderUpdate();
            this._updateCamera();

        })
        return this.camera;
    }

        //--GROUND DETECTION--
    //Send raycast to the floor to detect if there are any hits with meshes below the character
    private _floorRaycast(offsetx: number, offsetz: number, raycastlen: number): Vector3 {
        //position the raycast from bottom center of mesh
        let raycastFloorPos = new Vector3(this.mesh.position.x + offsetx, this.mesh.position.y + 0.5, this.mesh.position.z + offsetz);
        let ray = new Ray(raycastFloorPos, Vector3.Up().scale(-1), raycastlen);

        //defined which type of meshes should be pickable
        let predicate = function (mesh) {
            return mesh.isPickable && mesh.isEnabled();
        }

        let pick = this.scene.pickWithRay(ray, predicate);

        if (pick.hit) { //grounded
            return pick.pickedPoint;
        } else { //not grounded
            return Vector3.Zero();
        }
    }

    //raycast from the center of the player to check for whether player is grounded
    private _isGrounded(): boolean {
        if (this._floorRaycast(0, 0, .6).equals(Vector3.Zero())) {
            return false;
        } else {
            return true;
        }
    }

    private _updateGroundDetection(): void {
        this._grounded = this._isGrounded();
        if (this._grounded) {
            this._gravity.y = 0;
        } else {
            this._gravity.y = -Player.GRAVITY;
        }
        //move our mesh
        this.mesh.moveWithCollisions(this._moveDirection.addInPlace(this._gravity));
    }

    private _beforeRenderUpdate(): void {
        this._updateFromControls();
        this._updateGroundDetection();
        
        
    }

    private _setupPlayerCamera(): UniversalCamera {
        //root camera parent that handles positioning of the camera to follow the player
        this._camRoot = new TransformNode("root");
        this._camRoot.position = new Vector3(0, 0, 0); //initialized at (0,0,0)
        //to face the player from behind (180 degrees)
        this._camRoot.rotation = new Vector3(0, Math.PI, 0);

        //rotations along the x-axis (up/down tilting)
        let yTilt = new TransformNode("ytilt");
        //adjustments to camera view to point down at our player
        yTilt.rotation = Player.ORIGINAL_TILT;
        this._yTilt = yTilt;
        yTilt.parent = this._camRoot;

        //our actual camera that's pointing at our root's position
        this.camera = new UniversalCamera("cam", new Vector3(0, 0, -10), this.scene);
        // this.camera = new ArcRotateCamera("cam", 0, 0, 10, new Vector3(0, 0, -10), this.scene);
        // this.camera.lockedTarget = this._camRoot.position;
        this.camera.fov = 0.47350045992678597;
        this.camera.parent = yTilt;

        this.scene.activeCamera = this.camera;
        return this.camera;
    }

    private _updateCamera(): void {
        let centerPlayer = this.mesh.position.y + 2;
        this._camRoot.position = Vector3.Lerp(this._camRoot.position, new Vector3(this.mesh.position.x, centerPlayer, this.mesh.position.z), 0.4);
        if (this._input.cameraRotation !== 0) {
            console.log("HOOK", this._input.cameraRotation);
            this._camRoot.rotation.y += this._input.cameraRotation * Player.CAMERA_ROTATION_SPEED;
        }
    }

    private _updateFromControls(): void {
        this._deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;

        this._moveDirection = Vector3.Zero();
        this._h = this._input.horizontal; //right, x
        this._v = this._input.vertical; //fwd, z

        // Smoothing walking animation
        if (this._input.isWalking == true) {
            if (this.walkingAnimation == null) {
                this.walkingAnimation = this.scene.beginAnimation(this.skeleton, 0, 100, true, Player.WALK_ANIMATION_SPEED);
            } else if (this.walkingAnimation.animationStarted == false) {
                this.walkingAnimation.restart();
            }
        } else if (this._input.isWalking == false && this.walkingAnimation != null) {
            if (this.walkingAnimation.animationStarted) {
                this.walkingAnimation.pause();
            }
        }

        //tutorial, if the player moves for the first time
        if((this._h != 0 || this._v != 0) && !this.tutorial_move){
            this.tutorial_move = true;
            
        }
        //--MOVEMENTS BASED ON CAMERA (as it rotates)--
        let fwd = this._camRoot.forward;
        let right = this._camRoot.right;
        let correctedVertical = fwd.scaleInPlace(this._v);
        let correctedHorizontal = right.scaleInPlace(this._h);

        //movement based off of camera's view
        let move = correctedHorizontal.addInPlace(correctedVertical);

        //clear y so that the character doesnt fly up, normalize for next step, taking into account whether we've DASHED or not
        this._moveDirection = new Vector3((move).normalize().x, 0, (move).normalize().z);

        //clamp the input value so that diagonal movement isn't twice as fast
        let inputMag = Math.abs(this._h) + Math.abs(this._v);
        if (inputMag < 0) {
            this._inputAmt = 0;
        } else if (inputMag > 1) {
            this._inputAmt = 1;
        } else {
            this._inputAmt = inputMag;
        }
        //final movement that takes into consideration the inputs
        this._moveDirection = this._moveDirection.scaleInPlace(this._inputAmt * Player.PLAYER_SPEED);

        //check if there is movement to determine if rotation is needed
        let input = new Vector3(this._input.horizontalAxis, 0, this._input.verticalAxis); //along which axis is the direction
        if (input.length() == 0) {//if there's no input detected, prevent rotation and keep player in same rotation
            return;
        }

        //rotation based on input & the camera angle
        let angle = Math.atan2(this._input.horizontalAxis, this._input.verticalAxis);
        angle += this._camRoot.rotation.y + Math.PI;
        let targ = Quaternion.FromEulerAngles(0, angle, 0);
        this.mesh.rotationQuaternion = Quaternion.Slerp(this.mesh.rotationQuaternion, targ, 10 * this._deltaTime);
    }
}
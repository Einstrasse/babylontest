import { Scene, ActionManager, ExecuteCodeAction, Observer, Scalar } from '@babylonjs/core';
export class PlayerInput {

    public inputMap: any;

    //simple movement
    public horizontal: number = 0;
    public vertical: number = 0;
    //tracks whether or not there is movement in that axis
    public horizontalAxis: number = 0;
    public verticalAxis: number = 0;
    public isWalking: boolean = false;
    public cameraRotation: number = 0;

    private static readonly KEYS = {
        ROTATE_CAMERA_LEFT: "ArrowLeft",
        ROTATE_CAMERA_RIGHT: "ArrowRight",
        WALK_FORWARD: "w",
        WALK_BACKWARD: "s",
        WALK_LEFT: "a",
        WALK_RIGHT: "d"
    };

    constructor(scene: Scene) {
        scene.actionManager = new ActionManager(scene);
    
        this.inputMap = {};
        scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));
        scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));
    
        scene.onBeforeRenderObservable.add(() => {
            this._updateFromKeyboard();
        });
    }

    private _updateFromKeyboard(): void {
        if (this.inputMap[PlayerInput.KEYS.ROTATE_CAMERA_LEFT]) {
            this.cameraRotation = -1;
        } else if (this.inputMap[PlayerInput.KEYS.ROTATE_CAMERA_RIGHT]) {
            this.cameraRotation = +1;
        } else {
            this.cameraRotation = 0;
        }

        if (this.inputMap[PlayerInput.KEYS.WALK_FORWARD]) {
            this.vertical = Scalar.Lerp(this.vertical, 1, 0.2);
            this.verticalAxis = 1;
    
        } else if (this.inputMap[PlayerInput.KEYS.WALK_BACKWARD]) {
            this.vertical = Scalar.Lerp(this.vertical, -1, 0.2);
            this.verticalAxis = -1;
        } else {
            this.vertical = 0;
            this.verticalAxis = 0;
        }
    
        if (this.inputMap[PlayerInput.KEYS.WALK_LEFT]) {
            this.horizontal = Scalar.Lerp(this.horizontal, -1, 0.2);
            this.horizontalAxis = -1;
    
        } else if (this.inputMap[PlayerInput.KEYS.WALK_RIGHT]) {
            this.horizontal = Scalar.Lerp(this.horizontal, 1, 0.2);
            this.horizontalAxis = 1;
        }
        else {
            this.horizontal = 0;
            this.horizontalAxis = 0;
        }
        this.isWalking = (this.verticalAxis | this.horizontalAxis) != 0;
    }

}
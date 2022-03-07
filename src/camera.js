import * as BABYLON from '@babylonjs/core/Legacy/legacy';

function FirstPersonCamera(cameraName, scene) {
    const camera = new BABYLON.UniversalCamera(cameraName, new BABYLON.Vector3(0, 6, -10));
    camera.applyGravity = true;
    camera.ellipsoid = new BABYLON.Vector3(3, 3, 1);
    camera.setTarget(BABYLON.Vector3.Zero());
    // camera.attachControl(canvas, true);
    camera.checkCollisions = true;
    camera.speed = 0.02;
    camera.angularSpeed = 0.05;
    camera.angle = Math.PI/2;
    camera.position = new BABYLON.Vector3(-3, 6, -3);
    camera.direction = new BABYLON.Vector3(Math.cos(camera.angle), 0, Math.sin(camera.angle));

    const cameraJump = function() {
        camera.animations = [];

        const a = new BABYLON.Animation(
            "jump",
            "position.y", 20,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        var keys = [];
        keys.push({ frame: 0, value: camera.position.y});
        keys.push({ frame: 8, value: camera.position.y + 3});
        keys.push({ frame: 13, value: camera.position.y});
        a.setKeys(keys);

        var easingFunction = new BABYLON.CircleEase();
        easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
        a.setEasingFunction(easingFunction);
        camera.animations.push(a);

        scene.beginAnimation(camera, 0, 20, false);
    }

    //Camera settings start
    //First remove the default management.
    camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
    camera.inputs.removeByType("FreeCameraMouseInput");
     
    //Key Input Manager To Use Keys to Move Forward and BackWard and Look to the Left or Right
    var FreeCameraKeyboardWalkInput = function () {
        this._keys = [];
        this._upKeys = [];
        this.keysUp = [38, 87];
        this.keysDown = [40, 83];
        this.keysLeft = [37, 65];
        this.keysRight = [39, 68];
        this.keysJump = [32];
    }
    
    //Add attachment controls
    FreeCameraKeyboardWalkInput.prototype.attachControl = function (noPreventDefault) {
            var _this = this;
            var engine = this.camera.getEngine();
            var element = engine.getInputElement();
            if (!this._onKeyDown) {
                element.tabIndex = 1;
                this._onKeyDown = function (evt) {                 
                    if (_this.keysUp.indexOf(evt.keyCode) !== -1 ||
                        _this.keysDown.indexOf(evt.keyCode) !== -1 ||
                        _this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                        _this.keysRight.indexOf(evt.keyCode) !== -1) {
                        var index = _this._keys.indexOf(evt.keyCode);
                        if (index === -1) {
                            _this._keys.push(evt.keyCode);
                        }
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                };
                this._onKeyUp = function (evt) {
                    if (_this.keysUp.indexOf(evt.keyCode) !== -1 ||
                        _this.keysDown.indexOf(evt.keyCode) !== -1 ||
                        _this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                        _this.keysRight.indexOf(evt.keyCode) !== -1) {
                        var index = _this._keys.indexOf(evt.keyCode);
                        if (index >= 0) {
                            _this._keys.splice(index, 1);
                        }
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                    if (_this.keysJump.indexOf(evt.keyCode) !== -1) { 
                        //Handle on key up the jump key
                        var index = _this._upKeys.indexOf(evt.keyCode);
                        if (index === -1) {
                            _this._upKeys.push(evt.keyCode);
                        }
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                };
                element.addEventListener("keydown", this._onKeyDown, false);
                element.addEventListener("keyup", this._onKeyUp, false);
            }
        };


        //Add detachment controls
        FreeCameraKeyboardWalkInput.prototype.detachControl = function () {
            var engine = this.camera.getEngine();
            var element = engine.getInputElement();
            if (this._onKeyDown) {
                element.removeEventListener("keydown", this._onKeyDown);
                element.removeEventListener("keyup", this._onKeyUp);
                BABYLON.Tools.UnregisterTopRootEvents([
                    { name: "blur", handler: this._onLostFocus }
                ]);
                this._keys = [];
                this._onKeyDown = null;
                this._onKeyUp = null;
            }
        };

        //Keys movement control by checking inputs
        FreeCameraKeyboardWalkInput.prototype.checkInputs = function () {
            if (this._onKeyDown) {
                var camera = this.camera;
                for (var index = 0; index < this._keys.length; index++) {
                    var keyCode = this._keys[index];
                    var speed = camera.speed;
                    if (this.keysLeft.indexOf(keyCode) !== -1) {
                        camera.direction.copyFromFloats(-speed, 0, 0);             
                    }
                    else if (this.keysUp.indexOf(keyCode) !== -1) {
                        camera.direction.copyFromFloats(0, 0, speed);               
                    }
                    else if (this.keysRight.indexOf(keyCode) !== -1) {
                        camera.direction.copyFromFloats(speed, 0, 0);
                    }
                    else if (this.keysDown.indexOf(keyCode) !== -1) {
                        camera.direction.copyFromFloats(0, 0, -speed);
                    }
                    if (camera.getScene().useRightHandedSystem) {
                        camera.direction.z *= -1;
                    }
                    camera.getViewMatrix().invertToRef(camera._cameraTransformMatrix);
                    BABYLON.Vector3.TransformNormalToRef(camera.direction, camera._cameraTransformMatrix, camera._transformedDirection);
                    camera.cameraDirection.addInPlace(camera._transformedDirection);
                }
            }
            if (this._onKeyUp) {
                var camera = this.camera;
                for (var index = 0; index < this._upKeys.length; index++) {
                    var keyCode = this._upKeys[index];
                    if (this.keysJump.indexOf(keyCode) !== -1) {
                        //Pop jump key code
                        var index = this._upKeys.indexOf(keyCode);
                        if (index >= 0) {
                            this._upKeys.splice(index, 1);
                        }
                        cameraJump();
                        camera.getViewMatrix().invertToRef(camera._cameraTransformMatrix);
                        BABYLON.Vector3.TransformNormalToRef(camera.direction, camera._cameraTransformMatrix, camera._transformedDirection);
                        camera.cameraDirection.addInPlace(camera._transformedDirection);
                    }
                }
            }
        };

        //Add the onLostFocus function
        FreeCameraKeyboardWalkInput.prototype._onLostFocus = function (e) {
            this._keys = [];
        };
        
        //Add the two required functions for the control Name
        FreeCameraKeyboardWalkInput.prototype.getClassName = function () {
            return "FreeCameraKeyboardWalkInput";
        };

        FreeCameraKeyboardWalkInput.prototype.getSimpleName = function () {
            return "keyboard";
        };
    
    //Add the new keys input manager to the camera.
     camera.inputs.add(new FreeCameraKeyboardWalkInput());



    //The Mouse Manager to use the mouse (touch) to search around including above and below
    var FreeCameraSearchInput = function (touchEnabled) {
        if (touchEnabled === void 0) { touchEnabled = true; }
        this.touchEnabled = touchEnabled;
        this.buttons = [0, 1, 2];
        this.angularSensibility = 2000.0;
        this.restrictionX = 100;
        this.restrictionY = 60;
    }

    //add attachment control which also contains the code to react to the input from the mouse 
    FreeCameraSearchInput.prototype.attachControl = function (noPreventDefault) {
        var _this = this;
        var engine = this.camera.getEngine();
        var element = engine.getInputElement();
        var angle = {x:0, y:0};
        if (!this._pointerInput) {
            this._pointerInput = function (p, s) {
                var evt = p.event;
                if (!_this.touchEnabled && evt.pointerType === "touch") {
                    return;
                }
                if (p.type !== BABYLON.PointerEventTypes.POINTERMOVE && _this.buttons.indexOf(evt.button) === -1) {          
                    return;
                }
                if (p.type === BABYLON.PointerEventTypes.POINTERDOWN) {          
                    try {
                        evt.srcElement.setPointerCapture(evt.pointerId);
                    }
                    catch (e) {
                        //Nothing to do with the error. Execution will continue.
                    }
                    _this.previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY
                    };
                    if (!noPreventDefault) {
                        evt.preventDefault();
                        element.focus();
                    }
                }
                else if (p.type === BABYLON.PointerEventTypes.POINTERUP) {          
                    try {
                        evt.srcElement.releasePointerCapture(evt.pointerId);
                    }
                    catch (e) {
                        //Nothing to do with the error.
                    }
                    _this.previousPosition = null;
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                }
                else if (p.type === BABYLON.PointerEventTypes.POINTERMOVE) {            
                    if (!_this.previousPosition || engine.isPointerLock) {
                        return;
                    }
                    var offsetX = evt.clientX - _this.previousPosition.x;
                    var offsetY = evt.clientY - _this.previousPosition.y;                   
                    angle.x +=offsetX;
                    angle.y -=offsetY;  
                    if(Math.abs(angle.x) > _this.restrictionX )  {
                        angle.x -=offsetX;
                    }
                    if(Math.abs(angle.y) > _this.restrictionY )  {
                        angle.y +=offsetY;
                    }       
                    if (_this.camera.getScene().useRightHandedSystem) {
                        if(Math.abs(angle.x) < _this.restrictionX )  {
                            _this.camera.cameraRotation.y -= offsetX / _this.angularSensibility;
                        }
                    }
                    else {
                        if(Math.abs(angle.x) < _this.restrictionX )  {
                            _this.camera.cameraRotation.y += offsetX / _this.angularSensibility;
                        }
                    }
                    if(Math.abs(angle.y) < _this.restrictionY )  {
                        _this.camera.cameraRotation.x += offsetY / _this.angularSensibility;
                    }
                    _this.previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY
                    };
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                }
            };
        }
        this._onSearchMove = function (evt) {       
            if (!engine.isPointerLock) {
                return;
            }       
            var offsetX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || evt.msMovementX || 0;
            var offsetY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || evt.msMovementY || 0;
            if (_this.camera.getScene().useRightHandedSystem) {
                _this.camera.cameraRotation.y -= offsetX / _this.angularSensibility;
            }
            else {
                _this.camera.cameraRotation.y += offsetX / _this.angularSensibility;
            }
            _this.camera.cameraRotation.x += offsetY / _this.angularSensibility;
            _this.previousPosition = null;
            if (!noPreventDefault) {
                evt.preventDefault();
            }
        };
        this._observer = this.camera.getScene().onPointerObservable.add(this._pointerInput, BABYLON.PointerEventTypes.POINTERDOWN | BABYLON.PointerEventTypes.POINTERUP | BABYLON.PointerEventTypes.POINTERMOVE);
        element.addEventListener("mousemove", this._onSearchMove, false);
    };

    //Add detachment control
    FreeCameraSearchInput.prototype.detachControl = function () {
        var engine = this.camera.getEngine();
        var element = engine.getInputElement();
        if (this._observer && element) {
            this.camera.getScene().onPointerObservable.remove(this._observer);
            element.removeEventListener("mousemove", this._onSearchMove);
            this._observer = null;
            this._onSearchMove = null;
            this.previousPosition = null;
        }
    };

    //Add the two required functions for names
    FreeCameraSearchInput.prototype.getClassName = function () {
        return "FreeCameraSearchInput";
    };

    FreeCameraSearchInput.prototype.getSimpleName = function () {
        return "MouseSearchCamera";
    };

    //Add the new mouse input manager to the camera
    camera.inputs.add(new FreeCameraSearchInput());

    return camera;
}

export {
    FirstPersonCamera
};
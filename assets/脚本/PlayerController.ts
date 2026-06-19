import { _decorator, Component, Node, Vec3, input, Input, EventKeyboard, KeyCode, SkeletalAnimation, ITriggerEvent, PhysicsSystem, RigidBody, ICollisionEvent, SphereCollider, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlayerController')
export class PlayerController extends Component {
    @property(Node)
    camera: Node | null = null;

    @property
    moveSpeed: number = 5;

    @property
    cameraOffset: Vec3 = new Vec3(0, 20, 28.56);

    @property
    runAnimationName: string = 'run';

    @property(Node)
    wordDisplayNode: Node | null = null;

    @property
    moveDistancePerLetter: number = 2;

    @property
    moveDuration: number = 0.2;

    @property
    moveDirection: Vec3 = new Vec3(0, 0, -1);

    @property
    enableTypingMovement: boolean = true;

    @property({ slide: true, range: [0, 360, 0.1] })
    autoTurnAngle: number = 90;  // 自动转向的角度（度）

    @property
    autoTurnDistance: number = 2;  // 移动多少距离后自动转向

    @property
    continueMovingAfterAutoTurn: boolean = true;  // 自动转向后是否继续移动

    @property(Node)
    computerModel: Node | null = null;  // 电脑模型引用

    @property
    captureDistance: number = 2.0;  // 捕捉距离

    private _currentMoveDirection: Vec3 = new Vec3(0, 0, -1);  // 当前移动方向，默认向前

    private _isAnimationPlaying: boolean = false;
    private _isMovingByTyping: boolean = false;
    private _skeletalAnimation: SkeletalAnimation | null = null;
    private _rigidBody: RigidBody | null = null;  // 物理刚体组件
    private _currentInput: string = '';
    private _wordDisplay: any = null;
    private _distanceTraveled: number = 0;  // 已移动的距离
    private _lastPosition: Vec3 = new Vec3();  // 上一次的位置

    start() {
        this._skeletalAnimation = this.node.getComponent(SkeletalAnimation);
        this._rigidBody = this.node.getComponent(RigidBody);
        
        this._wordDisplay = this.findWordDisplayController();
        
        // 初始化上次位置
        this._lastPosition.set(this.node.position);
        
        // 初始化当前移动方向
        this._currentMoveDirection.set(this.moveDirection);
        
        // 设置相机初始位置
        if (this.camera) {
            const initialCameraPos = new Vec3();
            Vec3.add(initialCameraPos, this.node.position, this.cameraOffset);
            this.camera.setPosition(initialCameraPos);
            this.camera.lookAt(this.node.position);
        }
        
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        
        // 注册碰撞事件
        const collider = this.node.getComponent(SphereCollider);
        if (collider) {
            collider.on('onTriggerEnter', this.onTriggerEnter, this);
            // 同时监听物理碰撞事件
            collider.on('onCollisionEnter', this.onCollisionEnter, this);
        }
    }

    findWordDisplayController(): any {
        // 优先使用手动配置的节点
        if (this.wordDisplayNode) {
            const component = this.wordDisplayNode.getComponent('WordDisplayController');
            if (component) {
                return component;
            }
        }
        
        // 自动查找场景中的 WordDisplayController
        const canvas = this.node.scene.getChildByName('Canvas');
        if (canvas) {
            const wordDisplayNode = canvas.getChildByName('WordDisplay');
            if (wordDisplayNode) {
                const component = wordDisplayNode.getComponent('WordDisplayController');
                if (component) {
                    return component;
                }
            }
        }

        return null;
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        
        // 取消注册碰撞事件
        const collider = this.node.getComponent(SphereCollider);
        if (collider) {
            collider.off('onTriggerEnter', this.onTriggerEnter, this);
            collider.off('onCollisionEnter', this.onCollisionEnter, this);
        }
    }

    onKeyDown(event: EventKeyboard) {
        // 只处理打字相关的按键
        this.handleTyping(event);
    }

    handleTyping(event: EventKeyboard): boolean {
        
        if (!this._wordDisplay) {
            return false;
        }

        if (event.keyCode >= KeyCode.KEY_A && event.keyCode <= KeyCode.KEY_Z) {
            const letter = String.fromCharCode(event.keyCode).toLowerCase();
            return this.processInput(letter);
        }

        if (event.keyCode === KeyCode.SPACE) {
            return this.processInput(' ');
        }

        if (event.keyCode === KeyCode.BACKSPACE) {
            this._currentInput = this._currentInput.slice(0, -1);
            this._wordDisplay.setInput(this._currentInput);
            return true;
        }

        if (event.keyCode === KeyCode.ENTER) {
            this.checkWord();
            return true;
        }

        return false;
    }

    private processInput(inputChar: string): boolean {
        const previousInput = this._currentInput;
        this._currentInput += inputChar;
        
        const previousProgress = this._wordDisplay.getInputProgress();
        const success = this._wordDisplay.setInput(this._currentInput);
        
        if (success) {
            const newProgress = this._wordDisplay.getInputProgress();
            if (newProgress > previousProgress && this.enableTypingMovement) {
                this.moveByTyping(newProgress - previousProgress);
            }
        } else {
            this._currentInput = previousInput;
            this._wordDisplay.flashWrong(inputChar);
        }
        return true;
    }

    moveByTyping(letterCount: number) {
        if (this._isMovingByTyping || !this.enableTypingMovement) return;
        
        this._isMovingByTyping = true;
        const moveAmount = this.moveDistancePerLetter * letterCount;
        const moveVec = this._currentMoveDirection.clone().normalize().multiplyScalar(moveAmount);
        
        const angle = Math.atan2(this._currentMoveDirection.x, this._currentMoveDirection.z) * (180 / Math.PI);
        this.node.setRotationFromEuler(0, angle, 0);
        
        this.playRunAnimation();
        
        // 使用物理引擎移动
        if (this._rigidBody) {
            // 计算移动速度（单位/秒）
            const velocity = moveVec.normalize().multiplyScalar(moveAmount / this.moveDuration);
            // 设置刚体线性速度
            this._rigidBody.setLinearVelocity(velocity);
            
            // 使用调度器延迟停止移动
            this.scheduleOnce(() => {
                if (this._rigidBody) {
                    this._rigidBody.setLinearVelocity(new Vec3(0, 0, 0)); // 停止移动
                }
                this._isMovingByTyping = false;
                
                // 在打字移动结束后，更新_lastPosition以避免触发不必要的自动转向
                this._lastPosition.set(this.node.position);
                
                // 检查是否没有任何形式的移动（现在只可能是打字移动）
                if (!this._isMovingByTyping) {
                    this.stopAnimation();
                }
            }, this.moveDuration); // moveDuration 是秒，scheduleOnce 参数也是秒
        } else {
            // 如果没有RigidBody，则回退到原来的方式
            const targetPos = this.node.position.clone().add(moveVec);
            this.node.setPosition(targetPos);
            this._isMovingByTyping = false;
            
            // 在打字移动结束后，更新_lastPosition以避免触发不必要的自动转向
            this._lastPosition.set(this.node.position);
            
            // 检查是否没有任何形式的移动（现在只可能是打字移动）
            if (!this._isMovingByTyping) {
                this.stopAnimation();
            }
        }
    }

    checkWord() {
        if (!this._wordDisplay) return;

        const targetWord = this._wordDisplay.getCurrentWord();
        if (this._currentInput.toLowerCase() === targetWord.toLowerCase()) {
            const remainingLetters = targetWord.length - this._wordDisplay.getInputProgress();
            if (remainingLetters > 0 && this.enableTypingMovement) {
                this.moveByTyping(remainingLetters);
            }
            this._wordDisplay.flashCorrect();
            this.onWordTypedCorrectly();
        } else {
            const errorChar = this._currentInput.length > 0 ? this._currentInput[this._currentInput.length - 1] : ' ';
            this._wordDisplay.flashWrong(errorChar);
        }
        this._currentInput = '';
        this._wordDisplay.clearInput();
    }

    onWordTypedCorrectly() {
        // Word typed correctly!
    }



    updateAnimation() {
        if (!this._skeletalAnimation) return;

        // 现在只根据打字移动状态来更新动画
        if (this._isMovingByTyping) {
            if (!this._isAnimationPlaying) {
                this._skeletalAnimation.stop();
                this._skeletalAnimation.play(this.runAnimationName);
                this._isAnimationPlaying = true;
            }
        } else {
            if (this._isAnimationPlaying) {
                this._skeletalAnimation.stop();
                this._isAnimationPlaying = false;
            }
        }
    }

    playRunAnimation() {
        if (!this._skeletalAnimation || this._isAnimationPlaying) return;
        this._skeletalAnimation.stop();
        this._skeletalAnimation.play(this.runAnimationName);
        this._isAnimationPlaying = true;
    }

    stopAnimation() {
        if (!this._skeletalAnimation || !this._isAnimationPlaying) return;
        this._skeletalAnimation.stop();
        this._isAnimationPlaying = false;
    }

    update(deltaTime: number) {
        // 跟踪移动距离并实现自动转向（无论是否在打字移动时都进行跟踪）
        this.trackDistanceAndAutoTurn();

        if (this.camera) {
            this.updateCamera();
        }
    }

    trackDistanceAndAutoTurn() {
        // 计算当前位置与上一位置之间的距离
        const currentPosition = this.node.position;
        const distance = Vec3.distance(currentPosition, this._lastPosition);
        
        // 累加已移动的距离
        this._distanceTraveled += distance;
        
        // 更新上一位置为当前位置
        this._lastPosition.set(currentPosition);
        
        // 检查是否达到自动转向的距离
        if (this._distanceTraveled >= this.autoTurnDistance && this._isMovingByTyping) {
            // 执行自动转向
            this.performAutoTurn();
            
            // 重置已移动距离
            this._distanceTraveled = 0;
        }
    }

    performAutoTurn() {
        // 计算新方向（当前方向基础上旋转指定角度）
        const currentRotation = this.node.eulerAngles.y; // 获取当前Y轴旋转角度
        const newRotation = currentRotation + this.autoTurnAngle; // 加上自动转向角度
        
        // 应用新旋转
        this.node.setRotationFromEuler(0, newRotation, 0);
        
        // 如果使用物理引擎，也需要更新刚体的旋转
        if (this._rigidBody) {
            this._rigidBody.node.setRotationFromEuler(0, newRotation, 0);
        }
        
        // 更新当前移动方向以反映新的朝向
        const radians = newRotation * Math.PI / 180;
        this._currentMoveDirection.set(Math.sin(radians), 0, Math.cos(radians));
        
        // 根据设置决定是否在转向后继续移动
        // 注意：这里不再设置未使用的_moveDirection变量
    }

    onTriggerEnter(event: ITriggerEvent) {
        // 检查是否与电脑模型碰撞
        if (this.computerModel && event.otherCollider.node === this.computerModel) {
            this.onCaptureSuccess();
        }
    }
    
    onCollisionEnter(event: ICollisionEvent) {
        // 检查是否与电脑模型碰撞
        if (this.computerModel && event.otherCollider.node === this.computerModel) {
            this.onCaptureSuccess();
        }
    }

    // 捕捉成功的处理
    onCaptureSuccess() {
        // 切换到结束场景
        director.loadScene('EndScene'); // 假设结束场景名为 EndScene
    }

    updateCamera() {
        if (!this.camera) return;

        const targetPosition = new Vec3();
        Vec3.add(targetPosition, this.node.position, this.cameraOffset);
        this.camera.setPosition(targetPosition);
        this.camera.lookAt(this.node.position);
    }
}
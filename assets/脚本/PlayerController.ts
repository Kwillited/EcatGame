import { _decorator, Component, Node, Vec3, input, Input, EventKeyboard, KeyCode, SkeletalAnimation, ICollisionEvent, RigidBody, SphereCollider, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlayerController')
export class PlayerController extends Component {
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

    @property(Node)
    computerModel: Node | null = null;  // 电脑模型引用

    private _isAnimationPlaying: boolean = false;
    private _isMovingByTyping: boolean = false;
    private _skeletalAnimation: SkeletalAnimation | null = null;
    private _rigidBody: RigidBody | null = null;  // 物理刚体组件
    private _currentInput: string = '';
    private _wordDisplay: any = null;

    start() {
        this._skeletalAnimation = this.node.getComponent(SkeletalAnimation);
        this._rigidBody = this.node.getComponent(RigidBody);
        
        this._wordDisplay = this.findWordDisplayController();
        
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        
        const collider = this.node.getComponent(SphereCollider);
        if (collider) {
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
        
        const collider = this.node.getComponent(SphereCollider);
        if (collider) {
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

        // 逗号键 ,
        if (event.keyCode === KeyCode.COMMA) {
            return this.processInput(',');
        }

        // 句号键 .
        if (event.keyCode === KeyCode.PERIOD) {
            return this.processInput('.');
        }

        // 分号键 ; (Shift + ; = :)
        if (event.keyCode === KeyCode.SEMICOLON) {
            // 检测 Shift 键是否按下
            const colon = event.rawEvent && (event.rawEvent as KeyboardEvent).shiftKey;
            return this.processInput(colon ? ':' : ';');
        }

        // 单引号键 ' (Shift + ' = ")
        if (event.keyCode === KeyCode.QUOTE) {
            const doubleQuote = event.rawEvent && (event.rawEvent as KeyboardEvent).shiftKey;
            return this.processInput(doubleQuote ? '"' : "'");
        }

        // 数字键 1 (Shift + 1 = !)
        if (event.keyCode === KeyCode.DIGIT_1) {
            const exclamation = event.rawEvent && (event.rawEvent as KeyboardEvent).shiftKey;
            if (exclamation) {
                return this.processInput('!');
            }
            return false; // 数字1不处理
        }

        // 斜杠键 / (Shift + / = ?)
        if (event.keyCode === KeyCode.SLASH) {
            const question = event.rawEvent && (event.rawEvent as KeyboardEvent).shiftKey;
            return this.processInput(question ? '?' : '/');
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
        const moveVec = this.moveDirection.clone().normalize().multiplyScalar(moveAmount);
        
        this.playRunAnimation();
        
        if (this._rigidBody) {
            const velocity = moveVec.normalize().multiplyScalar(moveAmount / this.moveDuration);
            this._rigidBody.setLinearVelocity(velocity);
            
            this.scheduleOnce(() => {
                if (this._rigidBody) {
                    this._rigidBody.setLinearVelocity(new Vec3(0, 0, 0));
                }
                this._isMovingByTyping = false;
                this.stopAnimation();
            }, this.moveDuration);
        } else {
            const targetPos = this.node.position.clone().add(moveVec);
            this.node.setPosition(targetPos);
            this._isMovingByTyping = false;
            this.stopAnimation();
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

    onCollisionEnter(event: ICollisionEvent) {
        if (this.computerModel && event.otherCollider.node === this.computerModel) {
            this.onCaptureSuccess();
        }
    }

    // 捕捉成功的处理
    onCaptureSuccess() {
        // 切换到结束场景
        director.loadScene('EndScene'); // 假设结束场景名为 EndScene
    }
}
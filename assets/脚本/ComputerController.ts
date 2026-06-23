import { _decorator, Component, Node, Vec3, SkeletalAnimation, ICollisionEvent, SphereCollider, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ComputerController')
export class ComputerController extends Component {
    @property
    moveSpeed: number = 1.5;

    @property
    moveDirection: Vec3 = new Vec3(0, 0, -1);

    @property
    enableAutoMove: boolean = true;

    @property(Node)
    finishZone: Node | null = null;

    private _skeletalAnimation: SkeletalAnimation | null = null;

    start() {
        this._skeletalAnimation = this.node.getComponent(SkeletalAnimation);

        const collider = this.node.getComponent(SphereCollider);
        if (collider) {
            collider.on('onCollisionEnter', this.onCollisionEnter, this);
        }
    }

    onDestroy() {
        const collider = this.node.getComponent(SphereCollider);
        if (collider) {
            collider.off('onCollisionEnter', this.onCollisionEnter, this);
        }
    }

    update(deltaTime: number) {
        if (!this.enableAutoMove) {
            this.stopAnimation();
            return;
        }

        const moveVec = this.moveDirection.clone().normalize().multiplyScalar(this.moveSpeed * deltaTime);
        this.node.setPosition(this.node.position.clone().add(moveVec));

        const angle = Math.atan2(this.moveDirection.x, this.moveDirection.z) * (180 / Math.PI);
        this.node.setRotationFromEuler(0, angle, 0);

        this.playRunAnimation();
    }

    playRunAnimation() {
        if (!this._skeletalAnimation) return;
        const currentState = this._skeletalAnimation.getState('run');
        if (!currentState || !currentState.isPlaying) {
            this._skeletalAnimation.play('run');
        }
    }

    stopAnimation() {
        if (!this._skeletalAnimation) return;
        this._skeletalAnimation.stop();
    }

    onCollisionEnter(event: ICollisionEvent) {
        if (this.finishZone && event.otherCollider.node === this.finishZone) {
            this.onReachFinish();
        }
    }

    onReachFinish() {
        director.loadScene('EndScene');
    }
}
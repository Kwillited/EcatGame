import { _decorator, Component, Node, Button } from 'cc';
import { BaseSceneController } from './BaseSceneController';
import { SceneManager } from './SceneManager';
const { ccclass, property } = _decorator;

@ccclass('HomeController')
export class HomeController extends BaseSceneController {
    @property(Button)
    startButton: Button | null = null;

    @property
    gameSceneName: string = 'game';

    start() {
        if (this.startButton && this.startButton.node) {
            this.bindButtonEvent(this.startButton, this.onStartButtonClick);
        } else {
            console.warn('startButton 未绑定！请在编辑器中将按钮节点拖拽到 HomeController 的 Start Button 属性中');
        }
    }

    onStartButtonClick() {
        SceneManager.getInstance().loadScene(this.gameSceneName);
    }

    onDestroy() {
        if (this.startButton && this.startButton.node) {
            this.unbindButtonEvent(this.startButton, this.onStartButtonClick);
        }
    }
}

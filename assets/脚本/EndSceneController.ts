import { _decorator, Component, Node, Button } from 'cc';
import { BaseSceneController } from './BaseSceneController';
import { SceneManager } from './SceneManager';
const { ccclass, property } = _decorator;

@ccclass('EndSceneController')
export class EndSceneController extends BaseSceneController {
    @property(Button)
    restartButton: Button | null = null;

    @property
    gameSceneName: string = 'game'; // 游戏场景名称，根据实际场景名称调整

    start() {
        if (this.restartButton) {
            console.log('Restart button bound successfully');
            // 确保按钮组件存在
            if (this.restartButton.node.getComponent(Button)) {
                this.bindButtonEvent(this.restartButton, this.onRestartClick);
            } else {
                console.error('Restart button node does not have a Button component!');
            }
        } else {
            console.error('Restart button is not bound in the editor!');
        }
    }

    onRestartClick() {
        // 返回游戏场景重新开始
        console.log('Restart button clicked, attempting to load scene:', this.gameSceneName);
        SceneManager.getInstance().loadScene(this.gameSceneName, (error) => {
            if (error) {
                console.error('Failed to load scene:', error);
            } else {
                console.log('Successfully loaded scene:', this.gameSceneName);
            }
        });
    }

    onDestroy() {
        if (this.restartButton && this.restartButton.node) {
            this.unbindButtonEvent(this.restartButton, this.onRestartClick);
        }
    }
}
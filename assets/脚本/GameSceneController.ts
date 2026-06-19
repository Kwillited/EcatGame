import { _decorator, Component, Node, Button } from 'cc';
import { BaseSceneController } from './BaseSceneController';
import { SceneManager } from './SceneManager';
const { ccclass, property } = _decorator;

@ccclass('GameSceneController')
export class GameSceneController extends BaseSceneController {
    @property(Button)
    backButton: Button | null = null;

    @property
    homeSceneName: string = 'HomeScene';

    start() {
        this.bindButtonEvent(this.backButton, this.onBackButtonClick);
    }

    onBackButtonClick() {
        SceneManager.getInstance().loadScene(this.homeSceneName);
    }

    onDestroy() {
        this.unbindButtonEvent(this.backButton, this.onBackButtonClick);
    }
}

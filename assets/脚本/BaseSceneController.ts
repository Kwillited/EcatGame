import { _decorator, Component, Button } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BaseSceneController')
export abstract class BaseSceneController extends Component {
    
    protected bindButtonEvent(button: Button | null, handler: () => void, target?: any) {
        if (button) {
            button.node.on(Button.EventType.CLICK, handler, target || this);
        }
    }

    protected unbindButtonEvent(button: Button | null, handler: () => void, target?: any) {
        if (button) {
            button.node.off(Button.EventType.CLICK, handler, target || this);
        }
    }
}
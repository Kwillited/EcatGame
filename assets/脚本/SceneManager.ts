import { director } from 'cc';

export class SceneManager {
    private static instance: SceneManager;
    
    public static getInstance(): SceneManager {
        if (!SceneManager.instance) {
            SceneManager.instance = new SceneManager();
        }
        return SceneManager.instance;
    }
    
    public loadScene(sceneName: string, onComplete?: (error: Error | null) => void) {
        director.loadScene(sceneName, onComplete);
    }
}
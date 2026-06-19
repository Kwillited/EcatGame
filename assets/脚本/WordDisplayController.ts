import { _decorator, Component, Node, Label, RichText, UITransform, Color, tween, Vec3, Sprite, SpriteFrame, Texture2D, RenderTexture, Graphics } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('WordDisplayController')
export class WordDisplayController extends Component {
    @property(RichText)
    wordLabel: RichText | null = null;

    @property(Label)
    hintLabel: Label | null = null;

    @property(Node)
    underlineNode: Node | null = null;

    @property
    underlineOffsetY: number = 8;

    @property
    wordList: string[] = [
        'The quick brown fox jumps over the lazy dog.',
        'A journey of a thousand miles begins with a single step.',
        'All that glitters is not gold, but it sure is shiny.',
        'To be or not to be, that is the question.',
        'In the middle of difficulty lies opportunity.'
    ];

    @property
    displayLength: number = 15;

    private _scrollOffset: number = 0;

    @property
    currentWord: string = '';

    @property
    correctColor: Color = new Color(0, 255, 0);

    @property
    wrongColor: Color = new Color(255, 0, 0);

    @property
    defaultColor: Color = new Color(255, 255, 255);

    @property
    highlightColor: Color = new Color(0, 255, 255);

    @property
    slideDistance: number = 100;

    @property
    slideDuration: number = 0.3;

    private _currentInput: string = '';
    private _isSliding: boolean = false;

    start() {
        this.createUnderlineSprite();
        this.showRandomWord();
    }

    private createUnderlineSprite() {
        if (!this.underlineNode) {
            this.underlineNode = new Node('Underline');
            this.underlineNode.setParent(this.node);
        }
        
        let sprite = this.underlineNode.getComponent(Sprite);
        if (!sprite) {
            sprite = this.underlineNode.addComponent(Sprite);
        }
        
        // 创建一个简单的像素纹理作为下划线
        const texture = new Texture2D();
        texture.reset({
            width: 1,
            height: 4,
            format: Texture2D.PixelFormat.RGBA8888,
            mipmapLevel: 1
        });
        
        // 设置白色像素数据
        const pixels = new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]);
        texture.uploadData(pixels);
        
        // 创建精灵帧
        const spriteFrame = new SpriteFrame();
        spriteFrame.texture = texture;
        sprite.spriteFrame = spriteFrame;
        
        // 确保有UI变换组件
        const uiTransform = this.underlineNode.getComponent(UITransform);
        if (!uiTransform) {
            this.underlineNode.addComponent(UITransform);
        }
        
        this.underlineNode.active = false;
    }

    showRandomWord() {
        const randomIndex = Math.floor(Math.random() * this.wordList.length);
        this.currentWord = this.wordList[randomIndex];
        this._currentInput = '';
        this._scrollOffset = 0;
        this.updateWordDisplay();
    }

    showWord(word: string) {
        this.currentWord = word;
        this._currentInput = '';
        this._scrollOffset = 0;
        this.updateWordDisplay();
    }

    updateWordDisplay() {
        this.updateInputHighlight();
        if (this.hintLabel) {
            this.hintLabel.string = 'Type the text above';
        }
    }

    updateInputHighlight() {
        if (!this.wordLabel) return;

        const correctPrefix = this._currentInput.length;
        const totalLength = this.currentWord.length;
        
        this._scrollOffset = correctPrefix;
        
        const displayStart = this._scrollOffset;
        const displayEnd = Math.min(displayStart + this.displayLength, totalLength);
        
        if (displayStart >= totalLength) {
            this.wordLabel.string = '';
            this.hideUnderline();
            return;
        }
        
        let richText = '';
        for (let i = displayStart; i < displayEnd; i++) {
            const char = this.currentWord[i];
            richText += `<color=${this.colorToHex(this.defaultColor)}>${char}</color>`;
        }
        
        this.wordLabel.string = richText;
        this.updateUnderlinePosition(this.defaultColor);
    }

    hideUnderline() {
        if (this.underlineNode) {
            this.underlineNode.active = false;
        }
    }

    updateUnderlinePosition(color: Color) {
        if (!this.underlineNode || !this.wordLabel) {
            this.hideUnderline();
            return;
        }
        
        const uiTransform = this.wordLabel.getComponent(UITransform);
        if (!uiTransform) {
            this.hideUnderline();
            return;
        }
        
        const fontSize = this.wordLabel.fontSize || 32;
        const charsDisplayed = Math.max(1, Math.min(this.displayLength, this.currentWord.length - this._scrollOffset));
        
        if (charsDisplayed <= 0) {
            this.hideUnderline();
            return;
        }
        
        const totalWidth = uiTransform.width;
        const avgCharWidth = totalWidth / charsDisplayed;
        
        const firstChar = this.currentWord[this._scrollOffset] || ' ';
        let charWidth = avgCharWidth;
        
        if (firstChar === ' ' || firstChar === '.' || firstChar === ',' || firstChar === ';' || firstChar === ':') {
            charWidth = avgCharWidth * 0.5;
        } else if (firstChar === 'w' || firstChar === 'W' || firstChar === 'm' || firstChar === 'M') {
            charWidth = avgCharWidth * 1.2;
        }
        
        const underlineWidth = charWidth * 0.7;
        
        const underlineTransform = this.underlineNode.getComponent(UITransform);
        if (underlineTransform) {
            underlineTransform.setContentSize(underlineWidth, 2);
        }
        
        const labelLocalPos = this.wordLabel.node.position;
        const labelWidth = uiTransform.width;
        
        this.underlineNode.setPosition(
            labelLocalPos.x - labelWidth / 2 + charWidth / 2,
            labelLocalPos.y - fontSize / 2 - this.underlineOffsetY,
            0
        );
        
        const sprite = this.underlineNode.getComponent(Sprite);
        if (sprite) {
            sprite.color = color;
        }
        
        this.underlineNode.active = true;
    }

    getDisplayText(): string {
        const start = this._scrollOffset;
        const end = Math.min(start + this.displayLength, this.currentWord.length);
        return this.currentWord.substring(start, end);
    }

    colorToHex(color: Color): string {
        const r = Math.floor(color.r).toString(16);
        const g = Math.floor(color.g).toString(16);
        const b = Math.floor(color.b).toString(16);
        const rStr = r.length < 2 ? '0' + r : r;
        const gStr = g.length < 2 ? '0' + g : g;
        const bStr = b.length < 2 ? '0' + b : b;
        return `#${rStr}${gStr}${bStr}`;
    }

    // 规范化标点符号：将中文标点转换为英文标点
    private normalizePunctuation(str: string): string {
        const punctuationMap: { [key: string]: string } = {
            '，': ',',   // 中文逗号 → 英文逗号
            '。': '.',   // 中文句号 → 英文句号
            '；': ';',   // 中文分号 → 英文分号
            '：': ':',   // 中文冒号 → 英文冒号
            '！': '!',   // 中文感叹号 → 英文感叹号
            '？': '?',   // 中文问号 → 英文问号
            '‘': "'",   // 中文左单引号 → 英文单引号
            '’': "'",   // 中文右单引号 → 英文单引号
            '“': '"',   // 中文左双引号 → 英文双引号
            '”': '"',   // 中文右双引号 → 英文双引号
            '…': '...', // 省略号
            '—': '-',   // 破折号 → 连字符
        };
        
        let result = '';
        for (const char of str) {
            result += punctuationMap[char] || char;
        }
        return result;
    }

    setInput(input: string): boolean {
        // 规范化标点符号：将中文标点转换为英文标点
        let normalizedInput = this.normalizePunctuation(input);
        let normalizedTarget = this.normalizePunctuation(this.currentWord);
        
        const lowerInput = normalizedInput.toLowerCase();
        const targetWord = normalizedTarget.toLowerCase();
        
        if (targetWord.startsWith(lowerInput)) {
            this._currentInput = lowerInput;
            this.updateInputHighlight();
            return true;
        }
        
        return false;
    }

    getInputProgress(): number {
        return this._currentInput.length;
    }

    getWordLength(): number {
        return this.currentWord.length;
    }

    flashCorrect() {
        this.scheduleOnce(() => {
            this.slideLeftAndShowNext();
        }, 0.3);
    }

    slideLeftAndShowNext() {
        if (this._isSliding || !this.wordLabel) return;
        
        this._isSliding = true;
        const node = this.wordLabel.node;
        const originalPos = node.position.clone();
        
        tween(node)
            .to(this.slideDuration, { position: new Vec3(originalPos.x - this.slideDistance, originalPos.y, originalPos.z) })
            .call(() => {
                this.showRandomWord();
                node.position = new Vec3(originalPos.x + this.slideDistance, originalPos.y, originalPos.z);
            })
            .to(this.slideDuration, { position: originalPos })
            .call(() => {
                this._isSliding = false;
            })
            .start();
    }

    flashWrong(inputChar: string) {
        if (!this.wordLabel) return;
        
        const totalLength = this.currentWord.length;
        const displayStart = this._scrollOffset;
        const displayEnd = Math.min(displayStart + this.displayLength, totalLength);
        
        if (displayStart >= totalLength) {
            return;
        }
        
        let richText = '';
        for (let i = displayStart; i < displayEnd; i++) {
            const char = this.currentWord[i];
            if (i === displayStart) {
                richText += `<color=${this.colorToHex(this.wrongColor)}>${char}</color>`;
            } else {
                richText += `<color=${this.colorToHex(this.defaultColor)}>${char}</color>`;
            }
        }
        
        this.wordLabel.string = richText;
        this.updateUnderlinePosition(this.wrongColor);
        
        this.scheduleOnce(() => {
            this.updateInputHighlight();
        }, 0.3);
    }

    getCurrentWord(): string {
        return this.currentWord;
    }

    clearInput() {
        this._currentInput = '';
        this.updateInputHighlight();
    }
}
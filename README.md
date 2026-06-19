# 3D 打字游戏

一个使用 Cocos Creator 3.8.8 开发的 3D 打字游戏。

## 项目概述

本项目是一个 3D 打字练习游戏，旨在帮助用户提高打字速度和准确性。游戏包含主页、游戏场景和结束场景三个主要部分。

## 架构设计

项目采用了模块化和可扩展的架构设计，为未来扩展为 3D 自由世界做好准备。

### 核心组件

- `BaseSceneController.ts` - 所有场景控制器的基类，提供通用的事件绑定/解绑方法
- `SceneManager.ts` - 场景管理器，统一处理场景切换逻辑
- `WordDisplayController.ts` - 文字显示控制器，处理打字游戏的核心逻辑

### 场景控制器

- `HomeController.ts` - 主页控制器，处理开始游戏逻辑
- `GameSceneController.ts` - 游戏场景控制器，处理返回主页逻辑
- `EndSceneController.ts` - 结束场景控制器，处理重新开始逻辑

## 文件结构

```
assets/
├── 脚本/
    ├── BaseSceneController.ts     # 基础场景控制器
    ├── SceneManager.ts           # 场景管理器
    ├── HomeController.ts         # 主页控制器
    ├── GameSceneController.ts    # 游戏场景控制器
    ├── EndSceneController.ts     # 结束场景控制器
    └── WordDisplayController.ts  # 文字显示控制器
```

## 设计模式

- **继承模式**：场景控制器继承自 `BaseSceneController`，减少重复代码
- **单例模式**：`SceneManager` 使用单例模式，确保全局唯一实例
- **模块化**：功能按模块划分，便于维护和扩展

## 扩展性

当前架构为未来扩展预留了接口：

- 可轻松添加新的游戏模式
- 支持添加更多场景和功能模块
- 为实现 3D 自由世界预留了扩展点

## 安装与运行

1. 确保已安装 Cocos Creator 3.8.8
2. 打开项目
3. 运行游戏

## 技术栈

- Cocos Creator 3.8.8
- TypeScript
- ES6 模块系统
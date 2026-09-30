# In-World Tablet Demo

一个不依赖 Unity 的浏览器游戏原型：玩家在第一人称 3D 房间中移动，并可以在游戏内“举起”一台可真实操作的 Pad。

## Demo 内容

- 浏览器实时 3D 场景（Three.js）
- 鼠标第一人称视角 + WASD 移动
- `E` 键举起 / 收起 Pad
- 举起设备时退出 Pointer Lock，鼠标直接操作 Pad
- Pad 使用真实 HTML/CSS UI，而不是把所有 UI 重做成 3D
- Messages：可输入消息并收到演示回复
- Tasks：可勾选任务
- Map：查看室内地图与角色位置
- Scanner：模拟扫描场景 NPC
- 收起 Pad 后恢复第一人称控制

## 运行

因为页面使用 ES Module，请通过本地 HTTP Server 运行，而不是直接双击 `index.html`。

### Python

```bash
python3 -m http.server 8080
```

然后打开：

```text
http://localhost:8080
```

### Node

```bash
npx serve .
```

## 操作

- `W A S D`：移动
- 鼠标：转动视角
- `E`：打开 / 收起 Pad
- `Esc`：收起 Pad
- 点击 3D 画面：重新捕获鼠标

## 技术结构

```text
Three.js       -> 3D 世界、摄像机、角色、灯光
HTML / CSS     -> Pad 外观和内部 App UI
Vanilla JS     -> 状态、输入、App 交互
```

这套结构适合产品 Demo：未来如果改成 Unity，Pad 内部的信息架构和交互逻辑仍然可以继续沿用。

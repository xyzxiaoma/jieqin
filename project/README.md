# 接亲小游戏

一款浪漫求婚风格的 PyQt6 桌面接亲小游戏。

## 环境要求

- Python 3.10+
- Windows 或 macOS

## 安装依赖（开发环境）

```bash
cd project
pip install PyQt6 tinycc pyinstaller
```

## 运行游戏（开发环境）

```bash
cd py
python main.py
```

## 打包发布

### 方法一：使用自动化脚本（本地构建）

```bash
cd project

# Windows 打包
python build.py windows

# macOS 打包（在 Mac 上执行）
python build.py macos
```

### 方法二：使用 GitHub Actions（推荐，无需 Mac 电脑）

即使你没有 Mac 电脑，也可以通过 GitHub Actions 在云端构建 macOS 版本。

#### 步骤：

1. **将项目上传到 GitHub**
   ```bash
   # 在 GitHub 上创建新仓库后
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/仓库名.git
   git push -u origin main
   ```

2. **触发构建**
   - 访问你的 GitHub 仓库
   - 点击 **Actions** 标签
   - 点击 **Build Releases** 工作流
   - 点击 **Run workflow**
   - 选择平台（macos 或 windows）
   - 点击绿色按钮运行

3. **下载构建结果**
   - 构建完成后，点击对应的 workflow run
   - 在页面底部找到 **Artifacts** 或 **Releases**
   - 下载 macOS 版本的 zip 文件

## 分发说明

| 平台 | 打包方式 | 分发内容 |
|---|---|---|
| Windows | 目录模式 | `dist/jieqin_game/` 整个文件夹（压缩后分发） |
| macOS | App Bundle | `dist/jieqin_game.app`（压缩后分发） |

## 项目结构

```
project/
├── py/
│   └── main.py              # PyQt6 主程序入口
├── index.html               # 游戏主界面
├── style.css                # 浪漫粉样式
├── game.js                  # 游戏逻辑
├── qwebchannel.js           # PyQt JS 桥接
├── 爱心图片.jpg              # 爱心展示图片
├── imgs/
│   └── 任务三.png           # 任务三题目图片
├── build.py                 # 自动化构建脚本
├── .github/
│   └── workflows/
│       └── build.yml        # GitHub Actions 配置
└── README.md
```

## 游戏流程

1. **欢迎页** - 查看说明，点击开始
2. **任务一：打字游戏** - 60秒内打完文字，速度>60字/分
3. **任务二：C++ 算法** - 用 cout 输出 `20250614`
4. **任务三：看图答题** - 答案：`5201314`
5. **宝箱页** - 三把钥匙集齐后开启
6. **爱心展示** - 围绕爱心图片的祝福语
7. **最终问题** - 回答相遇日期

## 快捷键

| 键 | 效果 |
|---|---|
| T | 跳过任务一，直接获得钥匙 |
| C | 跳过任务二，直接获得钥匙 |
| S | 跳过任务三，直接获得钥匙 |

## 注意事项

1. **Windows 分发**: 目录模式下需要分发整个文件夹，`jieqin_game.exe` 和 `_internal` 必须在一起
2. **macOS 打包**: 必须在 macOS 系统上执行，或使用 GitHub Actions
3. **首次运行**: exe 首次运行会解压依赖，可能需要几秒钟
4. **图片资源**: 如果有爱心图片.jpg 或 imgs/任务三.png，会自动包含在打包中

"""
接亲小游戏 - 跨平台打包构建脚本

用法:
    Windows: python build.py windows
    macOS: python3 build.py macos
    全部: python build.py all
"""
import subprocess
import sys
import os
import shutil
from pathlib import Path

# 颜色输出
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
RESET = '\033[0m'

def log_info(msg):
    print(f"{GREEN}[INFO]{RESET} {msg}")

def log_warn(msg):
    print(f"{YELLOW}[WARN]{RESET} {msg}")

def log_error(msg):
    print(f"{RED}[ERROR]{RESET} {msg}")

def run_command(cmd, desc=""):
    """执行命令"""
    log_info(f"{desc}: {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    result = subprocess.run(cmd, shell=True)
    return result.returncode == 0

def install_dependencies():
    """安装构建依赖"""
    log_info("检查并安装依赖...")
    required = ['pyinstaller', 'PyQt6', 'tinycc']
    for pkg in required:
        result = subprocess.run(
            [sys.executable, '-m', 'pip', 'show', pkg],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            log_warn(f"未找到 {pkg}，正在安装...")
            subprocess.run([sys.executable, '-m', 'pip', 'install', pkg])
        else:
            log_info(f"已安装 {pkg}")

def clean_dist(name):
    """清理旧的构建目录"""
    script_dir = Path(__file__).parent.resolve()
    dist_dir = script_dir / 'dist'
    build_dir = script_dir / 'build'

    if dist_dir.exists():
        target = dist_dir / name
        if target.exists():
            log_warn(f"清理旧目录: {target}")
            shutil.rmtree(target)

    spec_file = script_dir / f'{name}.spec'
    if spec_file.exists():
        spec_file.unlink()

def build_windows():
    """Windows 构建"""
    log_info("=" * 50)
    log_info("开始 Windows 构建...")
    log_info("=" * 50)

    script_dir = Path(__file__).parent.resolve()
    os.chdir(script_dir)

    # 安装依赖
    install_dependencies()

    # 清理
    clean_dist('jieqin_game')

    # 使用 spec 文件构建（目录模式）
    spec_file = 'jieqin_game.spec'
    if not Path(spec_file).exists():
        log_error(f"找不到 spec 文件: {spec_file}")
        return False

    cmd = [sys.executable, '-m', 'PyInstaller', spec_file]
    success = run_command(cmd, "PyInstaller 构建")

    if success:
        log_info("=" * 50)
        log_info("Windows 构建完成！")
        log_info(f"输出目录: {script_dir / 'dist' / 'jieqin_game'}")
        log_info("运行: 双击 dist\\jieqin_game\\jieqin_game.exe")
        log_info("=" * 50)

        # 显示文件大小
        exe_path = script_dir / 'dist' / 'jieqin_game' / 'jieqin_game.exe'
        if exe_path.exists():
            size_mb = exe_path.stat().st_size / 1024 / 1024
            log_info(f"主程序大小: {size_mb:.2f} MB")
    else:
        log_error("Windows 构建失败！")

    return success

def build_macos():
    """macOS 构建"""
    log_info("=" * 50)
    log_info("开始 macOS 构建...")
    log_info("=" * 50)

    script_dir = Path(__file__).parent.resolve()
    os.chdir(script_dir)

    # 安装依赖
    install_dependencies()

    # 清理
    clean_dist('jieqin_game')

    # macOS App Bundle
    cmd = [
        sys.executable, '-m', 'PyInstaller',
        '--name=jieqin_game',
        '--windowed',
        '--osx-bundle-identifier=com.jieqin.game',
        '--add-data=index.html:.',
        '--add-data=game.js:.',
        '--add-data=style.css:.',
        '--add-data=qwebchannel.js:.',
        '--hidden-import=PyQt6',
        '--hidden-import=PyQt6.QtWidgets',
        '--hidden-import=PyQt6.QtWebEngineWidgets',
        '--hidden-import=PyQt6.QtWebChannel',
        '--hidden-import=tinycc',
        '--collect-all=PyQt6',
        '--collect-all=tinycc',
        'py/main.py'
    ]

    success = run_command(cmd, "PyInstaller 构建")

    if success:
        log_info("=" * 50)
        log_info("macOS 构建完成！")
        log_info(f"输出目录: {script_dir / 'dist' / 'jieqin_game.app'}")
        log_info("运行: open dist/jieqin_game.app")
        log_info("=" * 50)
    else:
        log_error("macOS 构建失败！")

    return success

def main():
    print("=" * 50)
    print("接亲小游戏 - 打包构建工具")
    print("=" * 50)
    print()
    print("用法:")
    print("  python build.py windows  # 构建 Windows 版本")
    print("  python build.py macos   # 构建 macOS 版本")
    print("  python build.py all     # 构建所有平台")
    print()

    if len(sys.argv) < 2:
        log_error("请指定构建目标: windows / macos / all")
        sys.exit(1)

    target = sys.argv[1].lower()

    if target == 'windows':
        build_windows()
    elif target == 'macos':
        build_macos()
    elif target == 'all':
        build_windows()
        print()
        build_macos()
    else:
        log_error(f"未知目标: {target}")
        sys.exit(1)

if __name__ == '__main__':
    main()

# -*- coding: utf-8 -*-
"""
接亲小游戏 - PyInstaller 打包配置 (Onefile 单文件模式)
修复 Python 3.13 兼容性问题
"""
import os
import sys
from pathlib import Path
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

block_cipher = None

# 获取项目根目录
script_dir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe()))) if 'inspect' in dir() else os.getcwd()
PROJECT_ROOT = Path(script_dir)

# Python DLL 路径
PYTHON_DLL = str(Path(sys.prefix) / 'python313.dll')
PYTHON_DLL_ALT = str(Path(sys.prefix) / 'python3.dll')

binaries = []
# 添加 Python DLL
if os.path.exists(PYTHON_DLL):
    binaries.append((PYTHON_DLL, '.'))
elif os.path.exists(PYTHON_DLL_ALT):
    binaries.append((PYTHON_DLL_ALT, '.'))

# Web 资源文件
web_assets = ['index.html', 'game.js', 'style.css', 'qwebchannel.js']
web_datas = [(str(PROJECT_ROOT / f), '.') for f in web_assets if (PROJECT_ROOT / f).exists()]

# 图片资源
for ext in ['png', 'jpg', 'jpeg', 'gif', 'webp']:
    for img_path in list(PROJECT_ROOT.glob(f'*.{ext}')) + list(PROJECT_ROOT.glob(f'imgs/*.{ext}')):
        web_datas.append((str(img_path), '.'))

# PyQt6 数据文件
pyqt6_datas = []
try:
    pyqt6_datas += collect_data_files('PyQt6')
except:
    pass

# TinyCC 数据文件
tinycc_datas = []
try:
    tinycc_datas += collect_data_files('tinycc')
    import tinycc as _tc
    tinycc_base = Path(_tc.__file__).parent
    tinycc_datas.append((str(tinycc_base / 'lib'), 'tinycc/lib'))
except ImportError:
    pass

# 隐藏导入
hiddenimports = [
    'PyQt6', 'PyQt6.QtWidgets', 'PyQt6.QtWebEngineWidgets', 'PyQt6.QtWebChannel',
    'PyQt6.QtCore', 'PyQt6.QtGui', 'PyQt6.sip', 'tinycc',
]
try:
    hiddenimports += collect_submodules('PyQt6')
except:
    pass
try:
    hiddenimports += collect_submodules('tinycc')
except:
    pass

a = Analysis(
    [str(PROJECT_ROOT / 'py' / 'main.py')],
    pathex=[str(PROJECT_ROOT)],
    binaries=binaries,
    datas=web_datas + pyqt6_datas + tinycc_datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    runtime_hooks=[],
    excludes=['matplotlib', 'numpy', 'pandas', 'scipy'],
    cipher=block_cipher,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

# Onefile 单文件模式
exe = EXE(
    pyz, a.scripts, [],
    exclude_binaries=False,
    name='jieqin_game',
    debug=False,
    strip=False,
    upx=True,
    console=False,
)

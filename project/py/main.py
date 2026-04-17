"""
接亲小游戏 - PyQt6 主程序
使用 QWebChannel 将 Python 方法暴露给 JavaScript
"""
import sys
import os
import json
import traceback
from pathlib import Path

# 判断是否为打包后的运行模式
IS_FROZEN = getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS')
if IS_FROZEN:
    # 打包模式：从 _MEIPASS 目录加载资源
    MEIPASS = sys._MEIPASS
else:
    # 开发模式
    MEIPASS = None

from PyQt6.QtWidgets import QApplication, QWidget, QVBoxLayout
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWebChannel import QWebChannel
from PyQt6.QtCore import pyqtSlot, pyqtSignal, QObject, Qt, QUrl, QProcessEnvironment
from PyQt6.QtGui import QKeySequence, QShortcut as QPyShortcut

# TinyCC 导入
HAS_TINYCC = False
TCC_LIB_PATH = ""
try:
    from tinycc import compile
    HAS_TINYCC = True
    import tinycc as _tc
    TCC_LIB_PATH = str(Path(_tc.__file__).parent / "lib")
except ImportError:
    pass
    


# ── 桥接器 ─────────────────────────────────────────────
class GameBridge(QObject):
    cppResult = pyqtSignal(str, bool)
    typingResult = pyqtSignal(bool)
    keyCollected = pyqtSignal(int)

    def __init__(self, main_window):
        super().__init__()
        self.main_window = main_window
        self._keys = [False, False, False]

    @property
    def base_path(self) -> str:
        if IS_FROZEN:
            return str(Path(sys.executable).parent.resolve().as_posix())
        return str((Path(__file__).parent / "..").resolve().as_posix())

    @pyqtSlot(str)
    def runCpp(self, code: str):
        if not HAS_TINYCC:
            self.cppResult.emit(
                "[TinyCC 未安装]\n运行: pip install tinycc\n或按 C 键跳过任务",
                False
            )
            return
        try:
            out = compile(code, includes=TCC_LIB_PATH)
            result = out.decode("utf-8", errors="replace").strip()
            self.cppResult.emit(result, True)
        except Exception as e:
            self.cppResult.emit(f"[运行出错]\n{str(e)}", False)

    @pyqtSlot(float, int)
    def submitTyping(self, elapsed_seconds: float, total_chars: int):
        passed = (total_chars / elapsed_seconds) * 60 >= 60 if elapsed_seconds > 0 and total_chars > 0 else False
        self.typingResult.emit(passed)
        if passed:
            self.collectKey(0)

    @pyqtSlot(str, result=bool)
    def checkTask3(self, answer: str) -> bool:
        return answer.strip() == "5201314"

    @pyqtSlot(int)
    def collectKey(self, index: int):
        if 0 <= index < 3 and not self._keys[index]:
            self._keys[index] = True
            self.keyCollected.emit(index)

    @pyqtSlot(int, result=bool)
    def hasKey(self, index: int) -> bool:
        return self._keys[index] if 0 <= index < 3 else False

    @pyqtSlot(result=bool)
    def hasAllKeys(self) -> bool:
        return all(self._keys)


# ── 主窗口 ─────────────────────────────────────────────
class MainWindow(QWidget):
    def __init__(self):
        super().__init__()

        # 打包模式下 base_path 指向可执行文件所在目录
        if IS_FROZEN:
            self.base_path = Path(sys.executable).parent.resolve()
        else:
            self.base_path = Path(__file__).parent.resolve()

        self.bridge = GameBridge(self)

        self.setWindowTitle("接亲小游戏")
        self.setFixedSize(1100, 760)
        self.setStyleSheet("background-color:#1a1a2e;")
        self._center()
        self._setup_ui()
        self._setup_channel()
        self._setup_shortcuts()

    def _center(self):
        app = QApplication.instance()
        screen = app.primaryScreen()
        r = screen.availableGeometry()
        self.move((r.width() - self.width()) // 2, (r.height() - self.height()) // 2)

    def page(self):
        return self.webview.page()

    def _setup_ui(self):
        layout = QVBoxLayout()
        layout.setContentsMargins(0, 0, 0, 0)
        self.setLayout(layout)
        self.webview = QWebEngineView()
        layout.addWidget(self.webview)
        # index.html 位于 py/ 的上一级目录
        html_path = (self.base_path / "..").resolve() / "index.html"
        self.webview.setUrl(QUrl.fromLocalFile(str(html_path)))

    def _setup_channel(self):
        self.channel = QWebChannel(self)
        self.channel.registerObject("pyBridge", self.bridge)
        self.page().setWebChannel(self.channel)
        self.bridge.cppResult.connect(self._on_cpp_result)
        self.bridge.typingResult.connect(self._on_typing_result)
        self.webview.loadFinished.connect(self._on_load_finished)

    def _on_load_finished(self, ok: bool):
        if not ok:
            return
        bp = str(self.base_path.as_posix()).replace("\\", "/")
        self.page().runJavaScript(f"window.pyBasePath = {json.dumps(bp)};")

    def _setup_shortcuts(self):
        for key, idx in [("T", 0), ("C", 1), ("S", 2)]:
            sc = QPyShortcut(QKeySequence(key), self)
            sc.activated.connect(lambda _, i=idx: self._skip_task(i))

    def _skip_task(self, index: int):
        self.bridge.collectKey(index)
        self.page().runJavaScript(f"if(window.onKeySkip) window.onKeySkip({index});")

    def _on_cpp_result(self, result: str, success: bool):
        self.page().runJavaScript(
            f"if(window.onCppResult) window.onCppResult({json.dumps(result)}, {success});"
        )

    def _on_typing_result(self, passed: bool):
        self.page().runJavaScript(
            f"if(window.onTypingResult) window.onTypingResult({passed});"
        )

    def closeEvent(self, event):
        event.accept()


def main():
    app = QApplication(sys.argv)
    app.setApplicationName("接亲小游戏")
    win = MainWindow()
    win.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()

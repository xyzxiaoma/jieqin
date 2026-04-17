/* ============================================================
   接亲小游戏 - 游戏逻辑
   ============================================================ */

// ===== 全局状态 =====
var state = {
    currentScreen: 'welcome',
    keys: [false, false, false],
    typingSeconds: 60,
    typingCharsTyped: 0,
    typingStartTime: null,
    typingTimer: null,
    typingAutoAdvanceTimer: null, // 自动跳转计时器
    task3Answer: '5201314',
    finalAnswer: '220613',
    basePath: '',
    bridgeReady: false,
    currentRedpacketTask: null, // 当前红包弹窗对应的任务
};

// 跳过指令配置
var SKIP_CODES = {
    1: 'LOVEU',  // 任务一跳过指令
    2: 'SWEET',  // 任务二跳过指令
    3: 'HONEY'   // 任务三跳过指令
};

var TYPING_TEXT = "执子之手，与子偕老。愿往后余生，风雪是你，平淡是你，心底温柔也是你。岁月静好，愿与你共赏春花秋月；繁华落尽，愿与你同守一方安宁。感谢你一直以来的陪伴与支持，愿我们的爱情如同初见时那般美好。愿得一心人，白首不相离。愿我们携手走过每一个春夏秋冬，直到地老天荒。💕";

// ===== 屏幕切换 =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(function(s) {
        s.classList.remove('active');
    });
    var target = document.getElementById('screen-' + screenId);
    if (target) target.classList.add('active');
    state.currentScreen = screenId;
}

function showToast(message) {
    var toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(function() { toast.style.display = 'none'; }, 3000);
}

// ===== QWebChannel 桥接 =====
function initBridge() {
    if (window.__bridgeInitDone__) return;
    window.__bridgeInitDone__ = true;

    new QWebChannel(window.webChannelTransport, function(channel) {
        window.pyBridge = channel.objects.pyBridge;

        // Python → JS 信号
        window.pyBridge.cppResult.connect(function(result, success) {
            window.onCppResult(result, success);
        });

        window.pyBridge.typingResult.connect(function(passed) {
            window.onTypingResult(passed);
        });

        window.pyBridge.keyCollected.connect(function(index) {
            window.updateKeysState_ui(index);
        });

        state.bridgeReady = true;

        if (window.__onBridgeReady) window.__onBridgeReady();
    });
}

// 在 DOMReady 时初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBridge);
} else {
    initBridge();
}

// 等待 pyBasePath 设置后初始化 basePath
window.__onBridgeReady = function() {
    if (window.pyBasePath) state.basePath = window.pyBasePath;
};

// ===== C++ 编辑器初始化（代码填空题，无补全）=====
function initCppEditor() {
    var editor = document.getElementById('cpp-code-editor');
    var lineNumbers = document.getElementById('cpp-line-numbers');
    
    if (!editor) return;
    
    var initialCode = `#include <bits/stdc++.h>
using namespace std;

// 判断年份是否为闰年
bool isLeapYear(int year) {
    return (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
}

// 获取某年某月的天数
int getDaysInMonth(int year, int month) {
    if (month == 2) {
        return isLeapYear(year) ? 29 : 28;
    }
    if (month == 4 || month == 6 || month == 9 || month == 11) {
        return 30;
    }
    return 31;
}

// 检查日期是否有效
bool isValidDate(int year, int month, int day) {
    if (year < 1000 || year > 9999) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (day > getDaysInMonth(year, month)) return false;
    return true;
}

int main() {
    vector<int> years;
    vector<int> months;
    vector<int> days;

    // 读取年份数组
    string line;
    getline(cin, line);
    stringstream ss1(line);
    int num;
    while (ss1 >> num) {
        years.push_back(num);
    }

    // 读取月份数组
    getline(cin, line);
    stringstream ss2(line);
    while (ss2 >> num) {
        months.push_back(num);
    }

    // 读取日期数组
    getline(cin, line);
    stringstream ss3(line);
    while (ss3 >> num) {
        days.push_back(num);
    }

    // 查找最大的有效日期
    int maxYear = -1, maxMonth = -1, maxDay = -1;
    long long maxDateNum = -1;
    bool found = false;

    for (int y : years) {
        for (int m : months) {
            for (int d : days) {
                if (isValidDate(________)) {      // 填空1
                    found = true;
                    long long dateNum = y * 10000LL + m * 100 + d;
                    if (dateNum ________ maxDateNum) {   // 填空2
                        maxYear = y;
                        maxMonth = m;
                        maxDay = d;
                        maxDateNum = ________;          // 填空3
                    }
                }
            }
        }
    }

    // 输出结果
    if (!found) {
        cout << 0;
    } else {
        cout << ________;                            // 填空4
    }

    return 0;
}`;
    
    editor.textContent = initialCode;
    updateLineNumbers(initialCode);
    
    editor.addEventListener('input', function() {
        updateLineNumbers(editor.textContent);
    });
    
    editor.addEventListener('scroll', function() {
        lineNumbers.scrollTop = editor.scrollTop;
        lineNumbers.scrollLeft = editor.scrollLeft;
    });
    
    lineNumbers.addEventListener('scroll', function() {
        editor.scrollTop = lineNumbers.scrollTop;
        editor.scrollLeft = lineNumbers.scrollLeft;
    });
    
    function updateLineNumbers(code) {
        var lines = code.split('\n').length;
        var numbers = [];
        for (var i = 1; i <= lines; i++) {
            numbers.push(i);
        }
        lineNumbers.textContent = numbers.join('\n');
    }
}

// 获取编辑器代码
function getCppCode() {
    var editor = document.getElementById('cpp-code-editor');
    return editor ? editor.textContent : '';
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initCppEditor, 100);
});

// ===== 欢迎页 =====
document.getElementById('btn-start').addEventListener('click', function() {
    showScreen('task1');
    startTypingGame();
});

// ===== 任务一：打字游戏 =====
function startTypingGame() {
    state.typingSeconds = 60;
    state.typingCharsTyped = 0;
    state.typingStartTime = null;
    if (state.typingTimer) clearInterval(state.typingTimer);
    if (state.typingAutoAdvanceTimer) clearTimeout(state.typingAutoAdvanceTimer);

    // 渲染带高亮的打字文本
    renderTypingSource();

    document.getElementById('t1-total').textContent = TYPING_TEXT.length;
    document.getElementById('t1-progress').textContent = '0 / ' + TYPING_TEXT.length;
    document.getElementById('t1-wpm').textContent = '速度: 0 字/分';

    var input = document.getElementById('typing-input');
    input.value = '';
    input.disabled = false;
    input.maxLength = TYPING_TEXT.length;
    var fb = document.getElementById('typing-feedback');
    fb.className = 'typing-feedback';
    fb.textContent = '';

    var timerEl = document.getElementById('t1-timer');
    timerEl.textContent = '⏱ 60';
    timerEl.className = '';

    state.typingTimer = setInterval(function() {
        state.typingSeconds--;
        var te = document.getElementById('t1-timer');
        te.textContent = '⏱ ' + state.typingSeconds;
        if (state.typingSeconds <= 10) te.className = 'warning';
        if (state.typingSeconds <= 0) {
            clearInterval(state.typingTimer);
            finishTypingGame(false);
        }
    }, 1000);

    input.focus();
}

function renderTypingSource() {
    var container = document.getElementById('typing-source');
    container.innerHTML = '';
    for (var i = 0; i < TYPING_TEXT.length; i++) {
        var span = document.createElement('span');
        span.className = 'typing-char pending';
        span.textContent = TYPING_TEXT[i];
        span.dataset.index = i;
        container.appendChild(span);
    }
}

function updateTypingHighlight(typed) {
    var chars = document.querySelectorAll('.typing-char');
    for (var i = 0; i < TYPING_TEXT.length; i++) {
        var charEl = chars[i];
        if (i < typed.length) {
            if (typed[i] === TYPING_TEXT[i]) {
                charEl.className = 'typing-char correct';
            } else {
                charEl.className = 'typing-char wrong';
            }
        } else if (i === typed.length) {
            charEl.className = 'typing-char current';
        } else {
            charEl.className = 'typing-char pending';
        }
    }
}

document.getElementById('typing-input').addEventListener('input', function() {
    var typed = this.value;
    var len = typed.length;

    if (state.typingStartTime === null && len > 0) {
        state.typingStartTime = Date.now();
    }
    state.typingCharsTyped = len;

    // 实时高亮每个字符
    updateTypingHighlight(typed);

    document.getElementById('t1-progress').textContent = len + ' / ' + TYPING_TEXT.length;

    if (len > 0 && state.typingStartTime !== null) {
        var elapsed = (Date.now() - state.typingStartTime) / 1000;
        var wpm = Math.round((len / elapsed) * 60);
        document.getElementById('t1-wpm').textContent = '速度: ' + wpm + ' 字/分';
    }

    // 全部打完才结算
    if (len >= TYPING_TEXT.length) {
        finishTypingGame(true);
    }
});

function finishTypingGame(userFinished) {
    if (state.typingTimer) {
        clearInterval(state.typingTimer);
        state.typingTimer = null;
    }

    var input = document.getElementById('typing-input');
    input.disabled = true;
    var fb = document.getElementById('typing-feedback');
    var typed = input.value;

    // 检查是否所有字都正确
    var allCorrect = (typed.length === TYPING_TEXT.length);
    if (allCorrect) {
        for (var i = 0; i < TYPING_TEXT.length; i++) {
            if (typed[i] !== TYPING_TEXT[i]) {
                allCorrect = false;
                break;
            }
        }
    }

    if (userFinished) {
        var elapsed = state.typingStartTime ? (Date.now() - state.typingStartTime) / 1000 : 60;
        var wpm = Math.round((TYPING_TEXT.length / elapsed) * 60);

        // 只要速度达标就通过，不要求100%正确
        if (wpm >= 60) {
            var typed_correct = 0;
            for (var i = 0; i < typed.length; i++) {
                if (typed[i] === TYPING_TEXT[i]) typed_correct++;
            }
            if (typed_correct === TYPING_TEXT.length) {
                fb.textContent = '🎉 打字完成！速度 ' + wpm + ' 字/分，所有字完全正确！';
            } else {
                fb.textContent = '🎉 打字完成！速度 ' + wpm + ' 字/分，正确 ' + typed_correct + '/' + TYPING_TEXT.length + ' 字！';
            }
            fb.className = 'typing-feedback pass';
            collectKey(0, 1, function() {
                setTimeout(function() {
                    showScreen('task2');
                    startCppTask();
                }, 500);
            });
        } else {
            var correctCount = 0;
            for (var j = 0; j < typed.length; j++) {
                if (typed[j] === TYPING_TEXT[j]) correctCount++;
            }
            fb.textContent = '速度不够！' + wpm + ' 字/分，需要超过60字/分。';
            fb.className = 'typing-feedback fail';
            // 添加重试按钮
            var retryBtn2 = document.createElement('button');
            retryBtn2.className = 'btn-retry';
            retryBtn2.textContent = '🔄 再试一次';
            retryBtn2.onclick = function() { 
                clearTimeout(state.typingAutoAdvanceTimer);
                startTypingGame(); 
            };
            fb.appendChild(document.createElement('br'));
            fb.appendChild(retryBtn2);
            state.typingAutoAdvanceTimer = setTimeout(function() {
                showScreen('task2');
                startCppTask();
            }, 5000);
        }
        return;
    }

    // 时间到的情况
    var timeElapsed = 60 - state.typingSeconds;
    if (timeElapsed <= 0) timeElapsed = 1;
    var timeWpm = Math.round((typed.length / timeElapsed) * 60);

    // 只要速度达标就通过，不要求100%正确
    if (timeWpm >= 60) {
        var correctAtTime = 0;
        for (var k = 0; k < typed.length; k++) {
            if (typed[k] === TYPING_TEXT[k]) correctAtTime++;
        }
        if (correctAtTime === TYPING_TEXT.length) {
            fb.textContent = '⏱ 时间到！速度 ' + timeWpm + ' 字/分，所有字完全正确！';
        } else {
            fb.textContent = '⏱ 时间到！速度 ' + timeWpm + ' 字/分，正确 ' + correctAtTime + '/' + TYPING_TEXT.length + ' 字！';
        }
        fb.className = 'typing-feedback pass';
        collectKey(0, 1, function() {
            setTimeout(function() {
                showScreen('task2');
                startCppTask();
            }, 500);
        });
    } else {
        var correctAtTime = 0;
        for (var m = 0; m < typed.length; m++) {
            if (typed[m] === TYPING_TEXT[m]) correctAtTime++;
        }
        fb.textContent = '⏱ 时间到！速度不够：' + timeWpm + ' 字/分，需要超过60字/分。';
        fb.className = 'typing-feedback fail';
        var retryBtn3 = document.createElement('button');
        retryBtn3.className = 'btn-retry';
        retryBtn3.textContent = '🔄 再试一次';
        retryBtn3.onclick = function() { 
            clearTimeout(state.typingAutoAdvanceTimer);
            startTypingGame(); 
        };
        fb.appendChild(document.createElement('br'));
        fb.appendChild(retryBtn3);
        state.typingAutoAdvanceTimer = setTimeout(function() {
            showScreen('task2');
            startCppTask();
        }, 5000);
    }
}

// ===== 任务二：C++ 算法题 =====
function startCppTask() {
    document.getElementById('cpp-output').textContent = '等待运行...';
    document.getElementById('cpp-output').style.color = '#8B6B7C';
    // 隐藏下一关按钮
    var nextBtn = document.getElementById('btn-next-level');
    if (nextBtn) nextBtn.style.display = 'none';
}

// 显示下一关按钮
function showNextLevelButton(callback) {
    var outEl = document.getElementById('cpp-output');
    // 在输出区域添加下一关按钮
    var nextBtn = document.getElementById('btn-next-level');
    if (!nextBtn) {
        nextBtn = document.createElement('button');
        nextBtn.id = 'btn-next-level';
        nextBtn.className = 'btn-next-level';
        nextBtn.textContent = '🎯 下一关';
        nextBtn.onclick = function() {
            nextBtn.style.display = 'none';
            callback();
        };
        outEl.parentElement.appendChild(nextBtn);
    } else {
        nextBtn.style.display = 'block';
    }
}

window.onCppResult = function(result, success) {
    var outEl = document.getElementById('cpp-output');
    outEl.textContent = result;

    if (success) {
        var output = result.trim();
        var expected = '20250614';

        if (output === expected) {
            outEl.style.color = '#27ae60';
            outEl.textContent = result + '\n🎉 爱心密码破解成功！';
            
            // 添加温馨提醒
            setTimeout(function() {
                var reminder = document.createElement('div');
                reminder.style.marginTop = '15px';
                reminder.style.padding = '14px 18px';
                reminder.style.background = 'rgba(255, 107, 157, 0.2)';
                reminder.style.borderRadius = '10px';
                reminder.style.border = '1px solid rgba(255, 107, 157, 0.3)';
                reminder.style.color = '#FF6B9D';
                reminder.style.fontSize = '15px';
                reminder.style.fontFamily = "'Noto Serif SC', serif";
                reminder.innerHTML = '💭 知道这串数字的含义吗？';
                outEl.parentElement.appendChild(reminder);
                reminder.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                
                // 显示下一关按钮
                showNextLevelButton(function() {
                    // 收集钥匙动画
                    collectKey(1, 2, function() {
                        setTimeout(function() {
                            showScreen('task3');
                            startTask3();
                        }, 500);
                    });
                });
            }, 500);
        } else if (/^\d{7}$/.test(output)) {
            outEl.style.color = '#e67e22';
            outEl.textContent = result + '\n❌ 少了一位，记得月份和日期要补两位数（06月、14日）';
        } else if (/^\d+$/.test(output) && output.length > 0) {
            outEl.style.color = '#e67e22';
            outEl.textContent = result + '\n❌ 这个数字组合不对哦，再想想！';
        } else {
            outEl.style.color = '#e74c3c';
            outEl.textContent = result + '\n❌ 需要输出一个8位数字密码！';
        }
    } else {
        outEl.style.color = '#e74c3c';
    }
};

document.getElementById('btn-run-cpp').addEventListener('click', function() {
    var code = getCppCode();
    var outEl = document.getElementById('cpp-output');
    outEl.textContent = '⏳ 编译运行中...';
    outEl.style.color = '#8B6B7C';

    if (state.bridgeReady && window.pyBridge) {
        window.pyBridge.runCpp(code);
    } else {
        // 无后端：模拟检查
        setTimeout(function() {
            simulateCppRun(code, outEl);
        }, 800);
    }
});

function simulateCppRun(code, outEl) {
    // 检查填空是否正确填入
    var hasBlank1 = /isValidDate\s*\(\s*y\s*,\s*m\s*,\s*d\s*\)/.test(code);
    var hasBlank2 = /dateNum\s*>\s*maxDateNum/.test(code);
    var hasBlank3 = /maxDateNum\s*=\s*dateNum/.test(code);
    var hasBlank4 = (code.includes('maxYear * 10000 + maxMonth * 100 + maxDay') || 
                    code.includes('maxYear*10000+maxMonth*100+maxDay')) &&
                    code.includes('cout <<') && !code.includes('________');

    // 4个空都填对才通过
    if (hasBlank1 && hasBlank2 && hasBlank3 && hasBlank4) {
        outEl.textContent = '20250614\n🎉 爱心密码破解成功！';
        outEl.style.color = '#27ae60';

        // 添加温馨提醒
        setTimeout(function() {
            var reminder = document.createElement('div');
            reminder.style.marginTop = '15px';
            reminder.style.padding = '14px 18px';
            reminder.style.background = 'rgba(255, 107, 157, 0.2)';
            reminder.style.borderRadius = '10px';
            reminder.style.border = '1px solid rgba(255, 107, 157, 0.3)';
            reminder.style.color = '#FF6B9D';
            reminder.style.fontSize = '15px';
            reminder.style.fontFamily = "'Noto Serif SC', serif";
            reminder.innerHTML = '💭 知道这串数字的含义吗？';
            outEl.parentElement.appendChild(reminder);
            
            // 显示下一关按钮
            showNextLevelButton(function() {
                collectKey(1, 2, function() {
                    setTimeout(function() {
                        showScreen('task3');
                        startTask3();
                    }, 500);
                });
            });
        }, 300);
        return;
    }

    // 逐个提示哪个空没填
    var missing = [];
    if (!hasBlank1) missing.push('填空1：isValidDate参数');
    if (!hasBlank2) missing.push('填空2：比较符号');
    if (!hasBlank3) missing.push('填空3：赋值');
    if (!hasBlank4) missing.push('填空4：输出表达式');

    if (missing.length > 0) {
        outEl.textContent = '[提示] 请补全以下空位：\n• ' + missing.join('\n• ');
        outEl.style.color = '#e67e22';
    } else {
        outEl.textContent = '[提示] 代码中有错误，请检查';
        outEl.style.color = '#e74c3c';
    }
}

// ===== 任务三：数学挑战 =====
function startTask3() {
    // 触发 MathJax 重新渲染公式
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise(['#screen-task3']).then(function() {
            console.log('MathJax rendered');
        }).catch(function(err) {
            console.log('MathJax error:', err);
        });
    }
    document.getElementById('task3-answer').value = '';
    var fb = document.getElementById('task3-feedback');
    fb.className = 'answer-feedback';
    fb.textContent = '';
}

document.getElementById('btn-submit-task3').addEventListener('click', submitTask3Answer);
document.getElementById('task3-answer').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') submitTask3Answer();
});

function submitTask3Answer() {
    var answer = document.getElementById('task3-answer').value.trim();
    var fb = document.getElementById('task3-feedback');

    if (answer === state.task3Answer) {
        fb.textContent = '🎉 回答正确！';
        fb.className = 'answer-feedback correct';
        collectKey(2, 3, function() {
            setTimeout(function() {
                showScreen('box');
                initBoxScreen();
            }, 500);
        });
    } else {
        fb.textContent = '❌ 答案错误，请再想想～';
        fb.className = 'answer-feedback wrong';
    }
}

// ===== 宝箱页 =====
function initBoxScreen() {
    updateKeySlots();
    updateBoxButton();
}

function updateKeySlots() {
    for (var i = 0; i < 3; i++) {
        var slot = document.getElementById('key-slot-' + i);
        var ring = slot.querySelector('.key-slot-ring');
        var label = slot.querySelector('span');
        if (state.keys[i]) {
            slot.classList.add('has-key');
            ring.textContent = '🔑';
            label.textContent = '已获得';
            label.style.color = '#FF8FB1';
        } else {
            slot.classList.remove('has-key');
            ring.textContent = '🔒';
            label.textContent = '钥匙 ' + (i + 1);
        }
    }
}

function updateBoxButton() {
    var btn = document.getElementById('btn-open-box');
    var status = document.getElementById('box-status');
    var allKeys = state.keys[0] && state.keys[1] && state.keys[2];

    if (allKeys) {
        btn.disabled = false;
        btn.classList.add('ready');
        btn.textContent = '✨ 开启宝箱';
        status.textContent = '三把钥匙已集齐，可以开启了！';
        status.style.color = '#FF8FB1';
        document.getElementById('treasure-box').classList.add('glowing');
    } else {
        btn.disabled = true;
        btn.classList.remove('ready');
        btn.textContent = '🔒 三把钥匙未集齐';
        var count = state.keys.filter(function(k) { return k; }).length;
        status.textContent = '已收集 ' + count + '/3 把钥匙';
        status.style.color = 'rgba(255, 183, 194, 0.5)';
    }
}

document.getElementById('btn-open-box').addEventListener('click', function() {
    if (!state.keys[0] || !state.keys[1] || !state.keys[2]) return;
    document.getElementById('treasure-box').classList.add('open');
    setTimeout(function() {
        showScreen('heart');
        initHeartScreen();
    }, 1200);
});

// ===== 爱心展示页 =====
function initHeartScreen() {
    var center = document.getElementById('heart-center');
    center.innerHTML = '';

    var messages = [
        "你是我最爱的人", "一路走来，感谢有你",
        "余生请多指教", "5201314", "遇见你，真好",
        "永远爱你", "执子之手，与子偕老", "我愿与你白头偕老",
        "你是我的唯一", "love you forever", "最美的时光是和你在一起",
        "往后余生，风雪是你",
        "愿得一心人", "白首不相离", "与你共赏春花秋月",
        "繁华落尽，与你同守",
    ];

    // 心形参数方程：x = 16sin³(t), y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
    var total = messages.length;
    var cx = 300, cy = 300;

    function getHeartPoint(index, total) {
        var t = (index / total) * 2 * Math.PI;
        var scale = 12;
        var x = scale * 16 * Math.pow(Math.sin(t), 3);
        var y = -scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        return {
            x: cx + x,
            y: cy + y
        };
    }

    // 收集所有气泡，统一动画
    var bubbles = [];

    for (var i = 0; i < total; i++) {
        var bubble = document.createElement('div');
        bubble.className = 'heart-bubble';
        bubble.textContent = messages[i];

        var pos = getHeartPoint(i, total);
        bubble.style.left = (pos.x - 80) + 'px';
        bubble.style.top = (pos.y - 30) + 'px';
        // 初始透明
        bubble.style.opacity = '0';
        bubble.style.transform = 'scale(0)';

        center.appendChild(bubble);
        bubbles.push(bubble);
    }

    // 所有气泡同时动画进入
    var delay = 0;
    var interval = 80; // 每个气泡间隔80ms出现

    bubbles.forEach(function(b, idx) {
        setTimeout(function() {
            b.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
            b.style.opacity = '1';
            b.style.transform = 'scale(1)';

            // 进入后开始漂浮
            setTimeout(function() {
                b.classList.add('floating');
                b.style.animationDelay = (Math.random() * 2) + 's';
            }, 600);
        }, delay + idx * interval);
    });

    // 按钮直接显示，不需要等待
    document.getElementById('heart-continue').style.display = 'block';
}

document.getElementById('btn-heart-next').addEventListener('click', function() {
    showScreen('final');
    initFinalScreen();
});

// ===== 最终问题 =====
function initFinalScreen() {
    var starsContainer = document.getElementById('final-stars');
    starsContainer.innerHTML = '';
    for (var i = 0; i < 80; i++) {
        var star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + 'vw';
        star.style.top = Math.random() * 100 + 'vh';
        star.style.setProperty('--duration', (2 + Math.random() * 3) + 's');
        star.style.setProperty('--opacity', (0.3 + Math.random() * 0.7));
        star.style.width = (1 + Math.random() * 3) + 'px';
        star.style.height = star.style.width;
        starsContainer.appendChild(star);
    }
    document.getElementById('final-answer').value = '';
    var fb = document.getElementById('final-feedback');
    fb.className = 'final-feedback';
    fb.textContent = '';
}

document.getElementById('btn-final-submit').addEventListener('click', submitFinalAnswer);
document.getElementById('final-answer').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') submitFinalAnswer();
});

function submitFinalAnswer() {
    var answer = document.getElementById('final-answer').value.trim();
    var fb = document.getElementById('final-feedback');

    if (answer === state.finalAnswer) {
        fb.textContent = '🎉 回答正确！你记得我们相遇的日子 💍';
        fb.className = 'final-feedback correct';
        setTimeout(function() {
            showScreen('success');
            initSuccessScreen();
        }, 2000);
    } else {
        fb.textContent = '❌ 日期不对哦，再想想～';
        fb.className = 'final-feedback wrong';
    }
}

// ===== 成功页 =====
function initSuccessScreen() {
    spawnConfetti();
    initSuccessHearts();
}

function initSuccessHearts() {
    var container = document.getElementById('success-hearts');
    if (!container) return;
    container.innerHTML = '';
    var symbols = ['❤️', '💕', '💗', '💖', '💓', '💝', '💘', '💞'];
    for (var i = 0; i < 30; i++) {
        var span = document.createElement('span');
        span.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        span.style.fontSize = (12 + Math.random() * 20) + 'px';
        span.style.left = Math.random() * 100 + '%';
        span.style.top = Math.random() * 100 + '%';
        span.style.opacity = 0.3 + Math.random() * 0.5;
        span.style.animationDelay = Math.random() * 2 + 's';
        container.appendChild(span);
    }
}

function spawnConfetti() {
    var container = document.getElementById('success-confetti');
    container.innerHTML = '';
    var colors = ['#FF8FB1', '#FF6B9D', '#FFB6C1', '#FFD700', '#FF69B4', '#FFA07A', '#87CEEB'];
    for (var i = 0; i < 60; i++) {
        var piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + 'vw';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.setProperty('--fall-duration', (2 + Math.random() * 3) + 's');
        piece.style.animationDelay = Math.random() * 2 + 's';
        container.appendChild(piece);
    }
}

// ===== 收集钥匙（通用，包含动画）=====
function collectKey(index, keyNum, callback) {
    // 更新状态
    state.keys[index] = true;
    if (state.bridgeReady && window.pyBridge) {
        window.pyBridge.collectKey(index);
    }
    updateWelcomeKeys();
    updateKeySlots();
    updateBoxButton();

    // 显示动画
    var overlay = document.getElementById('key-collect-overlay');
    var icon = document.getElementById('key-collect-icon');
    var text = document.getElementById('key-collect-text');
    var sparkles = document.getElementById('key-collect-sparkles');

    icon.textContent = '🔑';
    text.textContent = '获得第' + keyNum + '把钥匙！';
    sparkles.innerHTML = '';

    // 生成闪光粒子
    for (var i = 0; i < 16; i++) {
        var sp = document.createElement('div');
        sp.className = 'sparkle';
        var angle = (i / 16) * 2 * Math.PI;
        var dist = 60 + Math.random() * 40;
        sp.style.left = '100px';
        sp.style.top = '100px';
        sp.style.setProperty('--dx', (Math.cos(angle) * dist) + 'px');
        sp.style.setProperty('--dy', (Math.sin(angle) * dist) + 'px');
        sp.style.background = ['#FFD700', '#FF8FB1', '#FF6B9D', '#FFB6C1'][i % 4];
        sp.style.animationDelay = (i * 0.04) + 's';
        sparkles.appendChild(sp);
    }

    overlay.style.display = 'flex';

    // 点击确认按钮才关闭
    var confirmBtn = document.getElementById('key-collect-confirm');
    var closeHandler = function() {
        overlay.style.display = 'none';
        confirmBtn.removeEventListener('click', closeHandler);
        if (callback) callback();
    };
    confirmBtn.addEventListener('click', closeHandler);
}

// ===== 收集钥匙（前端同步）=====
window.updateKeysState_ui = function(index) {
    if (index >= 0 && index <= 2) state.keys[index] = true;
    updateWelcomeKeys();
    updateKeySlots();
    updateBoxButton();
};

window.updateKeysState = function(keys) {
    state.keys = keys;
    updateWelcomeKeys();
    updateKeySlots();
    updateBoxButton();
};

window.syncKeysState = function(keys) {
    state.keys = keys;
    updateWelcomeKeys();
    updateKeySlots();
    updateBoxButton();
};

function updateWelcomeKeys() {
    for (var i = 0; i < 3; i++) {
        var keyEl = document.getElementById('wkey' + i);
        if (state.keys[i]) {
            keyEl.classList.remove('locked');
            keyEl.classList.add('unlocked');
            keyEl.querySelector('span').textContent = '🔑';
        }
    }
}

// ===== 跳过任务（T/C/S）=====
window.onKeySkip = function(taskIndex) {
    if (taskIndex === 0 && state.currentScreen === 'task1') {
        clearInterval(state.typingTimer);
        showToast('⏭ 跳过任务一，直接获得钥匙！');
        collectKey(0, 1, function() {
            setTimeout(function() {
                showScreen('task2');
                startCppTask();
            }, 500);
        });
    } else if (taskIndex === 1 && state.currentScreen === 'task2') {
        showToast('⏭ 跳过任务二，直接获得钥匙！');
        collectKey(1, 2, function() {
            setTimeout(function() {
                showScreen('task3');
                startTask3();
            }, 500);
        });
    } else if (taskIndex === 2 && state.currentScreen === 'task3') {
        showToast('⏭ 跳过任务三，直接获得钥匙！');
        collectKey(2, 3, function() {
            setTimeout(function() {
                showScreen('box');
                initBoxScreen();
            }, 500);
        });
    }
};

// ===== 打字结果回调 =====
window.onTypingResult = function(passed) {
    var fb = document.getElementById('typing-feedback');
    if (passed) {
        fb.textContent = '🎉 打字完成！速度超过60字/分！';
        fb.className = 'typing-feedback pass';
    } else {
        fb.textContent = '打字速度未达标（需>60字/分）';
        fb.className = 'typing-feedback fail';
    }
};

// ===== 爱心飘落动效（增强版）=====
function initHeartsCanvas() {
    var canvas = document.getElementById('hearts-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    var hearts = [];
    var particles = [];
    var sparkles = [];
    var symbols = ['❤️', '💕', '💗', '💖', '💓', '💝', '💘', '💞'];
    var colors = ['#FF6B9D', '#FF8FB1', '#FFB6C1', '#FF69B4', '#FF1493', '#FFC0CB', '#E91E63', '#FF4081'];

    function createHeart() {
        return {
            x: Math.random() * canvas.width,
            y: -30,
            size: 12 + Math.random() * 20,
            speed: 0.5 + Math.random() * 1.5,
            opacity: 0.3 + Math.random() * 0.5,
            drift: (Math.random() - 0.5) * 0.8,
            symbol: symbols[Math.floor(Math.random() * symbols.length)],
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.015 + Math.random() * 0.03,
            scale: 0.8 + Math.random() * 0.4,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            trail: [],
            hasTrail: Math.random() > 0.5,
        };
    }

    function createParticle(x, y) {
        return {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            size: 2 + Math.random() * 4,
            life: 1,
            decay: 0.02 + Math.random() * 0.02,
            color: colors[Math.floor(Math.random() * colors.length)],
            shape: Math.random() > 0.5 ? 'circle' : 'star',
        };
    }

    function createSparkle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 1 + Math.random() * 2,
            opacity: Math.random(),
            speed: 0.5 + Math.random() * 1,
            phase: Math.random() * Math.PI * 2,
            color: ['#FFD700', '#FFF', '#FF69B4', '#FFB6C1'][Math.floor(Math.random() * 4)],
        };
    }

    function drawStar(x, y, size, opacity) {
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        for (var i = 0; i < 4; i++) {
            var angle = (i / 4) * Math.PI * 2;
            var sx = x + Math.cos(angle) * size;
            var sy = y + Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
            var innerAngle = angle + Math.PI / 4;
            var innerX = x + Math.cos(innerAngle) * (size * 0.3);
            var innerY = y + Math.sin(innerAngle) * (size * 0.3);
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function drawHeart(x, y, size, opacity, rotation, scale) {
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.font = Math.floor(size) + 'px serif';
        ctx.fillText('❤️', -size / 2, size / 3);
        ctx.restore();
    }

    // 初始化星星背景
    for (var i = 0; i < 60; i++) {
        sparkles.push(createSparkle());
    }

    var frameCount = 0;

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        frameCount++;

        // 背景渐变光晕
        var gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height * 0.3, 0,
            canvas.width / 2, canvas.height * 0.3, canvas.height * 0.8
        );
        gradient.addColorStop(0, 'rgba(255, 143, 177, 0.08)');
        gradient.addColorStop(1, 'rgba(255, 143, 177, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制星星/闪光
        sparkles.forEach(function(s, idx) {
            s.phase += 0.02;
            var flicker = 0.5 + 0.5 * Math.sin(s.phase);
            s.y += s.speed * 0.1;
            if (s.y > canvas.height) {
                s.y = 0;
                s.x = Math.random() * canvas.width;
            }
            ctx.save();
            ctx.globalAlpha = flicker * s.opacity * 0.6;
            if (idx % 3 === 0) {
                drawStar(s.x, s.y, s.size * 2, flicker * s.opacity * 0.6);
            } else {
                ctx.fillStyle = s.color;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        });

        // 爱心数量控制
        while (hearts.length < 20) hearts.push(createHeart());

        for (var i = hearts.length - 1; i >= 0; i--) {
            var h = hearts[i];
            h.y += h.speed;
            h.wobble += h.wobbleSpeed;
            h.x += h.drift + Math.sin(h.wobble) * 1.2;
            h.rotation += h.rotationSpeed;

            // 拖尾效果
            if (h.hasTrail && frameCount % 3 === 0) {
                particles.push({
                    x: h.x,
                    y: h.y,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: -0.5 - Math.random() * 0.5,
                    size: h.size * 0.3,
                    life: 1,
                    decay: 0.05,
                    symbol: h.symbol,
                    opacity: h.opacity * 0.5,
                    rotation: h.rotation,
                    scale: h.scale * 0.5,
                });
            }

            // 绘制爱心（带旋转和缩放）
            drawHeart(h.x, h.y, h.size, h.opacity, h.rotation, h.scale);

            // 移除出界的爱心
            if (h.y > canvas.height + 40) {
                hearts.splice(i, 1);
            }
        }

        // 绘制粒子
        for (var j = particles.length - 1; j >= 0; j--) {
            var p = particles[j];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            p.size *= 0.97;

            if (p.life <= 0) {
                particles.splice(j, 1);
                continue;
            }

            ctx.save();
            ctx.globalAlpha = p.life * p.opacity;
            ctx.font = Math.floor(p.size) + 'px serif';
            ctx.fillText(p.symbol, p.x - p.size / 2, p.y + p.size / 3);
            ctx.restore();
        }

        // 每隔一段时间生成粒子爆发
        if (frameCount % 120 === 0) {
            var bx = Math.random() * canvas.width;
            var by = Math.random() * canvas.height * 0.7;
            for (var k = 0; k < 8; k++) {
                particles.push(createParticle(bx, by));
            }
        }

        requestAnimationFrame(draw);
    }
    draw();
}

// ===== 初始化 =====
window.addEventListener('load', function() {
    initHeartsCanvas();
    if (window.pyBasePath) state.basePath = window.pyBasePath;
});

// ===== 红包按钮事件 =====
document.getElementById('btn-redpacket-1').addEventListener('click', function() {
    showRedpacketModal(1);
});
document.getElementById('btn-redpacket-2').addEventListener('click', function() {
    showRedpacketModal(2);
});
document.getElementById('btn-redpacket-3').addEventListener('click', function() {
    showRedpacketModal(3);
});

document.getElementById('btn-redpacket-close').addEventListener('click', function() {
    document.getElementById('redpacket-overlay').style.display = 'none';
});

document.getElementById('btn-redpacket-submit').addEventListener('click', function() {
    verifyRedpacketCode();
});

document.getElementById('redpacket-code').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') verifyRedpacketCode();
});

function showRedpacketModal(taskNum) {
    state.currentRedpacketTask = taskNum;
    var input = document.getElementById('redpacket-code');
    input.value = '';
    input.maxLength = 5;
    document.getElementById('redpacket-feedback').textContent = '';
    document.getElementById('redpacket-feedback').className = 'redpacket-feedback';
    document.getElementById('redpacket-overlay').style.display = 'flex';
    setTimeout(function() { input.focus(); }, 100);
}

function verifyRedpacketCode() {
    var code = document.getElementById('redpacket-code').value.trim().toUpperCase();
    var fb = document.getElementById('redpacket-feedback');
    var taskNum = state.currentRedpacketTask;

    if (!code) {
        fb.textContent = '请输入跳过指令';
        fb.className = 'redpacket-feedback error';
        return;
    }

    if (code === SKIP_CODES[taskNum]) {
        fb.textContent = '✓ 验证成功！';
        fb.className = 'redpacket-feedback success';

        setTimeout(function() {
            document.getElementById('redpacket-overlay').style.display = 'none';
            window.onKeySkip(taskNum - 1);
        }, 800);
    } else {
        fb.textContent = '✗ 指令错误，请重新输入';
        fb.className = 'redpacket-feedback error';
        document.getElementById('redpacket-code').value = '';
    }
}

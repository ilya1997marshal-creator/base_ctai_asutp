/**
 * ЦТАИ АСУ ТП - Основной скрипт
 */

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ТЕСТОВ ====================
let testMode = null; // 'exam', 'all', 'review'
let currentQuestions = [];
let userAnswers = {}; // { questionId: [selectedIndices] }
let currentIndex = 0;
let testFinished = false;
let selectedTestQuestions = allQuestions; // по умолчанию все вопросы ПТЭ

// ==================== ОСНОВНЫЕ ФУНКЦИИ ====================
function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

function switchTab(index) {
    const tabs = ['tab-home', 'tab-schedule', 'tab-tests', 'tab-help'];
    tabs.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('active', i === index);
    });
    
    document.querySelectorAll('.nav-item').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });
    
    if(index === 0) { updateOnDutyWidget(); updateCurrentDateDisplay(); }
    if(index === 1) renderSchedule(document.getElementById('month-selector').value);
    if(index === 3) updateVersionNumber(); 
    window.scrollTo({top: 0, behavior: 'smooth'});
}

async function updateVersionNumber() {
    const verElement = document.getElementById('app-version');
    if (!verElement) return;
    try {
        if ('serviceWorker' in navigator) {
            const keys = await caches.keys();
            const cacheKey = keys.find(k => k.toLowerCase().includes('v'));
            if (cacheKey) {
                const match = cacheKey.match(/v\d+/i);
                verElement.textContent = match ? match[0].toUpperCase() : cacheKey.toUpperCase();
            } else {
                verElement.textContent = "V85"; 
            }
        }
    } catch (e) {
        verElement.textContent = "V85";
    }
}

function getMonthName(monthIndex) {
    const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    return months[monthIndex];
}

function updateCurrentDateDisplay() {
    const dateEl = document.getElementById('current-date-display');
    if (!dateEl) return;
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const formatted = now.toLocaleDateString('ru-RU', options);
    dateEl.textContent = formatted;
}

function updateOnDutyWidget() {
    const dutyList = document.getElementById('duty-list');
    if (!dutyList) return;

    const now = new Date();
    const day = now.getDate();
    const monthName = getMonthName(now.getMonth());
    const currentMonthData = scheduleData[monthName];
    
    if (!currentMonthData) {
        dutyList.innerHTML = '<div class="w-full text-center py-3 opacity-30 text-[10px] font-black uppercase tracking-widest">Нет данных</div>';
        return;
    }

    const dayShift = currentMonthData
        .filter(p => ['D', 'S'].includes(p.shifts[day - 1] || ''))
        .map(p => p.name.split(' ')[0]);
    
    const nightShift = currentMonthData
        .filter(p => p.shifts[day - 1] === 'N')
        .map(p => p.name.split(' ')[0]);

    if (dayShift.length === 0 && nightShift.length === 0) {
        dutyList.innerHTML = '<div class="text-center py-3 opacity-30 text-[10px] font-black uppercase tracking-widest">Нет смен</div>';
        return;
    }

    dutyList.innerHTML = `
        <div class="flex justify-center gap-4">
            ${dayShift.length > 0 ? `
                <div class="text-center">
                    <div class="text-[8px] font-black uppercase text-emerald-500/60 mb-1 tracking-wider">День</div>
                    <div class="flex flex-col items-center gap-1">
                        ${dayShift.map(name => `<span class="bg-emerald-500/5 px-3 py-1 rounded-lg text-emerald-500 border border-emerald-500/10 text-xs font-bold whitespace-nowrap">${name}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${dayShift.length > 0 && nightShift.length > 0 ? `<div class="w-[1px] bg-white/10 self-stretch my-1"></div>` : ''}
            
            ${nightShift.length > 0 ? `
                <div class="text-center">
                    <div class="text-[8px] font-black uppercase text-blue-400/60 mb-1 tracking-wider">Ночь</div>
                    <div class="flex flex-col items-center gap-1">
                        ${nightShift.map(name => `<span class="bg-blue-500/5 px-3 py-1 rounded-lg text-blue-400 border border-blue-500/10 text-xs font-bold whitespace-nowrap">${name}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function renderSchedule(monthName) {
    const display = document.getElementById('current-month-display');
    const viewport = document.getElementById('schedule-viewport');
    if(display) display.textContent = monthName + " 2026";
    if(!viewport) return;

    localStorage.setItem('lastSelectedMonth', monthName);

    const data = scheduleData[monthName];
    if (!data) {
        viewport.innerHTML = `<div class="py-20 text-center opacity-20 font-black uppercase">Нет данных</div>`;
        return;
    }

    const today = new Date();
    const currentMonthName = getMonthName(today.getMonth());
    const isCurrent = (monthName === currentMonthName);
    const curDay = today.getDate();
    const year = 2026;
    
    const daysInMonth = new Date(year, ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"].indexOf(monthName) + 1, 0).getDate();

    function isWeekendOrHoliday(day) {
        const date = new Date(year, ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"].indexOf(monthName), day);
        const dayOfWeek = date.getDay();
        const dateString = date.toISOString().split('T')[0];
        return (dayOfWeek === 0 || dayOfWeek === 6) || holidays2026.includes(dateString);
    }

    let html = `<table class="schedule-table"><thead><tr><th class="col-name head-fio text-left pl-4">Ф.И.О.</th>`;
    for(let d=1; d<=daysInMonth; d++) {
        const isToday = isCurrent && d === curDay;
        const isHoliday = isWeekendOrHoliday(d);
        html += `<th class="${isToday ? 'today-header' : ''} ${isHoliday ? 'holiday-header' : ''}">${d}</th>`;
    }
    html += `<th class="col-stat">СМ.</th><th class="col-stat">ЧАС.</th></tr></thead><tbody>`;

    data.forEach(p => {
        let shiftsCount = 0, hours = 0;
        html += `<tr onclick="highlightRow(this)"><td class="col-name text-left pl-4 font-medium">${p.name}</td>`;
        for(let d=1; d<=daysInMonth; d++) {
            const s = p.shifts[d-1] || '';
            const isToday = isCurrent && d === curDay;
            const isHoliday = isWeekendOrHoliday(d);
            html += `<td class="shift-${s} ${isToday ? 'today-column' : ''} ${isHoliday ? 'holiday-column' : ''}"></td>`;
            if(['D', 'N', 'S'].includes(s)) { shiftsCount++; hours += (s === 'S' ? 8 : 12); }
        }
        html += `<td class="col-stat font-bold">${shiftsCount}</td><td class="col-stat font-bold">${hours}</td></tr>`;
    });
    
    viewport.innerHTML = html + `</tbody></table>`;

    if (isCurrent) {
        setTimeout(() => {
            const todayHeader = document.querySelector('.today-header');
            if (todayHeader) {
                todayHeader.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }, 100);
    }
}

function highlightRow(row) {
    const rows = document.querySelectorAll('.schedule-table tbody tr');
    const active = row.classList.contains('highlighted-row');
    rows.forEach(r => r.classList.remove('highlighted-row', 'blurred-row'));
    if (!active) {
        row.classList.add('highlighted-row');
        rows.forEach(r => { if (r !== row) r.classList.add('blurred-row'); });
    }
}

function openBlockModal(key) {
    const mData = blockData[key];
    const list = document.getElementById('instructions-list');
    const title = document.getElementById('modal-block-title');
    if (!mData || !list) return;

    title.textContent = mData.title;
    list.innerHTML = '';

    if (key === 'siemens_diag') {
        list.innerHTML = `
            <div class="mb-4">
                <input type="text" oninput="filterDiag(this.value)" placeholder="Поиск ошибки..." 
                       class="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none">
            </div>`;
    }

    if (!mData.items.length) {
        list.innerHTML += `<div class="py-20 text-center opacity-10 font-black uppercase text-[10px]">Раздел пуст</div>`;
    } else {
        mData.items.forEach(item => {
            const div = document.createElement('div');
            div.className = "diag-card mb-3";
            
            if (item.link) {
                const btnId = `share-${Math.random().toString(36).substr(2, 9)}`;
                div.innerHTML = `
                    <div class="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 active:scale-[0.98] transition-transform">
                        <div onclick="window.open('${item.link}', '_blank')" class="flex-1 cursor-pointer">
                            <span class="font-bold text-sm block">${item.title}</span>
                            <span class="text-[9px] opacity-40 uppercase font-black">Открыть документ</span>
                        </div>
                        <button id="${btnId}" class="ml-2 px-4 py-2 bg-blue-500/10 text-blue-500 rounded-xl text-[10px] font-black uppercase">Сохранить</button>
                    </div>`;
                
                list.appendChild(div);
                const shareBtn = div.querySelector(`#${btnId}`);
                shareBtn.onclick = async () => {
                    if (navigator.share) {
                        try {
                            await navigator.share({ title: item.title, url: item.link });
                        } catch (err) {
                            if (err.name !== 'AbortError') window.open(item.link, '_blank');
                        }
                    } else {
                        window.open(item.link, '_blank');
                    }
                };
            } else {
                div.innerHTML = `
                    <div class="p-5 bg-white/5 rounded-[2rem] border border-white/5">
                        <div class="text-blue-500 font-black text-[10px] uppercase mb-1">${item.title}</div>
                        <div class="text-sm opacity-80 leading-relaxed">${item.desc}</div>
                    </div>`;
                list.appendChild(div);
            }
        });
    }
    document.getElementById('block-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function filterDiag(val) {
    const q = val.toLowerCase();
    document.querySelectorAll('.diag-card').forEach(c => {
        c.style.display = c.innerText.toLowerCase().includes(q) ? 'block' : 'none';
    });
}

function closeBlockModal() {
    document.getElementById('block-modal').classList.add('hidden');
    document.body.style.overflow = '';
}

// ==================== ТЕСТИРОВАНИЕ ====================
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Показать экран выбора режима для выбранного теста
function showModeSelector() {
    document.getElementById('test-list-screen').classList.add('hidden');
    document.getElementById('test-mode-selector').classList.remove('hidden');
    document.getElementById('test-runner').classList.add('hidden');
    document.getElementById('test-results').classList.add('hidden');
}

// Вернуться к списку тестов
function backToTestList() {
    document.getElementById('test-list-screen').classList.remove('hidden');
    document.getElementById('test-mode-selector').classList.add('hidden');
    document.getElementById('test-runner').classList.add('hidden');
    document.getElementById('test-results').classList.add('hidden');
}

function startExamMode() {
    testMode = 'exam';
    const shuffled = shuffleArray([...selectedTestQuestions]);
    currentQuestions = shuffled.slice(0, 20);
    userAnswers = {};
    currentIndex = 0;
    testFinished = false;
    showTestRunner();
    renderQuestion();
}

function startAllMode() {
    testMode = 'all';
    currentQuestions = [...selectedTestQuestions];
    userAnswers = {};
    currentIndex = 0;
    testFinished = false;
    showTestRunner();
    renderQuestion();
}

function showTestRunner() {
    document.getElementById('test-list-screen').classList.add('hidden');
    document.getElementById('test-mode-selector').classList.add('hidden');
    document.getElementById('test-runner').classList.remove('hidden');
    document.getElementById('test-results').classList.add('hidden');
    document.getElementById('total-q-num').textContent = currentQuestions.length;
    updateProgress();
}

function exitTest() {
    if (confirm('Выйти из теста? Прогресс будет потерян.')) {
        document.getElementById('test-mode-selector').classList.remove('hidden');
        document.getElementById('test-runner').classList.add('hidden');
        document.getElementById('test-results').classList.add('hidden');
    }
}

function renderQuestion() {
    const q = currentQuestions[currentIndex];
    if (!q) return;
    
    document.getElementById('current-q-num').textContent = currentIndex + 1;
    document.getElementById('question-id-display').textContent = q.id;
    document.getElementById('question-text').textContent = q.text;
    
    // Подсказка о количестве правильных ответов
    const hintEl = document.getElementById('multiple-hint');
    if (q.multiple) {
        const count = q.correct.length;
        hintEl.textContent = `Выберите ${count} верных ${count === 1 ? 'утверждение' : (count < 5 ? 'утверждения' : 'утверждений')}`;
    } else {
        hintEl.textContent = '';
    }
    
    const container = document.getElementById('options-container');
    const saved = userAnswers[q.id] || [];
    const isMultiple = q.multiple;
    
    let html = '';
    q.options.forEach((opt, idx) => {
        const checked = saved.includes(idx) ? 'checked' : '';
        if (isMultiple) {
            html += `
                <label class="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer">
                    <input type="checkbox" name="option" value="${idx}" ${checked} class="mt-1">
                    <span class="text-sm">${opt}</span>
                </label>
            `;
        } else {
            html += `
                <label class="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer">
                    <input type="radio" name="option" value="${idx}" ${checked} class="mt-1">
                    <span class="text-sm">${opt}</span>
                </label>
            `;
        }
    });
    container.innerHTML = html;
    
    if (testMode === 'all' && userAnswers[q.id] !== undefined) {
        highlightAnswers(q);
    }
    if (testMode === 'review') {
        highlightAnswers(q);
    }
    
    document.getElementById('prev-question').disabled = (currentIndex === 0);
    const nextBtn = document.getElementById('next-question');
    const finishBtn = document.getElementById('finish-test');
    
    if (currentIndex === currentQuestions.length - 1) {
        nextBtn.classList.add('hidden');
        finishBtn.classList.remove('hidden');
    } else {
        nextBtn.classList.remove('hidden');
        finishBtn.classList.add('hidden');
    }
    
    updateProgress();
}

function highlightAnswers(q) {
    const selected = userAnswers[q.id] || [];
    const container = document.getElementById('options-container');
    const labels = container.querySelectorAll('label');
    labels.forEach((label, idx) => {
        const isCorrect = q.correct.includes(idx);
        const isSelected = selected.includes(idx);
        label.classList.remove('correct-answer', 'wrong-answer');
        if (isSelected) {
            label.classList.add(isCorrect ? 'correct-answer' : 'wrong-answer');
        } else if (isCorrect && (testMode === 'all' || testMode === 'review')) {
            label.classList.add('correct-answer');
        }
    });
}

function saveCurrentAnswer() {
    const q = currentQuestions[currentIndex];
    const container = document.getElementById('options-container');
    const inputs = container.querySelectorAll('input[type="checkbox"], input[type="radio"]');
    const selected = [];
    inputs.forEach(input => {
        if (input.checked) selected.push(parseInt(input.value));
    });
    userAnswers[q.id] = selected;
    
    if (testMode === 'all' || testMode === 'review') {
        highlightAnswers(q);
    }
}

function nextQuestion() {
    saveCurrentAnswer();
    if (currentIndex < currentQuestions.length - 1) {
        currentIndex++;
        renderQuestion();
    }
}

function prevQuestion() {
    saveCurrentAnswer();
    if (currentIndex > 0) {
        currentIndex--;
        renderQuestion();
    }
}

function finishTest() {
    saveCurrentAnswer();
    testFinished = true;
    
    if (testMode === 'exam') {
        let correctCount = 0;
        const mistakes = [];
        currentQuestions.forEach(q => {
            const selected = userAnswers[q.id] || [];
            const isCorrect = arraysEqual(selected.sort(), q.correct.sort());
            if (isCorrect) correctCount++;
            else mistakes.push(q.id);
        });
        const total = currentQuestions.length;
        const wrongCount = total - correctCount;
        const passed = wrongCount <= 2;
        
        showExamResult(passed, correctCount, total, mistakes);
    } else {
        backToTestList();
    }
}

function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function showExamResult(passed, correct, total, mistakes) {
    document.getElementById('test-runner').classList.add('hidden');
    const resultsDiv = document.getElementById('test-results');
    resultsDiv.classList.remove('hidden');
    
    const icon = document.getElementById('result-icon');
    const title = document.getElementById('result-title');
    const details = document.getElementById('result-details');
    
    if (passed) {
        icon.textContent = '✅';
        title.textContent = 'Экзамен сдан!';
        title.className = 'text-2xl font-black uppercase tracking-tight mb-2 text-emerald-500';
    } else {
        icon.textContent = '❌';
        title.textContent = 'Экзамен не сдан';
        title.className = 'text-2xl font-black uppercase tracking-tight mb-2 text-red-500';
    }
    details.textContent = `Правильных: ${correct} из ${total}. Ошибок: ${total - correct} (допустимо 2).`;
    
    const reviewBtn = document.getElementById('review-mistakes');
    if (mistakes.length > 0) {
        reviewBtn.classList.remove('hidden');
        reviewBtn.onclick = () => showMistakesReview(mistakes);
    } else {
        reviewBtn.classList.add('hidden');
    }
}

function showMistakesReview(mistakeIds) {
    currentQuestions = currentQuestions.filter(q => mistakeIds.includes(q.id));
    currentIndex = 0;
    testMode = 'review';
    showTestRunner();
    renderQuestion();
}

function updateProgress() {
    const progress = ((currentIndex + 1) / currentQuestions.length) * 100;
    document.getElementById('test-progress').style.width = progress + '%';
}

// ==================== SERVICE WORKER ====================
function showUpdateToast(worker) {
    const toast = document.querySelector('.update-toast');
    if (!toast) return;

    toast.innerHTML = `
        <div class="text-lg mb-2">✨ Доступна новая версия</div>
        <div class="text-sm opacity-60 mb-4">Обновите приложение для улучшения работы</div>
        <button class="update-action-btn">Обновить сейчас</button>
    `;
    const btn = toast.querySelector('.update-action-btn');
    
    toast.classList.add('show');
    btn.onclick = () => {
        btn.classList.add('loading');
        btn.innerHTML = '<span class="animate-spin">🔄</span> Обновление...';
        worker.postMessage({ action: 'skipWaiting' });
    };
}

function manualCheckForUpdates() {
    if (!('serviceWorker' in navigator)) return;
    
    navigator.serviceWorker.getRegistration().then(reg => {
        if (!reg) return;
        
        const toast = document.querySelector('.update-toast');
        if (toast) {
            toast.innerHTML = `
                <div class="flex flex-col items-center">
                    <span class="text-3xl mb-2">🔍</span>
                    <div class="text-sm font-medium">Проверка обновлений...</div>
                </div>
            `;
            toast.classList.add('show');
        }
        
        reg.update().then(() => {
            setTimeout(() => {
                if (reg.waiting) {
                    showUpdateToast(reg.waiting);
                } else if (reg.installing) {
                    reg.installing.addEventListener('statechange', function onStateChange() {
                        if (this.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdateToast(this);
                            this.removeEventListener('statechange', onStateChange);
                        }
                    });
                } else {
                    if (toast) {
                        toast.innerHTML = `
                            <div class="flex flex-col items-center">
                                <div class="text-sm font-medium mb-4">У вас установлена последняя версия приложения</div>
                                <button class="update-action-btn">Понятно</button>
                            </div>
                        `;
                        const okBtn = toast.querySelector('.update-action-btn');
                        okBtn.onclick = () => toast.classList.remove('show');
                        setTimeout(() => toast.classList.remove('show'), 3000);
                    }
                }
            }, 500);
        });
    });
}

if ('serviceWorker' in navigator) {
    let refreshing = false;
    
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
    });

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            setInterval(() => reg.update(), 1000 * 60 * 10);
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) reg.update();
            });

            if (reg.waiting) {
                showUpdateToast(reg.waiting);
            }

            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', function onStateChange() {
                    if (this.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateToast(this);
                        this.removeEventListener('statechange', onStateChange);
                    }
                });
            });
        });

        const toast = document.querySelector('.update-toast');
        if (toast && !navigator.serviceWorker.controller) {
            toast.classList.remove('show');
        }
    });
}

window.checkForUpdates = manualCheckForUpdates;

window.onload = () => {
    if(localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');
    
    updateCurrentDateDisplay();
    updateOnDutyWidget();
    updateVersionNumber();
    
    const savedMonth = localStorage.getItem('lastSelectedMonth');
    const monthSelector = document.getElementById('month-selector');
    if (savedMonth && monthSelector) {
        monthSelector.value = savedMonth;
    }
    
    switchTab(0);
    
    const checkBtn = document.getElementById('manual-update-check');
    if (checkBtn) {
        checkBtn.addEventListener('click', manualCheckForUpdates);
    }

    // Обработчики тестов
    document.getElementById('pte-test-btn').addEventListener('click', () => {
        selectedTestQuestions = allQuestions; // Пока только один тест
        showModeSelector();
    });
    document.getElementById('back-to-test-list').addEventListener('click', backToTestList);
    document.getElementById('start-exam-mode').addEventListener('click', startExamMode);
    document.getElementById('start-all-mode').addEventListener('click', startAllMode);
    document.getElementById('exit-test').addEventListener('click', exitTest);
    document.getElementById('prev-question').addEventListener('click', prevQuestion);
    document.getElementById('next-question').addEventListener('click', nextQuestion);
    document.getElementById('finish-test').addEventListener('click', finishTest);
    document.getElementById('back-to-mode').addEventListener('click', () => {
        document.getElementById('test-results').classList.add('hidden');
        showModeSelector();
    });
    document.getElementById('review-mistakes').addEventListener('click', () => {
        // Уже настроено в showExamResult
    });
};
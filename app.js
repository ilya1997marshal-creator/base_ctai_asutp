/**
 * ЦТАИ АСУ ТП - Основной скрипт
 */

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ТЕСТОВ ====================
let testMode = null;
let currentQuestions = [];
let userAnswers = {};
let currentIndex = 0;
let testFinished = false;
let selectedTestQuestions = allQuestions;
let answerRevealed = false;
let lastExamQuestions = [];

// ==================== ПОЛЬЗОВАТЕЛЬ И ПРОГРЕСС ====================
let currentUser = null;
let accessGranted = false;

const EXCLUDED_USERS = ['Куштанов К.А.'];

function getUniqueUsers() {
    const users = new Set();
    for (const month in scheduleData) {
        scheduleData[month].forEach(p => {
            if (!EXCLUDED_USERS.includes(p.name)) {
                users.add(p.name);
            }
        });
    }
    return ['Ученик', ...Array.from(users)];
}

function loadCurrentUser() {
    const saved = localStorage.getItem('ctai_current_user');
    if (saved) {
        currentUser = saved;
        document.getElementById('current-user-name').textContent = currentUser;
        updateProgressBars();
    }
}

function selectUser(name) {
    currentUser = name;
    localStorage.setItem('ctai_current_user', name);
    document.getElementById('current-user-name').textContent = name;
    document.getElementById('user-select-modal').classList.add('hidden');
    document.body.style.overflow = '';
    updateProgressBars();
}

function cancelUserSelection() {
    document.getElementById('user-select-modal').classList.add('hidden');
    document.body.style.overflow = '';
    if (!currentUser) {
        switchTab(0);
    }
}

function openUserSelection() {
    const list = document.getElementById('user-list-container');
    const uniqueUsers = getUniqueUsers();
    list.innerHTML = '';

    const studentDiv = document.createElement('div');
    studentDiv.style.marginBottom = '14px';
    const studentBtn = document.createElement('button');
    studentBtn.className = 'user-btn';
    studentBtn.style.width = '100%';
    studentBtn.textContent = 'Ученик';
    studentBtn.onclick = () => selectUser('Ученик');
    studentDiv.appendChild(studentBtn);
    list.appendChild(studentDiv);

    const grid = document.createElement('div');
    grid.className = 'user-grid';
    uniqueUsers.forEach(name => {
        if (name === 'Ученик') return;
        const btn = document.createElement('button');
        btn.textContent = name;
        btn.className = 'user-btn';
        btn.onclick = () => selectUser(name);
        grid.appendChild(btn);
    });
    list.appendChild(grid);

    document.getElementById('user-select-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function saveTestResult(testKey, mode, correct, total) {
    if (!currentUser || currentUser === 'Ученик') return;
    const storageKey = `ctai_progress_${currentUser}`;
    let data = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (!data[testKey]) data[testKey] = [];
    data[testKey].push({
        date: new Date().toISOString(),
        mode,
        correct,
        total,
        percent: Math.round((correct / total) * 100)
    });
    localStorage.setItem(storageKey, JSON.stringify(data));
    updateProgressBars();
}

function getProgressPercent(testKey) {
    if (!currentUser || currentUser === 'Ученик') return null;
    const storageKey = `ctai_progress_${currentUser}`;
    const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const attempts = data[testKey];
    if (!attempts || attempts.length === 0) return null;
    const avg = attempts.reduce((sum, a) => sum + a.percent, 0) / attempts.length;
    return Math.round(avg);
}

function updateProgressBars() {
    const tests = ['pte', 'fire', 'labor'];
    tests.forEach(key => {
        const bar = document.getElementById(`${key}-progress-bar`);
        const text = document.getElementById(`${key}-progress-text`);
        if (!bar || !text) return;
        const percent = getProgressPercent(key);
        if (percent !== null) {
            bar.style.width = percent + '%';
            text.textContent = percent + '%';
        } else {
            bar.style.width = '0%';
            text.textContent = 'Нет попыток';
        }
    });
}

// ==================== ВИДЖЕТ ДНЕЙ ДО ЗАРПЛАТЫ ====================
function getNearestPayday(dayOfMonth) {
    const now = getNowKrasnoyarsk();
    let year = now.getFullYear();
    let month = now.getMonth();

    let date = new Date(year, month, dayOfMonth);
    if (date <= now) {
        month++;
        if (month > 11) {
            month = 0;
            year++;
        }
        date = new Date(year, month, dayOfMonth);
    }

    const dayOfWeek = date.getDay();
    if (dayOfWeek === 6) {
        date.setDate(date.getDate() - 1);
    } else if (dayOfWeek === 0) {
        date.setDate(date.getDate() - 2);
    }

    return date;
}

function updateSalaryWidget() {
    const salaryDate = getNearestPayday(10);
    const advanceDate = getNearestPayday(25);
    const now = getNowKrasnoyarsk();

    const daysToSalary = Math.ceil((salaryDate - now) / (1000 * 60 * 60 * 24));
    const daysToAdvance = Math.ceil((advanceDate - now) / (1000 * 60 * 60 * 24));

    const salaryStr = daysToSalary === 0 ? 'Сегодня' : `через ${daysToSalary} дн.`;
    const advanceStr = daysToAdvance === 0 ? 'Сегодня' : `через ${daysToAdvance} дн.`;

    const widget = document.getElementById('salary-widget');
    if (widget) {
        widget.innerHTML = `
            <span class="metric"><span class="metric-k">Зарплата</span><span class="metric-v">${salaryStr}</span></span>
            <span class="metric"><span class="metric-k">Аванс</span><span class="metric-v">${advanceStr}</span></span>
        `;
    }
}

// ==================== ОСНОВНЫЕ ФУНКЦИИ ====================
function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

function switchTab(index) {
    if (index === 4 && !accessGranted) {
        document.getElementById('access-password-modal').classList.remove('hidden');
        document.getElementById('access-password-input').value = '';
        document.getElementById('access-password-error').classList.add('hidden');
        document.body.style.overflow = 'hidden';
        return;
    }

    const tabs = ['tab-home', 'tab-schedule', 'tab-tests', 'tab-tools', 'tab-access', 'tab-help'];
    tabs.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('active', i === index);
    });
    
    document.querySelectorAll('.nav-item').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });

    if (window.dockSync) window.dockSync(index);

    if(index === 0) { updateOnDutyWidget(); updateCurrentDateDisplay(); updateSalaryWidget(); updateDutyClock(); }
    if(index === 1) {
        renderSchedule(document.getElementById('month-selector').value);
    }
    if(index === 2) {
        if (!currentUser) {
            openUserSelection();
        } else {
            updateProgressBars();
        }
    }
    if(index === 3) {
        showToolsList();
    }
    if(index === 4) renderCredentials();
    if(index === 5) updateVersionNumber(); 
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function checkAccessPassword() {
    const input = document.getElementById('access-password-input');
    const error = document.getElementById('access-password-error');
    if (input.value === '8888') {
        accessGranted = true;
        document.getElementById('access-password-modal').classList.add('hidden');
        document.body.style.overflow = '';
        switchTab(4);
    } else {
        error.classList.remove('hidden');
        input.value = '';
    }
}

function cancelAccessPassword() {
    document.getElementById('access-password-modal').classList.add('hidden');
    document.body.style.overflow = '';
    switchTab(0);
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
                verElement.textContent = "V86"; 
            }
        }
    } catch (e) {
        verElement.textContent = "V86";
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
    dateEl.textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

// ==================== ЖИВОЙ ВИДЖЕТ «НА СМЕНЕ» ====================
function getNowKrasnoyarsk() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 7));
}

function updateDutyClock() {
    const el = document.getElementById('duty-clock');
    if (!el) return;
    const now = getNowKrasnoyarsk();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    el.textContent = `${hh}:${mm} Крск`;
}

function updateOnDutyWidget() {
    const dutyList = document.getElementById('duty-list');
    if (!dutyList) return;

    const now = getNowKrasnoyarsk();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinutes;

    const monthName = getMonthName(currentMonth);
    const monthData = scheduleData[monthName];
    
    if (!monthData) {
        dutyList.innerHTML = '<div class="duty-empty">Нет данных за этот месяц</div>';
        return;
    }

    function getShift(person, day) {
        const idx = day - 1;
        if (idx < 0 || idx >= person.shifts.length) return '';
        return person.shifts[idx] || '';
    }

    function isDayShiftActive(shiftType) {
        const startMinutes = 8 * 60;
        let endMinutes;
        switch (shiftType) {
            case 'A': endMinutes = 16 * 60; break;
            case 'B': endMinutes = 13 * 60; break;
            case 'C': endMinutes = 18 * 60; break;
            default:  endMinutes = 20 * 60; break;
        }
        return currentTotalMinutes >= startMinutes && currentTotalMinutes < endMinutes;
    }

    const dayShiftNames = [];
    const nightShiftNames = [];
    const upcomingDayNames = [];
    const upcomingNightNames = [];

    monthData.forEach(person => {
        let nightActive = false;
        if (currentTotalMinutes >= 20 * 60) {
            if (getShift(person, currentDay) === 'N') {
                nightActive = true;
            }
        } else if (currentTotalMinutes < 8 * 60) {
            const yesterday = new Date(now);
            yesterday.setDate(currentDay - 1);
            const yesterdayDay = yesterday.getDate();
            if (getShift(person, yesterdayDay) === 'N') {
                nightActive = true;
            }
        }

        if (nightActive) {
            nightShiftNames.push(person.name.split(' ')[0]);
        }

        const shift = getShift(person, currentDay);
        const dayTypes = ['D', 'S', 'A', 'B', 'C'];
        if (dayTypes.includes(shift)) {
            if (isDayShiftActive(shift)) {
                dayShiftNames.push(person.name.split(' ')[0]);
            } else if (currentTotalMinutes >= 6 * 60 && currentTotalMinutes < 8 * 60) {
                upcomingDayNames.push(person.name.split(' ')[0]);
            }
        }

        if (currentTotalMinutes >= 18 * 60 && currentTotalMinutes < 20 * 60) {
            if (getShift(person, currentDay) === 'N' && !nightShiftNames.includes(person.name.split(' ')[0])) {
                upcomingNightNames.push(person.name.split(' ')[0]);
            }
        }
    });

    if (dayShiftNames.length === 0 && nightShiftNames.length === 0 && upcomingDayNames.length === 0 && upcomingNightNames.length === 0) {
        dutyList.innerHTML = '<div class="duty-empty">Никого нет на смене</div>';
        return;
    }

    const group = (label, names, kind) => `
        <div class="duty-group">
            <div class="duty-group-label"><i class="tick ${kind}"></i>${label}</div>
            <div class="duty-names">${names.join(', ')}</div>
        </div>`;

    let html = '<div class="duty-groups">';
    if (dayShiftNames.length > 0) html += group('День', dayShiftNames, '');
    if (nightShiftNames.length > 0) html += group('Ночь', nightShiftNames, 'night');
    if (upcomingDayNames.length > 0) html += group('День, скоро', upcomingDayNames, 'soon');
    if (upcomingNightNames.length > 0) html += group('Ночь, скоро', upcomingNightNames, 'night soon');
    html += '</div>';
    dutyList.innerHTML = html;
}

// ==================== ГРАФИК С ВЫДЕЛЕНИЕМ СТРОК И СТОЛБЦОВ ====================
let selectedRows = new Set();
let selectedCols = new Set();

function toggleRow(index) {
    if (selectedRows.has(index)) {
        selectedRows.delete(index);
    } else {
        selectedRows.add(index);
    }
    applySelectionStyles();
    updateClearButton();
}

function toggleCol(day) {
    const colIndex = day - 1;
    if (selectedCols.has(colIndex)) {
        selectedCols.delete(colIndex);
    } else {
        selectedCols.add(colIndex);
    }
    applySelectionStyles();
    updateClearButton();
}

function clearSelection() {
    selectedRows.clear();
    selectedCols.clear();
    applySelectionStyles();
    updateClearButton();
}

function updateClearButton() {
    const btn = document.getElementById('clear-selection-btn');
    if (!btn) return;
    if (selectedRows.size > 0 || selectedCols.size > 0) {
        btn.classList.add('show');
    } else {
        btn.classList.remove('show');
    }
}

function applySelectionStyles() {
    const container = document.getElementById('schedule-viewport');
    if (!container) return;
    
    const fixedRows = container.querySelectorAll('.schedule-fixed tbody tr');
    const scrollRows = container.querySelectorAll('.schedule-scroll tbody tr');
    const headerCells = container.querySelectorAll('.schedule-scroll thead th');
    
    // Сброс всех классов выделения
    fixedRows.forEach(row => row.classList.remove('highlighted-row', 'blurred-row'));
    scrollRows.forEach(row => row.classList.remove('highlighted-row', 'blurred-row'));
    headerCells.forEach(th => th.classList.remove('highlighted-col', 'blurred-col'));
    scrollRows.forEach(row => {
        row.querySelectorAll('td').forEach(td => {
            td.classList.remove('highlighted-col', 'blurred-col');
        });
    });
    
    const allRows = [...fixedRows, ...scrollRows];
    const daysCount = headerCells.length - 2;
    
    // Применяем выделение строк
    allRows.forEach(row => {
        const idx = parseInt(row.dataset.rowIndex, 10);
        if (isNaN(idx)) return;
        if (selectedRows.has(idx)) {
            row.classList.add('highlighted-row');
        } else if (selectedRows.size > 0) {
            row.classList.add('blurred-row');
        }
    });
    
    // Применяем выделение столбцов
    if (selectedCols.size > 0) {
        headerCells.forEach((th, index) => {
            if (index >= daysCount) return;
            const colIdx = index;
            th.classList.add(selectedCols.has(colIdx) ? 'highlighted-col' : 'blurred-col');
        });
        scrollRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((td, cellIndex) => {
                if (cellIndex >= daysCount) return;
                const colIdx = cellIndex;
                td.classList.add(selectedCols.has(colIdx) ? 'highlighted-col' : 'blurred-col');
            });
        });
    }
}

function attachScheduleEvents() {
    const viewport = document.getElementById('schedule-viewport');
    if (!viewport) return;

    const fixedRows = viewport.querySelectorAll('.schedule-fixed tbody tr');
    const scrollRows = viewport.querySelectorAll('.schedule-scroll tbody tr');

    function addRowClick(row) {
        const idx = parseInt(row.dataset.rowIndex, 10);
        if (isNaN(idx)) return;
        row.addEventListener('click', (e) => {
            if (e.target.tagName === 'TH') return;
            toggleRow(idx);
        });
    }

    fixedRows.forEach(addRowClick);
    scrollRows.forEach(addRowClick);

    const headerCells = viewport.querySelectorAll('.schedule-scroll thead th');
    const daysCount = headerCells.length - 2;

    headerCells.forEach((th, index) => {
        if (index >= daysCount) return;
        const day = index + 1;
        th.addEventListener('click', (e) => {
            toggleCol(day);
        });
    });
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

    const hourMap = { 'A': '8', 'B': '5', 'C': '10' };

    clearSelection();

    let fixedHtml = `<div class="schedule-fixed"><table class="schedule-table"><thead><tr><th class="col-name head-fio">Ф.И.О.</th></tr></thead><tbody>`;
    data.forEach((p, idx) => {
        fixedHtml += `<tr data-row-index="${idx}"><td class="col-name text-center font-medium">${p.name}</td></tr>`;
    });
    fixedHtml += `</tbody></table></div>`;

    let scrollHtml = `<div class="schedule-scroll"><table class="schedule-table"><thead><tr>`;
    for(let d=1; d<=daysInMonth; d++) {
        const isToday = isCurrent && d === curDay;
        const isHoliday = isWeekendOrHoliday(d);
        scrollHtml += `<th class="${isToday ? 'today-header' : ''} ${isHoliday ? 'holiday-header' : ''}">${d}</th>`;
    }
    scrollHtml += `<th class="col-stat">СМ.</th><th class="col-stat">ЧАС.</th></tr></thead><tbody>`;

    data.forEach((p, idx) => {
        let shiftsCount = 0, hours = 0;
        scrollHtml += `<tr data-row-index="${idx}">`;
        for(let d=1; d<=daysInMonth; d++) {
            const s = p.shifts[d-1] || '';
            const isToday = isCurrent && d === curDay;
            const isHoliday = isWeekendOrHoliday(d);

            // === НОВЫЙ БЛОК: обработка больничного ===
            if (s === 'Б') {
                scrollHtml += `<td class="shift-Б ${isToday ? 'today-column' : ''} ${isHoliday ? 'holiday-column' : ''}">Б</td>`;
            } else if (s === 'ПХ') {
                // ПХ из графика: не смена, в кол-во смен и часы не входит
                scrollHtml += `<td class="shift-ПХ ${isToday ? 'today-column' : ''} ${isHoliday ? 'holiday-column' : ''}">ПХ</td>`;
            } else if (hourMap[s]) {
                scrollHtml += `<td class="shift-D ${isToday ? 'today-column' : ''} ${isHoliday ? 'holiday-column' : ''}"><span class="hour-num">${hourMap[s]}</span></td>`;
            } else {
                scrollHtml += `<td class="shift-${s} ${isToday ? 'today-column' : ''} ${isHoliday ? 'holiday-column' : ''}"></td>`;
            }

            if(['D', 'N', 'S', 'A', 'B', 'C'].includes(s)) {
                shiftsCount++;
                if (s === 'S') hours += 12;
                else if (s === 'A') hours += 8;
                else if (s === 'B') hours += 5;
                else if (s === 'C') hours += 10;
                else hours += 12;
            }
        }
        scrollHtml += `<td class="col-stat font-bold">${shiftsCount}</td><td class="col-stat font-bold">${hours}</td></tr>`;
    });
    scrollHtml += `</tbody></table></div>`;

    viewport.innerHTML = fixedHtml + scrollHtml;

    attachScheduleEvents();

    const fixedRows = viewport.querySelectorAll('.schedule-fixed tbody tr');
    const scrollRows = viewport.querySelectorAll('.schedule-scroll tbody tr');
    fixedRows.forEach((row, i) => {
        if (scrollRows[i]) {
            row.style.height = scrollRows[i].offsetHeight + 'px';
        }
    });

    if (isCurrent) {
        setTimeout(() => {
            const todayHeader = viewport.querySelector('.today-header');
            if (todayHeader) {
                todayHeader.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }, 100);
    }
    
    applySelectionStyles();
}

// ==================== БЛОКИ И ДИАГНОСТИКА ====================
function openBlockModal(key) {
    const mData = blockData[key];
    const list = document.getElementById('instructions-list');
    const title = document.getElementById('modal-block-title');
    if (!mData || !list) return;

    title.textContent = mData.title;
    list.innerHTML = '';

    if (key === 'siemens_diag') {
        list.innerHTML = `
            <div style="padding-bottom:12px">
                <input type="text" oninput="filterDiag(this.value)" placeholder="Поиск по коду или описанию" class="input">
            </div>
        `;
    }

    if (!mData.items.length) {
        list.innerHTML += `<div class="duty-empty" style="padding:36px 0;text-align:center">Раздел пока пуст</div>`;
    } else {
        let groupContainer = null;

        mData.items.forEach(item => {
            if (item.type === 'header') {
                const header = document.createElement('div');
                header.innerHTML = `<h4>${item.title}</h4>`;
                list.appendChild(header);

                groupContainer = document.createElement('div');
                groupContainer.className = 'diag-group';
                list.appendChild(groupContainer);
            } else if (item.type === 'item' || item.code) {
                const div = document.createElement('div');
                div.className = "diag-card";

                const tone = item.color === 'orange' ? 'orange' : (item.color === 'yellow' ? 'yellow' : 'red');
                div.innerHTML = `
                    <div class="diag-top">
                        <span class="diag-code ${tone}">${item.code}</span>
                        <div style="flex:1;min-width:0">
                            <div class="diag-desc">${item.desc}</div>
                            <span class="diag-act">${item.action}</span>
                        </div>
                    </div>
                `;
                
                if (groupContainer) {
                    groupContainer.appendChild(div);
                } else {
                    list.appendChild(div);
                }
            } else {
                const div = document.createElement('div');
                div.className = "doc-row";
                if (item.link) {
                    const btnId = `share-${Math.random().toString(36).substr(2, 9)}`;
                    div.innerHTML = `
                        <button class="doc-open" onclick="window.open('${item.link}', '_blank')">
                            <span class="row-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3.5h6.5V10"/><path d="M20.5 3.5 11 13"/><path d="M18 14v5.5a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1H11"/></svg></span>
                            <span class="row-main"><span class="doc-title">${item.title}</span><span class="doc-note">PDF, открыть</span></span>
                        </button>
                        <button id="${btnId}" class="ghost-btn">Поделиться</button>`;
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
                    div.className = "diag-card";
                    div.innerHTML = `
                        <div class="diag-code" style="display:inline-block;margin-bottom:8px">${item.title}</div>
                        <div class="diag-desc">${item.desc}</div>`;
                    list.appendChild(div);
                }
            }
        });
    }

    const scrollTopBtn = document.createElement('div');
    scrollTopBtn.className = 'modal-sticky-top';
    scrollTopBtn.innerHTML = '<button aria-label="Наверх"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 6-6 6 6"/></svg></button>';
    scrollTopBtn.onclick = (e) => {
        e.stopPropagation();
        list.scrollTo({ top: 0, behavior: 'smooth' });
    };
    list.insertBefore(scrollTopBtn, list.firstChild);

    const toggleScrollBtn = () => {
        if (list.scrollTop > 150) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    };
    list.addEventListener('scroll', toggleScrollBtn);
    list.scrollTop = 0;
    toggleScrollBtn();

    const modal = document.getElementById('block-modal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function filterDiag(val) {
    const q = val.toLowerCase();
    const cards = document.querySelectorAll('.diag-card');
    cards.forEach(c => {
        const text = c.innerText.toLowerCase();
        c.style.display = text.includes(q) ? 'block' : 'none';
    });
    const headers = document.querySelectorAll('#instructions-list h4');
    headers.forEach(header => {
        const groupContainer = header.nextElementSibling;
        if (groupContainer && groupContainer.classList.contains('diag-group')) {
            const visibleItems = Array.from(groupContainer.children).filter(child => child.style.display !== 'none');
            header.style.display = visibleItems.length > 0 ? 'block' : 'none';
            groupContainer.style.display = visibleItems.length > 0 ? 'block' : 'none';
        }
    });
}

function closeBlockModal() {
    const modal = document.getElementById('block-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

// ==================== ИНСТРУМЕНТЫ ====================
function showToolsList() {
    document.getElementById('tools-list-screen').classList.remove('hidden');
    document.getElementById('calc-4-20ma-screen').classList.add('hidden');
    document.getElementById('converter-screen').classList.add('hidden');
}

function openCalc4_20mA() {
    document.getElementById('tools-list-screen').classList.add('hidden');
    document.getElementById('calc-4-20ma-screen').classList.remove('hidden');
    document.getElementById('converter-screen').classList.add('hidden');
    updateUnitSelect();
    calcCurrentToValue();
}

function openConverter() {
    document.getElementById('tools-list-screen').classList.add('hidden');
    document.getElementById('calc-4-20ma-screen').classList.add('hidden');
    document.getElementById('converter-screen').classList.remove('hidden');
    updateConverterUnits();
    convertUnits();
}

const unitMap = {
    pressure: ['бар', 'МПа', 'кПа', 'кгс/см²', 'атм', 'Па', 'psi'],
    temperature: ['°C', '°F', 'K'],
    level: ['м', 'см', 'мм', '%'],
    flow: ['м³/ч', 'л/мин', 'л/с']
};

const unitConversion = {
    pressure: {
        'бар': 1,
        'МПа': 10,
        'кПа': 0.01,
        'кгс/см²': 0.980665,
        'атм': 1.01325,
        'Па': 0.00001,
        'psi': 0.0689476
    },
    temperature: {
        '°C': { toBase: (v) => v, fromBase: (v) => v, base: '°C' },
        '°F': { toBase: (v) => (v - 32) * 5/9, fromBase: (v) => v * 9/5 + 32, base: '°C' },
        'K': { toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15, base: '°C' }
    },
    level: {
        'м': 1,
        'см': 0.01,
        'мм': 0.001,
        '%': 0.01
    },
    flow: {
        'м³/ч': 1,
        'л/мин': 0.06,
        'л/с': 3.6
    }
};

function onCalcUnitTypeChange() {
    updateUnitSelect();
    calcCurrentToValue();
}

function updateUnitSelect() {
    const type = document.getElementById('calc-unit-type').value;
    const units = unitMap[type] || ['ед.'];
    const select = document.getElementById('calc-unit-select');
    select.innerHTML = '';
    units.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit;
        option.textContent = unit;
        select.appendChild(option);
    });
}

function updateConverterUnits() {
    const type = document.getElementById('conv-unit-type').value;
    const units = unitMap[type] || ['ед.'];
    const fromSelect = document.getElementById('conv-from-unit');
    const toSelect = document.getElementById('conv-to-unit');
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';
    units.forEach(unit => {
        const opt1 = document.createElement('option');
        opt1.value = unit;
        opt1.textContent = unit;
        const opt2 = opt1.cloneNode(true);
        fromSelect.appendChild(opt1);
        toSelect.appendChild(opt2);
    });
    if (units.length > 1) {
        toSelect.selectedIndex = 1;
    }
    convertUnits();
}

function convertUnits() {
    const type = document.getElementById('conv-unit-type').value;
    const value = parseFloat(document.getElementById('conv-value').value) || 0;
    const fromUnit = document.getElementById('conv-from-unit').value;
    const toUnit = document.getElementById('conv-to-unit').value;
    const resultInput = document.getElementById('conv-result');
    
    if (!fromUnit || !toUnit) {
        resultInput.value = '';
        return;
    }

    let result;
    const conversion = unitConversion[type];

    if (type === 'temperature') {
        const base = conversion[fromUnit].toBase(value);
        result = conversion[toUnit].fromBase(base);
    } else {
        const baseValue = value * (conversion[fromUnit] || 1);
        result = baseValue / (conversion[toUnit] || 1);
    }

    resultInput.value = parseFloat(result.toFixed(6));
}

function calcCurrentToValue() {
    const minVal = parseFloat(document.getElementById('calc-min-val').value) || 0;
    const maxVal = parseFloat(document.getElementById('calc-max-val').value) || 100;
    const current = parseFloat(document.getElementById('calc-current').value) || 4;
    const clampedCurrent = Math.min(20, Math.max(4, current));
    const value = minVal + (maxVal - minVal) * (clampedCurrent - 4) / 16;
    document.getElementById('calc-value').value = Math.round(value * 100) / 100;
    updateCalcResult();
}

function calcValueToCurrent() {
    const minVal = parseFloat(document.getElementById('calc-min-val').value) || 0;
    const maxVal = parseFloat(document.getElementById('calc-max-val').value) || 100;
    const value = parseFloat(document.getElementById('calc-value').value) || 0;
    const current = 4 + (16 * (value - minVal)) / (maxVal - minVal);
    document.getElementById('calc-current').value = Math.round(current * 100) / 100;
    updateCalcResult();
}

function updateCalcResult() {
    const current = parseFloat(document.getElementById('calc-current').value) || 0;
    const value = parseFloat(document.getElementById('calc-value').value) || 0;
    const unit = document.getElementById('calc-unit-select').value || '';
    const resEl = document.getElementById('calc-result');
    resEl.textContent = `${current.toFixed(2)} мА ↔ ${value.toFixed(2)} ${unit}`;
}

function copyCalcResult() {
    const current = parseFloat(document.getElementById('calc-current').value) || 0;
    const value = parseFloat(document.getElementById('calc-value').value) || 0;
    const unit = document.getElementById('calc-unit-select').value || '';
    const text = `${current.toFixed(2)} мА ↔ ${value.toFixed(2)} ${unit}`;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => alert('Результат скопирован'));
    } else {
        alert('Буфер обмена недоступен');
    }
}

function copyConvResult() {
    const result = document.getElementById('conv-result').value;
    if (result && navigator.clipboard) {
        navigator.clipboard.writeText(result).then(() => alert('Результат скопирован'));
    } else if (result) {
        alert('Буфер обмена недоступен');
    }
}

// ==================== ПОГОДА ====================
const WEATHER_CONFIG = {
    lat: 69.4865,
    lon: 88.3972,
    timezone: "Asia/Krasnoyarsk"
};

const weatherCodeMap = {
    0: "Ясно", 1: "Преимущественно ясно", 2: "Переменная облачность", 3: "Пасмурно",
    45: "Туман", 48: "Изморозь", 51: "Легкая морось", 53: "Морось", 55: "Сильная морось",
    56: "Легкая ледяная морось", 57: "Сильная ледяная морось", 61: "Небольшой дождь",
    63: "Дождь", 65: "Сильный дождь", 66: "Легкий ледяной дождь", 67: "Сильный ледяной дождь",
    71: "Небольшой снег", 73: "Снег", 75: "Сильный снегопад", 77: "Снежные зерна",
    80: "Небольшой ливень", 81: "Ливень", 82: "Сильный ливень",
    85: "Небольшой снегопад", 86: "Сильный снегопад", 95: "Гроза", 96: "Гроза с градом", 99: "Сильная гроза с градом"
};

async function fetchAndDisplayWeather() {
    const weatherEl = document.getElementById('weather-widget');
    if (!weatherEl) return;

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_CONFIG.lat}&longitude=${WEATHER_CONFIG.lon}&current=temperature_2m,weather_code&timezone=${WEATHER_CONFIG.timezone}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Ошибка сети');
        
        const data = await response.json();
        const current = data.current;
        
        const temp = Math.round(current.temperature_2m);
        const weatherCode = current.weather_code;
        const description = weatherCodeMap[weatherCode] || "";
        
        weatherEl.textContent = `${description}, ${temp}°C`;
    } catch (error) {
        console.error('Не удалось загрузить погоду:', error);
        weatherEl.textContent = '';
    }
}

function startWeatherUpdates() {
    fetchAndDisplayWeather();
    setInterval(fetchAndDisplayWeather, 15 * 60 * 1000);
}

// ==================== ТЕСТИРОВАНИЕ ====================
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function showModeSelector() {
    document.getElementById('test-list-screen').classList.add('hidden');
    document.getElementById('test-mode-selector').classList.remove('hidden');
    document.getElementById('test-runner').classList.add('hidden');
    document.getElementById('test-results').classList.add('hidden');
}

function backToTestList() {
    document.getElementById('test-list-screen').classList.remove('hidden');
    document.getElementById('test-mode-selector').classList.add('hidden');
    document.getElementById('test-runner').classList.add('hidden');
    document.getElementById('test-results').classList.add('hidden');
    updateProgressBars();
}

function startExamMode() {
    testMode = 'exam';
    const shuffled = shuffleArray([...selectedTestQuestions]);
    currentQuestions = shuffled.slice(0, 20);
    lastExamQuestions = [...currentQuestions];
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
        const disabledAttr = (testMode === 'all' && answerRevealed) || testMode === 'review' ? 'disabled' : '';
        const type = isMultiple ? 'checkbox' : 'radio';
        html += `
            <label>
                <input type="${type}" name="option" value="${idx}" ${checked} ${disabledAttr}>
                <span>${opt}</span>
            </label>
        `;
    });
    container.innerHTML = html;
    
    if (testMode === 'all' && answerRevealed) {
        highlightAnswers(q);
    }
    if (testMode === 'review') {
        highlightAnswers(q);
    }
    
    document.getElementById('prev-question').disabled = (currentIndex === 0);
    
    const nextBtn = document.getElementById('next-question');
    const finishBtn = document.getElementById('finish-test');
    
    if (testMode === 'all' && !answerRevealed) {
        nextBtn.textContent = 'Ответить →';
        nextBtn.onclick = () => revealAnswer();
    } else {
        nextBtn.textContent = 'Далее →';
        nextBtn.onclick = () => nextQuestion();
    }
    
    if (currentIndex === currentQuestions.length - 1) {
        nextBtn.classList.add('hidden');
        finishBtn.classList.remove('hidden');
        finishBtn.textContent = (testMode === 'all' && !answerRevealed) ? 'Завершить и показать результат' : 'Завершить тест';
        finishBtn.onclick = () => {
            if (testMode === 'all' && !answerRevealed) {
                revealAnswer();
            } else {
                finishTest();
            }
        };
    } else {
        nextBtn.classList.remove('hidden');
        finishBtn.classList.add('hidden');
    }
    
    updateProgress();
}

function revealAnswer() {
    const q = currentQuestions[currentIndex];
    saveCurrentAnswer();
    answerRevealed = true;
    highlightAnswers(q);
    
    const nextBtn = document.getElementById('next-question');
    const finishBtn = document.getElementById('finish-test');
    
    if (currentIndex === currentQuestions.length - 1) {
        nextBtn.classList.add('hidden');
        finishBtn.classList.remove('hidden');
        finishBtn.textContent = 'Завершить тест';
        finishBtn.onclick = () => finishTest();
    } else {
        nextBtn.classList.remove('hidden');
        finishBtn.classList.add('hidden');
        nextBtn.textContent = 'Далее →';
        nextBtn.onclick = () => nextQuestion();
    }
    
    const container = document.getElementById('options-container');
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => input.disabled = true);
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
}

function nextQuestion() {
    if (testMode === 'all') {
        answerRevealed = false;
    }
    saveCurrentAnswer();
    if (currentIndex < currentQuestions.length - 1) {
        currentIndex++;
        renderQuestion();
    }
}

function prevQuestion() {
    if (testMode === 'all') {
        answerRevealed = false;
    }
    saveCurrentAnswer();
    if (currentIndex > 0) {
        currentIndex--;
        renderQuestion();
    }
}

function finishTest() {
    saveCurrentAnswer();
    testFinished = true;
    
    if (testMode === 'exam' || testMode === 'all') {
        let correctCount = 0;
        const mistakes = [];
        currentQuestions.forEach(q => {
            const selected = userAnswers[q.id] || [];
            const isCorrect = arraysEqual(selected.sort(), q.correct.sort());
            if (isCorrect) correctCount++;
            else mistakes.push(q.id);
        });
        const total = currentQuestions.length;
        
        let testKey = 'pte';
        if (selectedTestQuestions === fireSafetyQuestions) testKey = 'fire';
        else if (selectedTestQuestions === laborProtectionQuestions) testKey = 'labor';
        
        saveTestResult(testKey, testMode, correctCount, total);
        
        if (testMode === 'exam') {
            const wrongCount = total - correctCount;
            const passed = wrongCount <= 2;
            showExamResult(passed, correctCount, total, mistakes);
        } else {
            backToTestList();
        }
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
    
    const okSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7"/></svg>';
    const failSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';

    icon.innerHTML = passed ? okSvg : failSvg;
    icon.className = 'result-icon ' + (passed ? 'ok' : 'fail');
    title.className = 'result-title';
    title.textContent = passed ? 'Экзамен сдан' : 'Экзамен не сдан';
    details.textContent = `Правильных ${correct} из ${total}. Ошибок ${total - correct}, допустимо 2.`;
    
    const reviewBtn = document.getElementById('review-mistakes');
    reviewBtn.textContent = 'Просмотреть ответы';
    reviewBtn.classList.remove('hidden');
    reviewBtn.onclick = showFullReview;
}

function showFullReview() {
    currentQuestions = lastExamQuestions;
    currentIndex = 0;
    testMode = 'review';
    showTestRunner();
    renderQuestion();
}

function updateProgress() {
    const progress = ((currentIndex + 1) / currentQuestions.length) * 100;
    document.getElementById('test-progress').style.width = progress + '%';
}

// ==================== ДОСТУП (КАТЕГОРИИ) ====================
let currentAccessCategory = null;

function openAccessCategory(category) {
    currentAccessCategory = category;
    document.getElementById('access-modal-title').textContent = category;
    document.getElementById('access-search').value = '';
    document.getElementById('access-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    renderAccessCategoryItems(category, '');
}

function closeAccessModal() {
    document.getElementById('access-modal').classList.add('hidden');
    document.body.style.overflow = '';
    currentAccessCategory = null;
}

function filterAccessCategory() {
    const searchQuery = document.getElementById('access-search').value.toLowerCase();
    renderAccessCategoryItems(currentAccessCategory, searchQuery);
}

function renderAccessCategoryItems(category, searchQuery) {
    const listEl = document.getElementById('access-category-list');
    if (!listEl) return;
    
    const allItems = credentialsData[category] || [];
    const filtered = allItems.filter(item => {
        if (!searchQuery) return true;
        const q = searchQuery;
        return (item.system && item.system.toLowerCase().includes(q)) ||
               (item.login && item.login.toLowerCase().includes(q)) ||
               (item.password && item.password.toLowerCase().includes(q)) ||
               (item.ip && item.ip.includes(q)) ||
               (item.location && item.location.toLowerCase().includes(q)) ||
               (item.description && item.description.toLowerCase().includes(q));
    });
    
    listEl.innerHTML = '';
    
    const scrollTopBtn = document.createElement('div');
    scrollTopBtn.className = 'modal-sticky-top';
    scrollTopBtn.innerHTML = '<button aria-label="Наверх"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 6-6 6 6"/></svg></button>';
    scrollTopBtn.onclick = (e) => {
        e.stopPropagation();
        listEl.scrollTo({ top: 0, behavior: 'smooth' });
    };
    listEl.appendChild(scrollTopBtn);

    if (filtered.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'duty-empty';
        emptyMsg.style.padding = '28px 0';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.textContent = 'Ничего не найдено';
        listEl.appendChild(emptyMsg);
    } else {
        filtered.forEach(item => {
            const div = document.createElement('div');
            div.className = 'card access-item';
            div.style.marginBottom = '8px';
            const meta = [
                item.ip ? 'IP ' + item.ip : '',
                item.location || '',
                item.description || ''
            ].filter(Boolean).join(' · ');
            div.innerHTML = `
                <div class="access-title">${item.system || ''}</div>
                <div class="access-grid">
                    <div>
                        <div class="access-k">Логин</div>
                        <div class="access-v">${item.login || '—'}</div>
                    </div>
                    <div>
                        <div class="access-k">Пароль</div>
                        <div class="access-v">${item.password || '—'}</div>
                    </div>
                </div>
                ${meta ? `<div class="access-note">${meta}</div>` : ''}
            `;
            listEl.appendChild(div);
        });
    }

    const toggleScrollBtn = () => {
        if (listEl.scrollTop > 150) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    };
    listEl.addEventListener('scroll', toggleScrollBtn);
    listEl.scrollTop = 0;
    toggleScrollBtn();
}

function renderCredentials() {}

// ==================== SERVICE WORKER ====================
function manualCheckForUpdates() {
    if (!('serviceWorker' in navigator)) return;
    
    navigator.serviceWorker.getRegistration().then(reg => {
        if (!reg) return;
        
        const toast = document.querySelector('.update-toast');
        if (toast) {
            toast.innerHTML = `
                <span class="update-toast-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/></svg></span>
                <span class="update-toast-text">Проверка обновлений</span>
            `;
            toast.classList.add('show');
        }
        
        reg.update().then(() => {
            setTimeout(() => {
                if (reg.waiting) {
                    reg.waiting.postMessage({ action: 'skipWaiting' });
                } else if (reg.installing) {
                    reg.installing.addEventListener('statechange', function onStateChange() {
                        if (this.state === 'installed') {
                            this.postMessage({ action: 'skipWaiting' });
                            this.removeEventListener('statechange', onStateChange);
                        }
                    });
                } else {
                    if (toast) {
                        toast.innerHTML = `
                            <span class="update-toast-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7"/></svg></span>
                            <span class="update-toast-text">Обновлений нет</span>
                            <button class="update-action-btn">Ок</button>
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
            setInterval(() => reg.update(), 600000);
            
            if (reg.waiting) {
                reg.waiting.postMessage({ action: 'skipWaiting' });
                return;
            }

            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        newWorker.postMessage({ action: 'skipWaiting' });
                    }
                });
            });
        });

        const toast = document.querySelector('.update-toast');
        if (toast && !navigator.serviceWorker.controller) {
            toast.classList.remove('show');
        }
    });

    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.action === 'skipWaiting') {
            self.skipWaiting();
        }
    });
}

window.checkForUpdates = manualCheckForUpdates;

// ==================== МОДАЛКА УСТАНОВКИ ====================
function openInstallModal() {
    document.getElementById('install-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    switchInstallGuide('ios');
}

function closeInstallModal() {
    document.getElementById('install-modal').classList.add('hidden');
    document.body.style.overflow = '';
}

function switchInstallGuide(platform) {
    const iosBtn = document.getElementById('select-ios');
    const androidBtn = document.getElementById('select-android');
    const content = document.getElementById('install-guide-content');
    if (!iosBtn || !androidBtn || !content) return;

    const isIos = platform === 'ios';
    iosBtn.classList.toggle('on', isIos);
    androidBtn.classList.toggle('on', !isIos);

    const steps = isIos ? [
        ['Откройте сайт в Safari', 'Скопируйте адрес и откройте его в Safari'],
        ['Нажмите «Поделиться»', 'Кнопка в нижней панели браузера'],
        ['Выберите «На экран Домой»', 'Пункт в нижней части меню'],
        ['Нажмите «Добавить»', 'Значок появится на рабочем столе']
    ] : [
        ['Откройте сайт в Chrome', 'Скопируйте адрес и откройте его в Chrome'],
        ['Откройте меню', 'Три точки в правом верхнем углу'],
        ['Выберите «Установить приложение»', 'Название пункта может отличаться'],
        ['Подтвердите установку', 'Значок появится на главном экране']
    ];

    content.innerHTML = '<div class="steps">' + steps.map(function (s, i) {
        return '<div class="step">' +
            '<span class="step-num">' + (i + 1) + '</span>' +
            '<div class="step-text"><b>' + s[0] + '</b><span>' + s[1] + '</span></div>' +
            '</div>';
    }).join('') + '</div>';
}

window.onload = () => {
    if(localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');
    
    updateCurrentDateDisplay();
    updateOnDutyWidget();
    updateSalaryWidget();
    updateDutyClock();
    setInterval(updateDutyClock, 30000);
    updateVersionNumber();
    startWeatherUpdates();
    
    const monthSelector = document.getElementById('month-selector');
    if (monthSelector) {
        const today = new Date();
        const currentMonthName = getMonthName(today.getMonth());
        monthSelector.value = currentMonthName;
    }
    
    loadCurrentUser();
    switchTab(0);
    
    const checkBtn = document.getElementById('manual-update-check');
    if (checkBtn) checkBtn.addEventListener('click', manualCheckForUpdates);

    document.getElementById('pte-test-btn').addEventListener('click', () => {
        if (!currentUser || currentUser === 'Ученик') {
            openUserSelection();
            return;
        }
        selectedTestQuestions = allQuestions;
        showModeSelector();
    });
    document.getElementById('fire-test-btn').addEventListener('click', () => {
        if (!currentUser || currentUser === 'Ученик') {
            openUserSelection();
            return;
        }
        selectedTestQuestions = fireSafetyQuestions;
        showModeSelector();
    });
    document.getElementById('labor-test-btn').addEventListener('click', () => {
        if (!currentUser || currentUser === 'Ученик') {
            openUserSelection();
            return;
        }
        selectedTestQuestions = laborProtectionQuestions;
        showModeSelector();
    });
    document.getElementById('back-to-test-list').addEventListener('click', backToTestList);
    document.getElementById('start-exam-mode').addEventListener('click', startExamMode);
    document.getElementById('start-all-mode').addEventListener('click', startAllMode);
    document.getElementById('exit-test').addEventListener('click', exitTest);
    document.getElementById('prev-question').addEventListener('click', prevQuestion);
    document.getElementById('back-to-mode').addEventListener('click', () => {
        document.getElementById('test-results').classList.add('hidden');
        showModeSelector();
    });

    document.getElementById('calc-4-20ma-btn').addEventListener('click', openCalc4_20mA);
    document.getElementById('converter-btn').addEventListener('click', openConverter);
    document.getElementById('back-to-tools-list').addEventListener('click', showToolsList);
    document.getElementById('back-to-tools-from-converter').addEventListener('click', showToolsList);
    
    showToolsList();
    
    const unitTypeEl = document.getElementById('calc-unit-type');
    if (unitTypeEl) {
        unitTypeEl.addEventListener('change', updateUnitSelect);
        updateUnitSelect();
    }
    
    document.getElementById('install-guide-btn').addEventListener('click', openInstallModal);
    document.getElementById('change-user-btn').addEventListener('click', openUserSelection);

    const loader = document.getElementById('app-loader');
    if (loader) {
        const MIN_LOADER_TIME = 1000;
        const startTime = performance.now();
        const elapsed = performance.now() - startTime;
        const remaining = Math.max(0, MIN_LOADER_TIME - elapsed);
        setTimeout(() => {
            loader.style.transition = 'opacity 0.3s ease';
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }, remaining);
    }
};
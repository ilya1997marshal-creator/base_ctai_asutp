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
let lastExamQuestions = []; // сохраняем вопросы последнего экзамена

// ==================== ОСНОВНЫЕ ФУНКЦИИ ====================
function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

function switchTab(index) {
    const tabs = ['tab-home', 'tab-schedule', 'tab-tests', 'tab-tools', 'tab-access', 'tab-help'];
    tabs.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('active', i === index);
    });
    
    document.querySelectorAll('.nav-item').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });
    
    if(index === 0) { updateOnDutyWidget(); updateCurrentDateDisplay(); }
    if(index === 1) {
        renderSchedule(document.getElementById('month-selector').value);
        // повторно активируем фиксацию после отрисовки
        const viewport = document.getElementById('schedule-viewport');
        if (viewport) fixTableFirstColumn(viewport);
    }
    if(index === 4) renderCredentials(); // заглушка
    if(index === 5) updateVersionNumber(); 
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
    dateEl.textContent = formatted;
}

// ==================== ЖИВОЙ ВИДЖЕТ «НА СМЕНЕ» ====================
function getNowKrasnoyarsk() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 7));
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
        dutyList.innerHTML = '<div class="w-full text-center py-3 opacity-30 text-[10px] font-black uppercase tracking-widest">Нет данных</div>';
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
        dutyList.innerHTML = '<div class="text-center py-3 opacity-30 text-[10px] font-black uppercase tracking-widest">Нет смен</div>';
        return;
    }

    let html = '<div class="flex justify-center gap-4 flex-wrap">';
    if (dayShiftNames.length > 0) {
        html += `
            <div class="text-center">
                <div class="text-[8px] font-black uppercase text-emerald-500/60 mb-1 tracking-wider">День</div>
                <div class="flex flex-col items-center gap-1">
                    ${dayShiftNames.map(name => `<span class="bg-emerald-500/5 px-3 py-1 rounded-lg text-emerald-500 border border-emerald-500/10 text-xs font-bold whitespace-nowrap">${name}</span>`).join('')}
                </div>
            </div>`;
    }
    if (nightShiftNames.length > 0) {
        html += `
            <div class="text-center">
                <div class="text-[8px] font-black uppercase text-blue-400/60 mb-1 tracking-wider">Ночь</div>
                <div class="flex flex-col items-center gap-1">
                    ${nightShiftNames.map(name => `<span class="bg-blue-500/5 px-3 py-1 rounded-lg text-blue-400 border border-blue-500/10 text-xs font-bold whitespace-nowrap">${name}</span>`).join('')}
                </div>
            </div>`;
    }
    if (upcomingDayNames.length > 0) {
        html += `
            <div class="text-center">
                <div class="text-[8px] font-black uppercase text-emerald-500/40 mb-1 tracking-wider">День (ожид.)</div>
                <div class="flex flex-col items-center gap-1">
                    ${upcomingDayNames.map(name => `<span class="bg-emerald-500/5 px-3 py-1 rounded-lg text-emerald-500/50 border border-emerald-500/10 text-xs font-bold whitespace-nowrap">${name}</span>`).join('')}
                </div>
            </div>`;
    }
    if (upcomingNightNames.length > 0) {
        html += `
            <div class="text-center">
                <div class="text-[8px] font-black uppercase text-blue-400/40 mb-1 tracking-wider">Ночь (ожид.)</div>
                <div class="flex flex-col items-center gap-1">
                    ${upcomingNightNames.map(name => `<span class="bg-blue-500/5 px-3 py-1 rounded-lg text-blue-400/50 border border-blue-500/10 text-xs font-bold whitespace-nowrap">${name}</span>`).join('')}
                </div>
            </div>`;
    }
    html += '</div>';
    dutyList.innerHTML = html;
}

// ==================== ФИКСАЦИЯ СТОЛБЦА ФАМИЛИЙ (JS) ====================
function fixTableFirstColumn(container) {
    if (!container) return;
    
    const updateSticky = () => {
        const scrollLeft = container.scrollLeft;
        const cols = container.querySelectorAll('.col-name');
        cols.forEach(col => {
            col.style.transform = `translateX(${scrollLeft}px)`;
        });
    };
    
    // удаляем старый обработчик, чтобы не дублировался
    container.removeEventListener('scroll', updateSticky);
    container.addEventListener('scroll', updateSticky);
    
    // применяем текущее положение
    updateSticky();
}

// ==================== ГРАФИК ====================
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

    let html = `<table class="schedule-table"><thead><tr><th class="col-name head-fio">Ф.И.О.</th>`;
    for(let d=1; d<=daysInMonth; d++) {
        const isToday = isCurrent && d === curDay;
        const isHoliday = isWeekendOrHoliday(d);
        html += `<th class="${isToday ? 'today-header' : ''} ${isHoliday ? 'holiday-header' : ''}">${d}</th>`;
    }
    html += `<th class="col-stat">СМ.</th><th class="col-stat">ЧАС.</th></tr></thead><tbody>`;

    data.forEach(p => {
        let shiftsCount = 0, hours = 0;
        html += `<tr onclick="highlightRow(this)"><td class="col-name text-center font-medium">${p.name}</td>`;
        for(let d=1; d<=daysInMonth; d++) {
            const s = p.shifts[d-1] || '';
            const isToday = isCurrent && d === curDay;
            const isHoliday = isWeekendOrHoliday(d);
            if (hourMap[s]) {
                html += `<td class="shift-D ${isToday ? 'today-column' : ''} ${isHoliday ? 'holiday-column' : ''}"><span class="hour-num">${hourMap[s]}</span></td>`;
            } else {
                html += `<td class="shift-${s} ${isToday ? 'today-column' : ''} ${isHoliday ? 'holiday-column' : ''}"></td>`;
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
        html += `<td class="col-stat font-bold">${shiftsCount}</td><td class="col-stat font-bold">${hours}</td></tr>`;
    });
    
    viewport.innerHTML = html + `</tbody></table>`;

    // включаем фиксацию первого столбца
    fixTableFirstColumn(viewport);

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
                <input type="text" oninput="filterDiag(this.value)" placeholder="Поиск ошибки или кода..." 
                       class="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-sm focus:outline-none">
            </div>
        `;
    }

    if (!mData.items.length) {
        list.innerHTML += `<div class="py-20 text-center opacity-10 font-black uppercase text-[10px]">Раздел пуст</div>`;
    } else {
        let groupContainer = null;

        mData.items.forEach(item => {
            if (item.type === 'header') {
                const header = document.createElement('div');
                header.className = "mt-4 mb-2 first:mt-0";
                header.innerHTML = `<h4 class="text-xs font-black uppercase tracking-wider text-blue-400/80">${item.title}</h4>`;
                list.appendChild(header);
                
                groupContainer = document.createElement('div');
                groupContainer.className = "space-y-2 mb-3";
                list.appendChild(groupContainer);
            } else if (item.type === 'item' || item.code) {
                const div = document.createElement('div');
                div.className = "diag-card p-3 bg-white/5 rounded-xl border border-white/5";
                
                let codeColorClass = 'bg-red-500/20 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.3)]';
                if (item.color === 'orange') {
                    codeColorClass = 'bg-orange-500/20 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.3)]';
                } else if (item.color === 'yellow') {
                    codeColorClass = 'bg-yellow-500/20 text-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.3)]';
                }
                
                div.innerHTML = `
                    <div class="flex items-start gap-3">
                        <span class="inline-block px-2 py-1 rounded-lg ${codeColorClass} font-black text-xs uppercase tracking-wider">${item.code}</span>
                        <div class="flex-1">
                            <div class="text-sm font-medium leading-tight">${item.desc}</div>
                            <div class="text-xs opacity-60 mt-1 font-medium">💡 ${item.action}</div>
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
            }
        });
    }
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
        if (groupContainer && groupContainer.classList.contains('space-y-2')) {
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
}

function openCalc4_20mA() {
    document.getElementById('tools-list-screen').classList.add('hidden');
    document.getElementById('calc-4-20ma-screen').classList.remove('hidden');
    updateUnitSelect();
    calcCurrentToValue();
}

const unitMap = {
    pressure: ['бар', 'МПа', 'кПа', 'кгс/см²', 'атм', 'Па'],
    temperature: ['°C', '°F', 'K'],
    level: ['м', 'см', 'мм', '%'],
    flow: ['м³/ч', 'л/мин', 'л/с'],
    custom: ['ед.']
};

function updateUnitSelect() {
    const type = document.getElementById('calc-unit-type').value;
    const units = unitMap[type] || unitMap.custom;
    const select = document.getElementById('calc-unit-select');
    select.innerHTML = '';
    units.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit;
        option.textContent = unit;
        select.appendChild(option);
    });
    calcCurrentToValue();
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
        if (isMultiple) {
            html += `
                <label class="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer">
                    <input type="checkbox" name="option" value="${idx}" ${checked} class="mt-1" ${disabledAttr}>
                    <span class="text-sm">${opt}</span>
                </label>
            `;
        } else {
            html += `
                <label class="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer">
                    <input type="radio" name="option" value="${idx}" ${checked} class="mt-1" ${disabledAttr}>
                    <span class="text-sm">${opt}</span>
                </label>
            `;
        }
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
    
    let html = '';
    if (filtered.length === 0) {
        html = '<div class="text-center py-10 opacity-50 text-xs font-black uppercase">Ничего не найдено</div>';
    } else {
        filtered.forEach(item => {
            html += `
                <div class="bg-white/5 rounded-xl border border-white/5 p-3">
                    <div class="font-bold text-sm mb-2">${item.system || ''}</div>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <span class="opacity-50">Логин:</span>
                            <div class="font-mono bg-white/5 px-2 py-0.5 rounded mt-0.5">${item.login || '—'}</div>
                        </div>
                        <div>
                            <span class="opacity-50">Пароль:</span>
                            <div class="font-mono bg-white/5 px-2 py-0.5 rounded mt-0.5">${item.password || '—'}</div>
                        </div>
                    </div>
                    ${item.ip ? `<div class="mt-2 text-[10px] opacity-50">IP: ${item.ip}</div>` : ''}
                    ${item.location ? `<div class="mt-1 text-[10px] opacity-50">📍 ${item.location}</div>` : ''}
                    ${item.description ? `<div class="mt-1 text-[10px] opacity-50">${item.description}</div>` : ''}
                </div>
            `;
        });
    }
    listEl.innerHTML = html;
}

function renderCredentials() {
    // сохраняем для обратной совместимости, не используется
}

// ==================== SERVICE WORKER (АВТООБНОВЛЕНИЕ) ====================
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
                            <div class="flex flex-col items-center">
                                <div class="text-sm font-medium mb-4">У вас последняя версия</div>
                                <button class="update-action-btn">OK</button>
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

window.onload = () => {
    if(localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');
    
    updateCurrentDateDisplay();
    updateOnDutyWidget();
    updateVersionNumber();
    startWeatherUpdates();
    
    const monthSelector = document.getElementById('month-selector');
    if (monthSelector) {
        const today = new Date();
        const currentMonthName = getMonthName(today.getMonth());
        monthSelector.value = currentMonthName;
    }
    
    switchTab(0);
    
    const checkBtn = document.getElementById('manual-update-check');
    if (checkBtn) {
        checkBtn.addEventListener('click', manualCheckForUpdates);
    }

    document.getElementById('pte-test-btn').addEventListener('click', () => {
        selectedTestQuestions = allQuestions;
        showModeSelector();
    });
    document.getElementById('fire-test-btn').addEventListener('click', () => {
        selectedTestQuestions = fireSafetyQuestions;
        showModeSelector();
    });
    document.getElementById('labor-test-btn').addEventListener('click', () => {
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
    document.getElementById('back-to-tools-list').addEventListener('click', showToolsList);
    
    showToolsList();
    
    const unitTypeEl = document.getElementById('calc-unit-type');
    if (unitTypeEl) {
        unitTypeEl.addEventListener('change', updateUnitSelect);
        updateUnitSelect();
    }
};
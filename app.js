const monthsList = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

// --- ТЕМА ---
function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// --- НАВИГАЦИЯ ---
function switchTab(index) {
    const tabs = ['tab-home', 'tab-schedule', 'tab-tests', 'tab-help'];
    
    // Скрываем все вкладки
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    
    // Показываем нужную
    const targetTab = document.getElementById(tabs[index]);
    if (targetTab) targetTab.classList.add('active');
    
    // Обновляем кнопки навигации
    document.querySelectorAll('.nav-item').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });
    
    // Специфическая логика для вкладок
    if(index === 0) updateOnDutyWidget(); 
    if(index === 1) {
        const selector = document.getElementById('month-selector');
        if(selector) renderSchedule(selector.value);
    }
    
    window.scrollTo({top: 0, behavior: 'smooth'});
}

// --- ВИДЖЕТ "НА СМЕНЕ" ---
function updateOnDutyWidget() {
    const dutyList = document.getElementById('duty-list');
    if (!dutyList) return;
    
    const now = new Date();
    const day = now.getDate(); 
    const currentMonthData = scheduleData["Апрель"];
    
    if (!currentMonthData) {
        dutyList.innerHTML = '<span class="opacity-40">Нет данных на сегодня</span>';
        return;
    }
    
    const onDuty = currentMonthData
        .filter(p => {
            const shift = p.name === "Бондаренко Т.А." ? 'O' : (p.shifts[day - 1] || '');
            return shift === 'D' || shift === 'S' || shift === 'N';
        })
        .map(p => p.name);
        
    if (onDuty.length > 0) {
        dutyList.innerHTML = onDuty.join(', ');
    } else {
        dutyList.innerHTML = '<span class="opacity-40">Сегодня нет запланированных смен</span>';
    }
}

// --- ГРАФИК ---
function renderSchedule(monthName) {
    const display = document.getElementById('current-month-display');
    if(display) display.textContent = monthName + " 2026";
    
    const viewport = document.getElementById('schedule-viewport');
    if (!viewport) return;

    const monthIndex = monthsList.indexOf(monthName);
    
    if (monthIndex !== 3) { 
        viewport.innerHTML = `
            <div class="py-24 flex flex-col items-center justify-center opacity-30 text-center">
                <span class="text-4xl mb-3">📁</span>
                <span class="text-[10px] font-black uppercase tracking-[0.2em]">Нет данных</span>
            </div>`;
        return;
    }
    
    const data = scheduleData["Апрель"];
    const daysInMonth = 30;

    const today = new Date();
    const currentDay = today.getDate();
    const isCurrentMonth = monthIndex === today.getMonth();
    
    let html = `
        <table class="schedule-table">
            <thead>
                <tr>
                    <th class="col-name head-fio">Ф.И.О.</th>`;
    
    for(let d=1; d<=daysInMonth; d++) {
        const isToday = isCurrentMonth && d === currentDay;
        html += `<th class="${isToday ? 'today-header' : ''}">${d}</th>`;
    }
    
    html += `
                    <th class="col-stat">СМ.</th>
                    <th class="col-stat">ЧАС.</th>
                </tr>
            </thead>
            <tbody>`;
            
    data.forEach(p => {
        let shiftsCount = 0;
        let hoursCount = 0;
        
        html += `<tr onclick="highlightRow(this)"><td class="col-name">${p.name}</td>`;
        
        for(let d=1; d<=daysInMonth; d++) {
            let val = p.shifts[d-1] || '';
            if (p.name === "Бондаренко Т.А.") val = 'O';
            
            const isToday = isCurrentMonth && d === currentDay;
            let cellClass = val ? `shift-${val}` : '';
            if (isToday) cellClass += ' today-column';

            html += `<td class="${cellClass}"></td>`;
            
            if(val === 'D' || val === 'N' || val === 'S') {
                shiftsCount++;
                hoursCount += (val === 'S' ? 8 : 12);
            }
        }
        
        html += `<td class="col-stat">${shiftsCount}</td><td class="col-stat">${hoursCount}</td></tr>`;
    }); // Исправлено закрытие forEach
    
    viewport.innerHTML = html + `</tbody></table>`;

    if (isCurrentMonth) {
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
    const isActive = row.classList.contains('highlighted-row');
    
    rows.forEach(r => r.classList.remove('highlighted-row', 'blurred-row'));
    
    if (!isActive) {
        row.classList.add('highlighted-row');
        rows.forEach(r => {
            if (r !== row) r.classList.add('blurred-row');
        });
    }
}

// --- МОДАЛЬНОЕ ОКНО ---
function openBlockModal(key) {
    const title = document.getElementById('modal-block-title');
    const list = document.getElementById('instructions-list');
    const modal = document.getElementById('block-modal');
    
    if (!list || !title || !modal) return;
    
    list.innerHTML = ''; 
    
    if (key === 'other') {
        title.textContent = 'Инструкции';
        list.innerHTML = `
            <a href="docs/S7-400_instalation.pdf" 
               target="_blank" 
               rel="noopener noreferrer"
               class="doc-item">
                <div class="flex flex-col">
                    <span class="doc-name">Руководство S7-400</span>
                    <span class="text-[9px] opacity-40 mt-1 uppercase font-bold">Нажмите для просмотра</span>
                </div>
                <span class="text-blue-500 text-xl">📄</span>
            </a>`;
    } else if (key === 'zip') {
        title.textContent = 'ЗИП АСУ ТП';
        list.innerHTML = '<div class="text-center py-20 opacity-20 text-[9px] font-black uppercase">Нет данных</div>';
    } else {
        title.textContent = `Блок ${key}`;
        list.innerHTML = '<div class="text-center py-20 opacity-20 text-[9px] font-black uppercase">Раздел наполняется</div>';
    }
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeBlockModal() { 
    const modal = document.getElementById('block-modal');
    if (modal) modal.classList.add('hidden'); 
    document.body.style.overflow = '';
}

// --- ВЫВОД ВЕРСИИ ---
function displayAppVersion() {
    const versionElement = document.getElementById('app-version');
    if (!versionElement) return;

    if ('serviceWorker' in navigator) {
        caches.keys().then(keys => {
            const versionKey = keys.find(key => key.startsWith('ctai-base-'));
            if (versionKey) {
                const versionNumber = versionKey.split('-').pop(); 
                versionElement.textContent = `Версия системы: ${versionNumber.toUpperCase()}`;
            }
        });
    }
}

// --- ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ ---
window.onload = () => {
    const blocksCont = document.getElementById('blocks-container');
    if (blocksCont) {
        blocksCont.innerHTML = ''; 
        for (let i = 1; i <= 6; i++) {
            blocksCont.innerHTML += `
                <button onclick="openBlockModal(${i})" class="w-full action-btn p-6 rounded-3xl flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <span class="text-blue-500 font-black italic text-xl">0${i}</span>
                        <span class="font-bold text-sm uppercase">Блок ${i}</span>
                    </div>
                    <span class="opacity-30">›</span>
                </button>`;
        }
    }
    
    if(localStorage.getItem('theme') === 'light') toggleTheme();
    
    updateOnDutyWidget(); 
    displayAppVersion(); 
    switchTab(0); 
};
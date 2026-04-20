const monthsList = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    document.getElementById('theme-icon').textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

function switchTab(index) {
    const tabs = ['tab-home', 'tab-schedule', 'tab-tests', 'tab-help'];
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(tabs[index]).classList.add('active');
    document.querySelectorAll('.nav-item').forEach((btn, i) => btn.classList.toggle('active', i === index));
    if(index === 1) renderSchedule(document.getElementById('month-selector').value);
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function renderSchedule(monthName) {
    const display = document.getElementById('current-month-display');
    if(display) display.textContent = monthName + " 2026";
    const viewport = document.getElementById('schedule-viewport');
    const monthIndex = monthsList.indexOf(monthName);
    
    if (monthIndex !== 3) { 
        viewport.innerHTML = `<div class="py-24 flex flex-col items-center justify-center opacity-30 text-center"><span class="text-4xl mb-3">📁</span><span class="text-[10px] font-black uppercase tracking-[0.2em]">Нет данных</span></div>`;
        return;
    }

    const data = scheduleData["Апрель"];
    const daysInMonth = 30;

    let html = `<table class="schedule-table"><thead><tr><th class="col-name head-fio">Ф.И.О.</th>`;
    for(let d=1; d<=daysInMonth; d++) html += `<th>${d}</th>`;
    html += `<th class="col-stat">СМ.</th><th class="col-stat">ЧАС.</th></tr></thead><tbody>`;
    
    data.forEach(p => {
        let shiftsCount = 0;
        let hoursCount = 0;
        
        html += `<tr onclick="highlightRow(this)"><td class="col-name">${p.name}</td>`;
        for(let d=1; d<=daysInMonth; d++) {
            let val = p.shifts[d-1] || '';
            
            // ПРАВКА: Отпуск для Бондаренко Т.А.
            if (p.name === "Бондаренко Т.А.") val = 'O';

            let cellClass = val ? `shift-${val}` : '';
            html += `<td class="${cellClass}"></td>`;
            
            if(val === 'D' || val === 'N' || val === 'S') {
                shiftsCount++;
                hoursCount += (val === 'S' ? 8 : 12);
            }
        }
        html += `<td class="col-stat">${shiftsCount}</td><td class="col-stat">${hoursCount}</td></tr>`;
    });
    
    viewport.innerHTML = html + `</tbody></table>`;
}

function highlightRow(row) {
    const rows = document.querySelectorAll('.schedule-table tbody tr');
    const isActive = row.classList.contains('highlighted-row');
    rows.forEach(r => r.classList.remove('highlighted-row', 'blurred-row'));
    if (!isActive) {
        row.classList.add('highlighted-row');
        rows.forEach(r => { if (r !== row) r.classList.add('blurred-row'); });
    }
}

function openBlockModal(key) {
    const title = document.getElementById('modal-block-title');
    const list = document.getElementById('instructions-list');
    list.innerHTML = ''; 
    if (key === 'other') {
        title.textContent = 'Инструкции';
        list.innerHTML = `<a href="docs/S7-400_instalation.pdf" target="_blank" class="doc-item"><span class="doc-name">Руководство S7-400</span><span class="opacity-20 text-xl">›</span></a>`;
    } else if (key === 'zip') {
        title.textContent = 'ЗИП АСУ ТП';
        list.innerHTML = '<div class="text-center py-20 opacity-20 text-[9px] font-black uppercase">Нет данных</div>';
    } else {
        title.textContent = `Блок ${key}`;
        list.innerHTML = '<div class="text-center py-20 opacity-20 text-[9px] font-black uppercase">Раздел наполняется</div>';
    }
    document.getElementById('block-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeBlockModal() { 
    document.getElementById('block-modal').classList.add('hidden'); 
    document.body.style.overflow = '';
}

window.onload = () => {
    const blocksCont = document.getElementById('blocks-container');
    if (blocksCont) {
        for (let i = 1; i <= 6; i++) {
            blocksCont.innerHTML += `<button onclick="openBlockModal(${i})" class="w-full action-btn p-6 rounded-3xl flex items-center justify-between"><div class="flex items-center gap-4"><span class="text-blue-500 font-black italic text-xl">0${i}</span><span class="font-bold text-sm uppercase">Блок ${i}</span></div><span class="opacity-30">›</span></button>`;
        }
    }
    if(localStorage.getItem('theme') === 'light') toggleTheme();
    switchTab(0);
};
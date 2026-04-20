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
    document.getElementById('current-month-display').textContent = monthName + " 2026";
    const viewport = document.getElementById('schedule-viewport');
    const monthIndex = monthsList.indexOf(monthName);
    const year = 2026;
    
    if (monthIndex !== 3) { 
        viewport.innerHTML = `<div class="py-24 flex flex-col items-center justify-center opacity-30 text-center px-6"><span class="text-4xl mb-3">📁</span><span class="text-[10px] font-black uppercase tracking-[0.2em]">Данные для этого месяца в режиме наполнения</span></div>`;
        return;
    }

    const data = JSON.parse(JSON.stringify(scheduleData["Апрель"]));
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    
    data.forEach(p => {
        if (p.name.includes('Бондаренко')) p.shifts = new Array(daysInMonth).fill('O');
    });

    let html = `<table class="schedule-table"><thead><tr><th class="col-name head-fio" style="text-align: center !important; padding-left: 0 !important;">Ф.И.О.</th>`;
    
    for(let d=1; d<=daysInMonth; d++) {
        const date = new Date(year, monthIndex, d);
        const dayOfWeek = date.getDay();
        const weekendClass = (dayOfWeek === 0 || dayOfWeek === 6) ? 'is-weekend-head' : '';
        html += `<th class="${weekendClass}">${d}</th>`;
    }
    html += `<th class="col-stats">СМ</th><th class="col-stats">ЧАС</th></tr></thead><tbody>`;
    
    data.forEach(p => {
        let totalShifts = 0;
        let totalHours = 0;
        
        html += `<tr onclick="highlightRow(this)"><td class="col-name">${p.name}</td>`;
        
        for(let d=1; d<=daysInMonth; d++) {
            const val = p.shifts[d-1] || '';
            let cellClass = '';
            if (val === 'D') { cellClass = 'shift-D'; totalShifts++; totalHours += 11; }
            else if (val === 'N') { cellClass = 'shift-N'; totalShifts++; totalHours += 11; }
            else if (val === 'S') { cellClass = 'shift-S'; totalShifts++; totalHours += 8; }
            else if (val === 'O') { cellClass = 'shift-O'; }
            else {
                const date = new Date(year, monthIndex, d);
                const dayOfWeek = date.getDay();
                if (dayOfWeek === 0 || dayOfWeek === 6) cellClass = 'is-weekend-cell';
            }
            html += `<td class="${cellClass}"></td>`;
        }
        html += `<td class="col-stats">${totalShifts}</td><td class="col-stats">${totalHours}</td></tr>`;
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
    title.textContent = key === 'other' ? 'Инструкции' : key === 'zip' ? 'ЗИП АСУ ТП' : `Блок ${key}`;
    list.innerHTML = '<div class="text-center py-20 opacity-20 text-[9px] font-black uppercase">Нет данных</div>';
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
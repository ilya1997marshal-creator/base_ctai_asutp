const monthsMap = { "Январь":0, "Февраль":1, "Март":2, "Апрель":3, "Май":4, "Июнь":5, "Июль":6, "Август":7, "Сентябрь":8, "Октябрь":9, "Ноябрь":10, "Декабрь":11 };

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    document.getElementById('theme-icon').textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

function switchTab(index) {
    const tabs = ['tab-home', 'tab-schedule', 'tab-tests', 'tab-help'];
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(tabs[index]).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });

    if(index === 1) renderSchedule(document.getElementById('month-selector').value);
    window.scrollTo(0, 0);
}

function renderSchedule(monthName) {
    const display = document.getElementById('current-month-display');
    if (display) display.textContent = `${monthName} 2026`;
    const viewport = document.getElementById('schedule-viewport');
    if (!viewport) return;

    const currentMonthIdx = 3; // Апрель
    const selectedMonthIdx = monthsMap[monthName];

    if (selectedMonthIdx < currentMonthIdx) {
        viewport.innerHTML = `<div class="py-32 text-center text-zinc-500 font-bold uppercase text-[10px] tracking-widest">График находится в архиве</div>`;
        return;
    }
    if (selectedMonthIdx > currentMonthIdx) {
        viewport.innerHTML = `<div class="py-32 text-center text-zinc-500 font-bold uppercase text-[10px] tracking-widest">График находится в разработке</div>`;
        return;
    }

    const data = (typeof scheduleData !== 'undefined') ? scheduleData[monthName] : null;
    if (!data) return;

    const year = 2026;
    const daysInMonth = new Date(year, selectedMonthIdx + 1, 0).getDate();
    
    let html = `<table class="schedule-table"><thead><tr><th class="col-name">Ф.И.О.</th>`;
    
    for(let d=1; d<=daysInMonth; d++) {
        const dateObj = new Date(year, selectedMonthIdx, d);
        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
        html += `<th class="col-date ${isWeekend ? 'weekend-txt' : ''}">${d}</th>`;
    }
    html += `<th class="col-stat">СМ</th><th class="col-stat">ЧАС</th></tr></thead><tbody>`;
    
    data.forEach(person => {
        html += `<tr onclick="highlightRow(this)"><td class="col-name">${person.name}</td>`;
        for(let d=1; d<=daysInMonth; d++) {
            let val = person.shifts[d-1] || '';
            const displayVal = (val === 'W') ? '' : val;
            const cellClass = ['D','N','S'].includes(val) ? `shift-${val}` : '';
            html += `<td class="${cellClass}">${displayVal}</td>`;
        }
        html += `<td class="col-stat">${person.s}</td><td class="col-stat">${person.h}</td></tr>`;
    });
    viewport.innerHTML = html + `</tbody></table>`;
}

function highlightRow(row) {
    const rows = document.querySelectorAll('.schedule-table tbody tr');
    if (row.classList.contains('highlighted-row')) {
        rows.forEach(r => r.classList.remove('highlighted-row', 'blurred-row'));
    } else {
        rows.forEach(r => {
            r.classList.toggle('highlighted-row', r === row);
            r.classList.toggle('blurred-row', r !== row);
        });
    }
}

function openBlockModal(key) {
    document.getElementById('modal-block-title').textContent = key === 'other' ? 'Инструкции' : key === 'zip' ? 'ЗИП АСУ ТП' : `Блок ${key}`;
    document.getElementById('instructions-list').innerHTML = '<div class="text-center py-10 text-zinc-400 text-xs uppercase font-bold">Данные в разработке</div>';
    document.getElementById('block-modal').classList.remove('hidden');
}

function closeBlockModal() { document.getElementById('block-modal').classList.add('hidden'); }

window.onload = () => {
    const blocksCont = document.getElementById('blocks-container');
    if (blocksCont) {
        for (let i = 1; i <= 6; i++) {
            blocksCont.innerHTML += `
                <button onclick="openBlockModal(${i})" class="w-full action-btn p-5 rounded-2xl flex items-center justify-between mb-1">
                    <div class="flex items-center gap-4">
                        <span class="text-blue-500 font-extrabold text-lg">0${i}</span>
                        <span class="font-bold text-sm uppercase tracking-wide">Блок ${i}</span>
                    </div>
                    <span class="opacity-30">›</span>
                </button>`;
        }
    }
    if(localStorage.getItem('theme') === 'light') toggleTheme();
    switchTab(0);
};
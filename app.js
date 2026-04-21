/**
 * ЦТАИ АСУ ТП - Основной скрипт
 */

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
    
    if(index === 0) updateOnDutyWidget(); 
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
            const cacheKey = keys.find(k => k.toLowerCase().includes('v') || k.toLowerCase().includes('ctai'));
            if (cacheKey) {
                const match = cacheKey.match(/v\d+\.\d+\.\d+/i);
                verElement.textContent = match ? match[0].toUpperCase() : cacheKey.toUpperCase();
            } else {
                verElement.textContent = "V1.0.56"; 
            }
        }
    } catch (e) {
        verElement.textContent = "V1.0.56";
    }
}

function updateOnDutyWidget() {
    const dutyList = document.getElementById('duty-list');
    if (!dutyList) return;
    const day = new Date().getDate(); 
    const currentMonthData = scheduleData["Апрель"];
    if (!currentMonthData) return;

    const onDuty = currentMonthData
        .filter(p => ['D', 'S', 'N'].includes(p.shifts[day - 1] || ''))
        .map(p => p.name.split(' ')[0]);
    
    dutyList.innerHTML = onDuty.length > 0 
        ? onDuty.map(name => `<span class="bg-blue-500/10 px-3 py-1 rounded-full text-blue-500 border border-blue-500/20">${name}</span>`).join('') 
        : '<span class="opacity-40">Сегодня нет смен</span>';
}

function renderSchedule(monthName) {
    const display = document.getElementById('current-month-display');
    const viewport = document.getElementById('schedule-viewport');
    if(display) display.textContent = monthName + " 2026";
    if(!viewport) return;

    const data = scheduleData[monthName];
    if (!data) {
        viewport.innerHTML = `<div class="py-20 text-center opacity-20 font-black uppercase">Нет данных</div>`;
        return;
    }

    const today = new Date();
    const isCurrent = (monthName === "Апрель");
    const curDay = today.getDate();
    const daysInMonth = (monthName === "Февраль") ? 28 : (["Апрель", "Июнь", "Сентябрь", "Ноябрь"].includes(monthName) ? 30 : 31);

    let html = `<table class="schedule-table"><thead><tr><th class="col-name head-fio">Ф.И.О.</th>`;
    for(let d=1; d<=daysInMonth; d++) {
        html += `<th class="${isCurrent && d === curDay ? 'today-header' : ''}">${d}</th>`;
    }
    html += `<th class="col-stat">СМ.</th><th class="col-stat">ЧАС.</th></tr></thead><tbody>`;

    data.forEach(p => {
        let shifts = 0, hours = 0;
        html += `<tr onclick="highlightRow(this)"><td class="col-name">${p.name}</td>`;
        for(let d=1; d<=daysInMonth; d++) {
            const s = p.shifts[d-1] || '';
            const isToday = isCurrent && d === curDay;
            html += `<td class="shift-${s} ${isToday ? 'today-column' : ''}"></td>`;
            if(['D', 'N', 'S'].includes(s)) { shifts++; hours += (s === 'S' ? 8 : 12); }
        }
        html += `<td class="col-stat font-bold">${shifts}</td><td class="col-stat font-bold">${hours}</td></tr>`;
    });
    
    viewport.innerHTML = html + `</tbody></table>`;

    // АВТОСКРОЛЛ К ТЕКУЩЕЙ ДАТЕ
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
                div.innerHTML = `
                    <div class="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 active:scale-[0.98] transition-transform">
                        <div onclick="window.open('${item.link}', '_blank')" class="flex-1 cursor-pointer">
                            <span class="font-bold text-sm block">${item.title}</span>
                            <span class="text-[9px] opacity-40 uppercase font-black">Открыть документ</span>
                        </div>
                        <a href="${item.link}" download class="ml-2 px-4 py-2 bg-blue-500/10 text-blue-500 rounded-xl text-[10px] font-black uppercase">Сохранить</a>
                    </div>`;
            } else {
                div.innerHTML = `
                    <div class="p-5 bg-white/5 rounded-[2rem] border border-white/5">
                        <div class="text-blue-500 font-black text-[10px] uppercase mb-1">${item.title}</div>
                        <div class="text-sm opacity-80 leading-relaxed">${item.desc}</div>
                    </div>`;
            }
            list.appendChild(div);
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

window.onload = () => {
    if(localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');
    updateOnDutyWidget();
    updateVersionNumber();
    switchTab(0);
};
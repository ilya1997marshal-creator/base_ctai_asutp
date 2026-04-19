let appData = null;

async function startApp() {
    try {
        const response = await fetch('./data/instructions.json');
        if (!response.ok) throw new Error('Ошибка загрузки JSON');
        appData = await response.json();
        
        renderMain();
        initNavigation();
        initTheme();
        initSchedule();
        
        console.log("Приложение успешно инициализировано");
    } catch (err) {
        console.error("Критическая ошибка:", err);
        document.getElementById('blocksContainer').innerHTML = `<p style="color:red; text-align:center;">Данные не найдены в папке data/</p>`;
    }
}

function renderMain() {
    const container = document.getElementById('blocksContainer');
    if (!container || !appData || !appData.blocks) return;

    container.innerHTML = appData.blocks.map((block, idx) => `
        <button type="button" class="action-main-btn" onclick="openModal(${idx})">
            ${block.title}
        </button>
    `).join('');
}

window.openModal = (idx) => {
    const block = appData.blocks[idx];
    document.getElementById('modalTitle').innerText = block.title;
    document.getElementById('modalList').innerHTML = block.items.map(item => `
        <li><a href="${item.url}" target="_blank" rel="noopener">${item.name}</a></li>
    `).join('');
    document.getElementById('modal').hidden = false;
};

function initNavigation() {
    const btns = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.tab-content');

    btns.forEach(btn => {
        btn.onclick = () => {
            const target = btn.getAttribute('data-screen');
            btns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`screen-${target}`).classList.add('active');
            document.getElementById('modal').hidden = true;
        };
    });
}

function initSchedule() {
    const btn = document.getElementById('showScheduleBtn');
    if (!btn) return;

    btn.onclick = async () => {
        try {
            const res = await fetch('./data/schedule.json');
            const data = await res.json();
            
            const table = document.getElementById('work-schedule');
            document.getElementById('tableMonthTitle').innerText = data.month;
            
            let html = `<thead><tr><th style="position:sticky;left:0;background:var(--panel-color)">ФИО</th>`;
            for(let i=1; i<=data.daysInMonth; i++) html += `<th>${i}</th>`;
            html += `</tr></thead><tbody>`;

            data.employees.forEach(emp => {
                html += `<tr><td style="position:sticky;left:0;background:var(--panel-color);font-weight:700">${emp.name}</td>`;
                emp.days.forEach(d => html += `<td>${d || ''}</td>`);
                html += `</tr>`;
            });
            table.innerHTML = html + `</tbody>`;
            
            document.getElementById('charts-init').hidden = true;
            document.getElementById('schedule-container').hidden = false;
        } catch (e) {
            alert("Файл графика не найден");
        }
    };

    document.getElementById('backToCharts').onclick = () => {
        document.getElementById('schedule-container').hidden = true;
        document.getElementById('charts-init').hidden = false;
    };
}

function initTheme() {
    document.getElementById('themeToggle').onclick = () => {
        const root = document.documentElement;
        const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        root.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    };
}

document.getElementById('modalClose').onclick = () => document.getElementById('modal').hidden = true;
document.getElementById('modalBackdrop').onclick = () => document.getElementById('modal').hidden = true;

window.onload = startApp;
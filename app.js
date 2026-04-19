let appData = null;

async function start() {
    try {
        const response = await fetch('./data/instructions.json');
        appData = await response.json();
        
        renderMainBlocks();
        initNav();
        initThemeBtn();
        initSchedule();
        
        console.log("App Started");
    } catch (e) {
        console.error("Failed to load data", e);
    }
}

function renderMainBlocks() {
    const container = document.getElementById('blocksContainer');
    if (!container || !appData) return;

    container.innerHTML = appData.blocks.map((block, idx) => `
        <button class="action-main-btn" onclick="openInfo(${idx})">
            ${block.title}
        </button>
    `).join('');
}

window.openInfo = (idx) => {
    const block = appData.blocks[idx];
    document.getElementById('modalTitle').innerText = block.title;
    document.getElementById('modalList').innerHTML = block.items.map(item => `
        <li><a href="${item.url}" target="_blank" rel="noopener">${item.name}</a></li>
    `).join('');
    document.getElementById('modal').hidden = false;
};

function initNav() {
    const btns = document.querySelectorAll('.nav-item');
    const tabs = document.querySelectorAll('.tab-content');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-screen');
            
            btns.forEach(b => b.classList.remove('active'));
            tabs.forEach(t => t.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`screen-${target}`).classList.add('active');
            document.getElementById('modal').hidden = true;
        });
    });
}

function initSchedule() {
    const showBtn = document.getElementById('showScheduleBtn');
    if (!showBtn) return;

    showBtn.onclick = async () => {
        const res = await fetch('./data/schedule.json');
        const data = await res.json();
        
        const table = document.getElementById('work-schedule');
        document.getElementById('tableMonthTitle').innerText = data.month;
        
        let html = `<thead><tr><th style="position:sticky;left:0;background:var(--panel-color)">ФИО</th>`;
        for(let i=1; i<=data.daysInMonth; i++) html += `<th>${i}</th>`;
        html += `</tr></thead><tbody>`;

        data.employees.forEach(emp => {
            html += `<tr><td style="position:sticky;left:0;background:var(--panel-color);font-weight:700;text-align:left;padding-left:8px;">${emp.name}</td>`;
            emp.days.forEach(d => html += `<td>${d || ''}</td>`);
            html += `</tr>`;
        });
        table.innerHTML = html + `</tbody>`;
        
        document.getElementById('charts-init').hidden = true;
        document.getElementById('schedule-container').hidden = false;
    };

    document.getElementById('backToCharts').onclick = () => {
        document.getElementById('schedule-container').hidden = true;
        document.getElementById('charts-init').hidden = false;
    };
}

function initThemeBtn() {
    document.getElementById('themeToggle').onclick = () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    };
}

document.getElementById('modalClose').onclick = () => document.getElementById('modal').hidden = true;
document.getElementById('modalBackdrop').onclick = () => document.getElementById('modal').hidden = true;

window.onload = start;
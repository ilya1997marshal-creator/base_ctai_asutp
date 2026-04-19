let appData = null;

async function startApp() {
    try {
        const response = await fetch('./data/instructions.json');
        appData = await response.json();
        
        renderBlocks();
        initNavigation();
        initTheme();
        initSchedule();
        
        console.log("App initialized");
    } catch (err) {
        console.error("Data load failed", err);
    }
}

function renderBlocks() {
    const container = document.getElementById('blocksContainer');
    if (!container || !appData) return;

    container.innerHTML = appData.blocks.map((block, idx) => `
        <button class="action-main-btn" onclick="showModal(${idx})">
            ${block.title}
        </button>
    `).join('');
}

window.showModal = (idx) => {
    const block = appData.blocks[idx];
    const modal = document.getElementById('modal');
    document.getElementById('modalTitle').innerText = block.title;
    document.getElementById('modalList').innerHTML = block.items.map(item => `
        <li><a href="${item.url}" target="_blank" rel="noopener">${item.name}</a></li>
    `).join('');
    modal.hidden = false;
};

function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.tab-content');

    navButtons.forEach(btn => {
        btn.onclick = () => {
            const target = btn.getAttribute('data-screen');
            
            navButtons.forEach(b => b.classList.remove('active'));
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
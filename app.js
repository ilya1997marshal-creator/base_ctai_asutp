let appData = null;

async function init() {
    try {
        const res = await fetch('./data/instructions.json');
        appData = await res.json();
        renderMainBlocks();
        setupNav();
        setupTheme();
        setupCharts();
    } catch (e) { console.error(e); }
}

function renderMainBlocks() {
    const container = document.getElementById('tabs-main');
    if (!container || !appData) return;
    container.innerHTML = appData.blocks.map((b, i) => `
        <button class="action-main-btn" onclick="openDetails(${i})">${b.title}</button>
    `).join('');
}

window.openDetails = (i) => {
    const block = appData.blocks[i];
    document.getElementById('modalTitle').innerText = block.title;
    document.getElementById('modalList').innerHTML = block.items.map(item => `
        <li><a href="${item.url}" target="_blank">${item.name}</a></li>
    `).join('');
    document.getElementById('modal').hidden = false;
};

function setupNav() {
    const btns = document.querySelectorAll('.nav-item');
    const tabs = document.querySelectorAll('.tab-content');
    btns.forEach(btn => {
        btn.onclick = () => {
            const screen = btn.getAttribute('data-screen');
            btns.forEach(b => b.classList.remove('active'));
            tabs.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`screen-${screen}`).classList.add('active');
            document.getElementById('modal').hidden = true;
        };
    });
}

function setupCharts() {
    const btn = document.getElementById('showScheduleBtn');
    if (!btn) return;
    btn.onclick = async () => {
        const res = await fetch('./data/schedule.json');
        const data = await res.json();
        const table = document.getElementById('work-schedule');
        document.getElementById('tableMonthTitle').innerText = data.month;
        let html = `<thead><tr><th>ФИО</th>`;
        for(let i=1; i<=data.daysInMonth; i++) html += `<th>${i}</th>`;
        html += `</tr></thead><tbody>`;
        data.employees.forEach(e => {
            html += `<tr><td>${e.name}</td>`;
            e.days.forEach(d => html += `<td>${d || ''}</td>`);
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

function setupTheme() {
    document.getElementById('themeToggle').onclick = () => {
        const h = document.documentElement;
        const n = h.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        h.setAttribute('data-theme', n);
        localStorage.setItem('theme', n);
    };
}

document.getElementById('modalClose').onclick = () => document.getElementById('modal').hidden = true;
document.getElementById('modalBackdrop').onclick = () => document.getElementById('modal').hidden = true;

window.onload = init;
let appData = null;

// Главная функция запуска
async function initApp() {
    try {
        // Загружаем основной JSON
        const response = await fetch('./data/instructions.json');
        if (!response.ok) throw new Error('Не удалось загрузить инструкции');
        appData = await response.json();
        
        renderBlocks();
        setupNavigation();
        setupThemeToggle();
        setupSchedule();
        
        console.log("Данные успешно загружены");
    } catch (error) {
        console.error("Ошибка приложения:", error);
        document.getElementById('blocksContainer').innerHTML = 
            `<p style="color:red; text-align:center;">Ошибка: ${error.message}</p>`;
    }
}

// Отрисовка кнопок Блок-1, Блок-2 и т.д.
function renderBlocks() {
    const container = document.getElementById('blocksContainer');
    if (!container || !appData) return;

    container.innerHTML = appData.blocks.map((block, index) => `
        <button type="button" class="action-main-btn" onclick="openDetails(${index})">
            ${block.title}
        </button>
    `).join('');
}

// Открытие модалки с ссылками
window.openDetails = (index) => {
    const block = appData.blocks[index];
    document.getElementById('modalTitle').innerText = block.title;
    document.getElementById('modalList').innerHTML = block.items.map(item => `
        <li><a href="${item.url}" target="_blank" rel="noopener">${item.name}</a></li>
    `).join('');
    document.getElementById('modal').hidden = false;
};

// Переключение вкладок (Главная, Графики...)
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.onclick = () => {
            const screenId = item.getAttribute('data-screen');
            
            navItems.forEach(n => n.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            item.classList.add('active');
            document.getElementById(`screen-${screenId}`).classList.add('active');
            
            // Автоматически скрываем модалку при смене экрана
            document.getElementById('modal').hidden = true;
        };
    });
}

// Работа с графиком
function setupSchedule() {
    const showBtn = document.getElementById('showScheduleBtn');
    if (!showBtn) return;

    showBtn.onclick = async () => {
        try {
            const res = await fetch('./data/schedule.json');
            const data = await res.json();
            
            const table = document.getElementById('work-schedule');
            document.getElementById('tableMonthTitle').innerText = data.month;
            
            let html = `<thead><tr><th style="position:sticky;left:0;background:var(--panel-color)">ФИО</th>`;
            for(let i=1; i<=data.daysInMonth; i++) html += `<th>${i}</th>`;
            html += `</tr></thead><tbody>`;

            data.employees.forEach(emp => {
                html += `<tr><td style="position:sticky;left:0;background:var(--panel-color);font-weight:700;text-align:left;">${emp.name}</td>`;
                emp.days.forEach(dayValue => {
                    html += `<td>${dayValue || ''}</td>`;
                });
                html += `</tr>`;
            });
            table.innerHTML = html + `</tbody>`;
            
            document.getElementById('charts-init').hidden = true;
            document.getElementById('schedule-container').hidden = false;
        } catch (e) {
            alert("Ошибка загрузки данных графика");
        }
    };

    document.getElementById('backToCharts').onclick = () => {
        document.getElementById('schedule-container').hidden = true;
        document.getElementById('charts-init').hidden = false;
    };
}

// Переключатель темы
function setupThemeToggle() {
    document.getElementById('themeToggle').onclick = () => {
        const root = document.documentElement;
        const newTheme = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        root.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    };
}

// Закрытие модального окна
document.getElementById('modalClose').onclick = () => document.getElementById('modal').hidden = true;
document.getElementById('modalBackdrop').onclick = () => document.getElementById('modal').hidden = true;

// Запуск при полной загрузке страницы
window.onload = initApp;
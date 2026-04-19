/**
 * app.js - Основная логика приложения
 * База данных ЦТАИ АСУ ТП
 */

let appData = null;

// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
async function init() {
    try {
        // Загружаем данные инструкций
        const res = await fetch('./data/instructions.json');
        appData = await res.json();
        
        // Запускаем компоненты
        renderMainBlocks();
        setupNavigation();
        setupThemeHandler();
        setupChartsHandler();
        setupModalEvents();
        
        console.log("Приложение успешно инициализировано");
    } catch (error) {
        console.error("Критическая ошибка при загрузке данных:", error);
    }
}

// РЕНДЕРИНГ ГЛАВНЫХ БЛОКОВ (ИНСТРУКЦИИ)
function renderMainBlocks() {
    const container = document.getElementById('tabs-main');
    if (!container || !appData) return;

    container.innerHTML = appData.blocks.map((block, index) => `
        <button class="action-main-btn" onclick="openBlockDetails(${index})">
            ${block.title}
        </button>
    `).join('');
}

// ОТКРЫТИЕ МОДАЛЬНОГО ОКНА С СОДЕРЖИМЫМ БЛОКА
window.openBlockDetails = (index) => {
    const block = appData.blocks[index];
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalList = document.getElementById('modalList');

    if (!block || !modal) return;

    modalTitle.innerText = block.title;
    modalList.innerHTML = block.items.map(item => `
        <li>
            <a href="${item.url}" target="_blank" rel="noopener noreferrer">
                ${item.name}
            </a>
        </li>
    `).join('');

    modal.hidden = false;
};

// НАВИГАЦИЯ МЕЖДУ ЭКРАНАМИ
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-item');
    const screens = document.querySelectorAll('.tab-content');

    navButtons.forEach(button => {
        button.onclick = () => {
            const targetScreenId = button.getAttribute('data-screen');
            
            // Смена активной кнопки
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Смена экрана
            screens.forEach(screen => {
                screen.classList.remove('active');
                if (screen.id === `screen-${targetScreenId}`) {
                    screen.classList.add('active');
                }
            });
            
            // Закрываем модалку при переходе, если она была открыта
            document.getElementById('modal').hidden = true;
        };
    });
}

// РАБОТА С ГРАФИКАМИ
function setupChartsHandler() {
    const showWorkBtn = document.getElementById('showScheduleBtn');
    const scheduleContainer = document.getElementById('schedule-container');
    const chartsInitBox = document.getElementById('charts-init');
    const backBtn = document.getElementById('backToCharts');

    if (showWorkBtn) {
        showWorkBtn.onclick = async () => {
            try {
                const response = await fetch('./data/schedule.json');
                const data = await response.json();
                
                renderWorkSchedule(data);
                
                chartsInitBox.hidden = true;
                scheduleContainer.hidden = false;
            } catch (err) {
                alert("Не удалось загрузить график работы.");
            }
        };
    }

    if (backBtn) {
        backBtn.onclick = () => {
            scheduleContainer.hidden = true;
            chartsInitBox.hidden = false;
            // Убираем фокус со всей таблицы при возврате
            document.getElementById('work-schedule').classList.remove('has-focus');
        };
    }
}

// ОТРИСОВКА ТАБЛИЦЫ ГРАФИКА
function renderWorkSchedule(data) {
    const table = document.getElementById('work-schedule');
    const monthTitle = document.getElementById('tableMonthTitle');
    
    if (!table || !monthTitle) return;

    monthTitle.innerText = data.month;

    // Шапка таблицы
    let tableHtml = `<thead><tr><th class="name-col">ФИО сотрудника</th>`;
    for (let i = 1; i <= data.daysInMonth; i++) {
        tableHtml += `<th>${i}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;

    // Тело таблицы
    data.employees.forEach(emp => {
        tableHtml += `<tr onclick="toggleEmployeeFocus(this)">
            <td class="name-col">${emp.name}</td>`;
        
        emp.days.forEach(dayStatus => {
            let statusClass = "";
            switch (dayStatus) {
                case "12/19": statusClass = "cell-1219"; break;
                case "12/02": statusClass = "cell-1202"; break;
                case "ОТП":   statusClass = "cell-otp"; break;
                case "УЧ":    statusClass = "cell-edu"; break;
            }
            tableHtml += `<td class="${statusClass}">${dayStatus || ""}</td>`;
        });
        tableHtml += `</tr>`;
    });

    tableHtml += `</tbody>`;
    table.innerHTML = tableHtml;
}

// ФУНКЦИЯ ФОКУСИРОВКИ НА СОТРУДНИКЕ (БЛЮР ОСТАЛЬНЫХ)
window.toggleEmployeeFocus = (rowElement) => {
    const tableElement = document.getElementById('work-schedule');
    const isAlreadyFocused = rowElement.classList.contains('focused-row');
    
    // Снимаем фокус со всех строк
    document.querySelectorAll('#work-schedule tr').forEach(row => {
        row.classList.remove('focused-row');
    });
    
    if (!isAlreadyFocused) {
        // Устанавливаем фокус
        tableElement.classList.add('has-focus');
        rowElement.classList.add('focused-row');
    } else {
        // Если кликнули по уже выбранному — снимаем общий блюр
        tableElement.classList.remove('has-focus');
    }
};

// ПЕРЕКЛЮЧЕНИЕ ТЕМЫ
function setupThemeHandler() {
    const themeBtn = document.getElementById('themeToggle');
    if (!themeBtn) return;

    themeBtn.onclick = () => {
        const root = document.documentElement;
        const currentTheme = root.getAttribute('data-theme');
        const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        root.setAttribute('data-theme', nextTheme);
        localStorage.setItem('theme', nextTheme);
    };
}

// СОБЫТИЯ МОДАЛКИ
function setupModalEvents() {
    const modal = document.getElementById('modal');
    const closeBtn = document.getElementById('modalClose');
    const backdrop = document.getElementById('modalBackdrop');

    const closeModal = () => { modal.hidden = true; };

    if (closeBtn) closeBtn.onclick = closeModal;
    if (backdrop) backdrop.onclick = closeModal;
}

// ЗАПУСК
document.addEventListener('DOMContentLoaded', init);
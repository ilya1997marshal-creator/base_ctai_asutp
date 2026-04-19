(function () {
  // Навигация
  const navButtons = document.querySelectorAll(".nav-item");
  const screens = document.querySelectorAll(".tab-content");
  const pageTitle = document.getElementById("pageTitle");
  const pageSubtitle = document.getElementById("pageSubtitle");
  const themeToggle = document.getElementById("themeToggle");

  // График
  const showScheduleBtn = document.getElementById("showScheduleBtn");
  const backToCharts = document.getElementById("backToCharts");
  const chartsInit = document.getElementById("charts-init");
  const scheduleContainer = document.getElementById("schedule-container");
  const tableEl = document.getElementById("work-schedule");

  // ДАННЫЕ ГРАФИКА (Апрель 2026)
  const scheduleData = [
    { name: "Лагутенков Р.С.", shifts: { 3: "1219", 4: "1219", 8: "0828", 9: "1202", 13: "1219", 16: "1219", 17: "1202", 19: "1202", 21: "1202", 24: "1219", 25: "1202", 26: "1202", 28: "1219", 29: "1202" } },
    { name: "Миронов С.А.", shifts: { 3: "1219", 4: "1219", 10: "1202", 11: "0804", 12: "1219", 16: "1219", 17: "1202", 19: "1202", 21: "1202", 24: "1219", 25: "1202", 26: "1202", 28: "1219", 29: "1202" } },
    { name: "Куштанов А.А.", shifts: { 1: "1219", 2: "1202", 3: "1202", 7: "0828", 8: "1202", 12: "1219", 13: "1202", 17: "1219", 20: "1219", 23: "1219", 24: "1202", 28: "1202", 30: "1219" } },
    { name: "Рыжих И.Н.", shifts: { 18: "1219", 23: "1219", 24: "1202", 28: "1202", 30: "1219" } },
    { name: "Бондаренко Т.А.", shifts: { 28: "ОТП", 29: "ОТП", 30: "ОТП" } }
  ];

  const weekends = [4, 5, 11, 12, 18, 19, 25, 26];

  function renderTable() {
    let html = `<thead><tr><th class="name-col">ФИО</th>`;
    for (let i = 1; i <= 30; i++) {
      html += `<th class="${weekends.includes(i) ? 'weekend' : ''}">${i}</th>`;
    }
    html += `</tr></thead><tbody>`;

    scheduleData.forEach(row => {
      html += `<tr><td class="name-col">${row.name}</td>`;
      for (let i = 1; i <= 30; i++) {
        const val = row.shifts[i] || "";
        let cellClass = "";
        if (val === "1219") cellClass = "cell-1219";
        else if (val === "1202") cellClass = "cell-1202";
        else if (val === "ОТП") cellClass = "cell-otp";
        
        html += `<td class="${cellClass} ${weekends.includes(i) ? 'weekend' : ''}">${val}</td>`;
      }
      html += `</tr>`;
    });
    html += `</tbody>`;
    tableEl.innerHTML = html;
  }

  // ОБРАБОТКА НАВИГАЦИИ
  navButtons.forEach(btn => {
    btn.onclick = () => {
      const screenId = btn.getAttribute("data-screen");
      navButtons.forEach(b => b.classList.remove("active"));
      screens.forEach(s => s.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`screen-${screenId}`).classList.add("active");

      // Смена заголовка
      const titles = { 
        main: ["База данных", "ЦТАИ АСУ ТП"], 
        charts: ["Графики", "Смены персонала"], 
        edu: ["Обучение", "Тесты и ПТЭ"], 
        support: ["Помощь", "Обратная связь"] 
      };
      pageTitle.textContent = titles[screenId][0];
      pageSubtitle.textContent = titles[screenId][1];

      // Сброс вложенных видов
      if (screenId !== 'charts') {
        chartsInit.hidden = false;
        scheduleContainer.hidden = true;
      }
    };
  });

  // Логика кнопок графика
  showScheduleBtn.onclick = () => { 
    renderTable(); 
    chartsInit.hidden = true; 
    scheduleContainer.hidden = false; 
  };
  backToCharts.onclick = () => { 
    scheduleContainer.hidden = true; 
    chartsInit.hidden = false; 
  };

  // ТЕМА
  themeToggle.onclick = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  // ЗАГРУЗКА ДАННЫХ ДЛЯ ГЛАВНОЙ
  let appData = null;
  fetch("data/instructions.json")
    .then(r => r.json())
    .then(json => {
      appData = json;
      const container = document.getElementById("tabs-main");
      container.innerHTML = "";
      json.categories.forEach(c => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = c.title;
        b.onclick = () => openCategory(c.id);
        container.appendChild(b);
      });
    })
    .catch(err => console.error("Ошибка загрузки JSON:", err));

  function openCategory(id) {
    const modal = document.getElementById("modal");
    const category = appData.categories.find(c => c.id === id);
    const items = appData.items.filter(it => it.categoryId === id);
    
    document.getElementById("modalTitle").textContent = category.title;
    const list = document.getElementById("modalList");
    
    if (items.length === 0) {
      list.innerHTML = "<li>Файлов пока нет</li>";
    } else {
      list.innerHTML = items.map(it => `
        <li>
          <a href="#" onclick="event.preventDefault(); window.open('https://docs.google.com/viewer?url=' + encodeURIComponent(new URL('${it.pdf}', window.location.href).href), '_blank')">
            ${it.title}
          </a>
        </li>
      `).join("");
    }
    modal.hidden = false;
  }

  // ЗАКРЫТИЕ МОДАЛКИ
  document.getElementById("modalClose").onclick = () => document.getElementById("modal").hidden = true;
  document.getElementById("modalBackdrop").onclick = () => document.getElementById("modal").hidden = true;

})();
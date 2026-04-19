(function () {
  const navButtons = document.querySelectorAll(".nav-item");
  const screens = document.querySelectorAll(".tab-content");
  const pageTitle = document.getElementById("pageTitle");
  const pageSubtitle = document.getElementById("pageSubtitle");
  const themeToggle = document.getElementById("themeToggle");

  const showScheduleBtn = document.getElementById("showScheduleBtn");
  const backToCharts = document.getElementById("backToCharts");
  const chartsInit = document.getElementById("charts-init");
  const scheduleContainer = document.getElementById("schedule-container");
  const tableEl = document.getElementById("work-schedule");

  const scheduleData = [
    { name: "Лагутенков Р.С.", shifts: { 3: "1219", 4: "1219", 8: "0828", 9: "1202", 13: "1219", 16: "1219", 17: "1202", 19: "1202", 21: "1202", 24: "1219", 25: "1202", 26: "1202", 28: "1219", 29: "1202" } },
    { name: "Миронов С.А.", shifts: { 3: "1219", 4: "1219", 10: "1202", 11: "0804", 12: "1219", 16: "1219", 17: "1202", 19: "1202", 21: "1202", 24: "1219", 25: "1202", 26: "1202", 28: "1219", 29: "1202" } },
    { name: "Куштанов А.А.", shifts: { 1: "1219", 2: "1202", 3: "1202", 7: "0828", 8: "1202", 12: "1219", 13: "1202", 17: "1219", 20: "1219", 23: "1219", 24: "1202", 28: "1202", 30: "1219" } },
    { name: "Рыжих И.Н.", shifts: { 18: "1219", 23: "1219", 24: "1202", 28: "1202", 30: "1219" } },
    { name: "Бондаренко Т.А.", shifts: { 28: "ОТП", 29: "ОТП", 30: "ОТП" } }
  ];

  const weekends = [4, 5, 11, 12, 18, 19, 25, 26];

  function renderTable() {
    let html = `<thead><tr><th class="name-col">Сотрудник</th>`;
    for (let i = 1; i <= 30; i++) {
      html += `<th class="${weekends.includes(i) ? 'weekend' : ''}">${i}</th>`;
    }
    html += `</tr></thead><tbody>`;

    scheduleData.forEach(row => {
      html += `<tr><td class="name-col" onclick="toggleFocus(this.parentElement)">${row.name}</td>`;
      for (let i = 1; i <= 30; i++) {
        const val = row.shifts[i] || "";
        let c = "";
        if (val === "1219") c = "cell-1219";
        else if (val === "1202") c = "cell-1202";
        else if (val === "ОТП") c = "cell-otp";
        html += `<td class="${c} ${weekends.includes(i) ? 'weekend' : ''}">${val}</td>`;
      }
      html += `</tr>`;
    });
    html += `</tbody>`;
    tableEl.innerHTML = html;
  }

  // ФУНКЦИЯ ФОКУСА (ИСПРАВЛЕННАЯ)
  window.toggleFocus = function(rowElement) {
    const isFocused = rowElement.classList.contains("focused-row");
    
    // Сбрасываем фокус со всех строк
    document.querySelectorAll("#work-schedule tr").forEach(r => r.classList.remove("focused-row"));
    
    if (isFocused) {
      // Если строка уже была в фокусе — выключаем режим блюра
      tableEl.classList.remove("has-focus");
    } else {
      // Иначе включаем блюр и выделяем текущую строку
      tableEl.classList.add("has-focus");
      rowElement.classList.add("focused-row");
    }
  };

  // НАВИГАЦИЯ
  navButtons.forEach(btn => {
    btn.onclick = () => {
      const screenId = btn.getAttribute("data-screen");
      navButtons.forEach(b => b.classList.remove("active"));
      screens.forEach(s => s.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`screen-${screenId}`).classList.add("active");
      
      const titles = { main:["База данных","ЦТАИ"], charts:["Графики","Смены"], edu:["Обучение","Тесты"], support:["Помощь","Связь"] };
      pageTitle.textContent = titles[screenId][0];
      pageSubtitle.textContent = titles[screenId][1];

      if (screenId !== 'charts') {
        chartsInit.hidden = false;
        scheduleContainer.hidden = true;
        tableEl.classList.remove("has-focus");
      }
    };
  });

  showScheduleBtn.onclick = () => { renderTable(); chartsInit.hidden = true; scheduleContainer.hidden = false; };
  backToCharts.onclick = () => { scheduleContainer.hidden = true; chartsInit.hidden = false; tableEl.classList.remove("has-focus"); };

  themeToggle.onclick = () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  // ДАННЫЕ PDF
  fetch("data/instructions.json").then(r => r.json()).then(json => {
    const container = document.getElementById("tabs-main");
    json.categories.forEach(c => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = c.title;
      b.onclick = () => {
        const items = json.items.filter(it => it.categoryId === c.id);
        document.getElementById("modalTitle").textContent = c.title;
        document.getElementById("modalList").innerHTML = items.map(it => `<li><a href="#" onclick="window.open('https://docs.google.com/viewer?url=' + encodeURIComponent(new URL('${it.pdf}', window.location.href).href), '_blank')">${it.title}</a></li>`).join("");
        document.getElementById("modal").hidden = false;
      };
      container.appendChild(b);
    });
  });

  document.getElementById("modalClose").onclick = () => document.getElementById("modal").hidden = true;
  document.getElementById("modalBackdrop").onclick = () => document.getElementById("modal").hidden = true;
})();
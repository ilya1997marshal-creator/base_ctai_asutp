(function () {
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalList = document.getElementById("modalList");
  const modalBackdrop = document.getElementById("modalBackdrop");
  const modalClose = document.getElementById("modalClose");
  const tabsEl = document.getElementById("tabs");

  const pdfViewer = document.getElementById("pdfViewer");
  const pdfFrame = document.getElementById("pdfFrame");
  const pdfTitle = document.getElementById("pdfTitle");
  const pdfClose = document.getElementById("pdfClose");
  const pdfOpenSafari = document.getElementById("pdfOpenSafari");

  let data = null;

  // Функция для открытия ссылки (надежный метод)
  function openInNewTab(href) {
    const a = document.createElement("a");
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function openModal() {
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    modalClose.focus();
  }

  function closeModal() {
    modal.hidden = true;
    if (pdfViewer.hidden) document.body.style.overflow = "";
  }

  function openPdfViewer(url, title) {
    if (!pdfFrame || !pdfViewer) return;
    
    // Создаем ПОЛНЫЙ путь к PDF файлу
    const pdfAbsolute = new URL(url, window.location.href).href;
    
    // Создаем путь к вьюеру
    const viewerUrl = new URL("pdfjs/web/viewer.html", window.location.href);
    
    // Важно: кодируем путь к файлу, чтобы не было проблем со спецсимволами
    viewerUrl.searchParams.set("file", pdfAbsolute);

    pdfTitle.textContent = title || "Документ";
    if (pdfOpenSafari) pdfOpenSafari.href = pdfAbsolute; // Прямая ссылка на файл как запасной вариант

    // Проверка на мобильное устройство
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                     || (navigator.maxTouchPoints > 0 && window.matchMedia("(max-width: 900px)").matches);

    if (isMobile) {
      // На Android пробуем открыть через вьюер в новой вкладке
      openInNewTab(viewerUrl.href);
      return;
    }

    // На ПК
    pdfFrame.src = viewerUrl.href;
    pdfViewer.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closePdfViewer() {
    if (!pdfFrame || !pdfViewer) return;
    pdfViewer.hidden = true;
    pdfFrame.src = "about:blank";
    if (modal.hidden) document.body.style.overflow = "";
  }

  function showBlock(category) {
    const items = (data.items || []).filter(function (i) {
      return i.categoryId === category.id;
    });

    modalTitle.textContent = category.title;
    modalList.innerHTML = "";

    if (items.length === 0) {
      const p = document.createElement("p");
      p.className = "empty-hint";
      p.textContent = "В этом блоке пока нет PDF.";
      modalList.appendChild(p);
    } else {
      items.forEach(function (item) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = item.pdf;
        a.textContent = item.title;
        a.addEventListener("click", function (e) {
          e.preventDefault();
          openPdfViewer(item.pdf, item.title);
        });
        li.appendChild(a);
        modalList.appendChild(li);
      });
    }

    openModal();
  }

  function renderTabs() {
    if (!tabsEl) return;
    tabsEl.innerHTML = "";
    data.categories.forEach(function (cat) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = cat.title;
      btn.addEventListener("click", function () {
        showBlock(cat);
      });
      tabsEl.appendChild(btn);
    });
  }

  if (modalBackdrop) modalBackdrop.addEventListener("click", closeModal);
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (pdfClose) pdfClose.addEventListener("click", closePdfViewer);

  // Загрузка данных
  fetch("data/instructions.json")
    .then(function (r) {
      if (!r.ok) throw new Error("Ошибка загрузки JSON");
      return r.json();
    })
    .then(function (json) {
      data = json;
      renderTabs();
    })
    .catch(function (err) {
      console.error(err);
      if (tabsEl) tabsEl.innerHTML = "<p style='color:red'>Ошибка загрузки данных</p>";
    });

  // Закрытие по Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (!pdfViewer.hidden) closePdfViewer();
      else if (!modal.hidden) closeModal();
    }
  });
})();
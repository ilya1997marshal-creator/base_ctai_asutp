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

  // Функция для открытия ссылки в новой вкладке (надежный метод для мобильных)
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
    
    // Формируем абсолютные пути для корректной работы PDF.js
    const pdfAbsolute = new URL(url, window.location.href).href;
    const viewerUrl = new URL("pdfjs/web/viewer.html", window.location.href);
    viewerUrl.searchParams.set("file", pdfAbsolute);

    pdfTitle.textContent = title || "Документ";
    if (pdfOpenSafari) pdfOpenSafari.href = viewerUrl.href;

    // ОПРЕДЕЛЕНИЕ МОБИЛЬНОГО УСТРОЙСТВА (Android, iPhone, iPad и т.д.)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                     || (navigator.maxTouchPoints > 0 && window.matchMedia("(max-width: 900px)").matches);

    if (isMobile) {
      // На Android и iOS открываем просмотрщик в новой вкладке браузера
      openInNewTab(viewerUrl.href);
      return;
    }

    // На компьютерах открываем во встроенном фрейме поверх страницы
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
      p.textContent =
        "В этом блоке пока нет PDF. Добавьте файлы в папку pdfs и записи в data/instructions.json.";
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

  // Обработчики событий
  if (modalBackdrop) modalBackdrop.addEventListener("click", closeModal);
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (pdfClose) pdfClose.addEventListener("click", closePdfViewer);

  if (pdfOpenSafari) {
    pdfOpenSafari.addEventListener("click", function () {
      // Небольшая задержка перед закрытием вьюера, чтобы ссылка успела сработать
      setTimeout(closePdfViewer, 100);
    });
  }

  // Закрытие по кнопке Escape
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (pdfViewer && !pdfViewer.hidden) {
      closePdfViewer();
      e.preventDefault();
      return;
    }
    if (modal && !modal.hidden) closeModal();
  });

  // Загрузка данных
  fetch("data/instructions.json")
    .then(function (r) {
      if (!r.ok) throw new Error("Не удалось загрузить data/instructions.json");
      return r.json();
    })
    .then(function (json) {
      data = json;
      renderTabs();
    })
    .catch(function (err) {
      console.error(err);
      if (tabsEl) {
        tabsEl.innerHTML =
          "<p style='padding:1rem;color:#b91c1c'>Ошибка загрузки данных. Убедитесь, что файл data/instructions.json существует и формат JSON корректен.</p>";
      }
    });
})();
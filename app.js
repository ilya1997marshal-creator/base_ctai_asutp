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
  }

  function closeModal() {
    modal.hidden = true;
    if (pdfViewer.hidden) document.body.style.overflow = "";
  }

  function openPdfViewer(url, title) {
    // 1. Создаем абсолютно точный путь
    const pdfAbsolute = new URL(url, window.location.href).href;
    
    const ua = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua) || (navigator.maxTouchPoints > 0 && window.matchMedia("(max-width: 900px)").matches);

    // Если это мобилка или Яндекс — просто переходим по ссылке
    if (isMobile || ua.includes("YaBrowser")) {
      console.log("Opening direct link:", pdfAbsolute);
      window.location.href = pdfAbsolute; // Пробуем открыть в текущем окне для надежности
      return;
    }

    // Для ПК
    if (pdfFrame && pdfViewer) {
      const viewerUrl = new URL("pdfjs/web/viewer.html", window.location.href);
      viewerUrl.searchParams.set("file", pdfAbsolute);
      pdfTitle.textContent = title || "Документ";
      pdfFrame.src = viewerUrl.href;
      pdfViewer.hidden = false;
      document.body.style.overflow = "hidden";
    }
  }

  function closePdfViewer() {
    pdfViewer.hidden = true;
    pdfFrame.src = "about:blank";
    if (modal.hidden) document.body.style.overflow = "";
  }

  function showBlock(category) {
    const items = (data.items || []).filter(i => i.categoryId === category.id);
    modalTitle.textContent = category.title;
    modalList.innerHTML = "";

    if (items.length === 0) {
      modalList.innerHTML = "<li>В этом блоке пока нет PDF.</li>";
    } else {
      items.forEach(item => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        // ВАЖНО: добавляем параметр версии к самому PDF, чтобы убить кэш файла
        const pdfWithVersion = item.pdf + "?v=" + new Date().getTime();
        a.href = pdfWithVersion;
        a.textContent = item.title;
        a.addEventListener("click", e => {
          e.preventDefault();
          openPdfViewer(pdfWithVersion, item.title);
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
    data.categories.forEach(cat => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = cat.title;
      btn.onclick = () => showBlock(cat);
      tabsEl.appendChild(btn);
    });
  }

  if (modalBackdrop) modalBackdrop.onclick = closeModal;
  if (modalClose) modalClose.onclick = closeModal;
  if (pdfClose) pdfClose.onclick = closePdfViewer;

  fetch("data/instructions.json")
    .then(r => r.json())
    .then(json => {
      data = json;
      renderTabs();
    })
    .catch(err => {
      console.error("Data error:", err);
      alert("Ошибка загрузки JSON. Проверьте файл data/instructions.json");
    });
})();
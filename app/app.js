(function () {
  "use strict";

  var COLS = 7;
  var ROWS = 3;
  var PAGE_SIZE = COLS * ROWS;
  var MAX_FAVORITES = 7;
  var FAVORITES_KEY = "cleanyourtv.favorites.v2";
  var FIRST_RUN_KEY = "cleanyourtv.favorites.initialized.v2";

  var favoritesEl = document.getElementById("favorites");
  var gridEl = document.getElementById("grid");
  var focusedNameEl = document.getElementById("focusedName");
  var focusedMetaEl = document.getElementById("focusedMeta");
  var favoriteCountEl = document.getElementById("favoriteCount");
  var pageInfoEl = document.getElementById("pageInfo");
  var toastEl = document.getElementById("toast");

  var allApps = [];
  var favoriteIds = [];
  var favoriteApps = [];
  var pageApps = [];
  var section = "favorites";
  var focusIndex = 0;
  var page = 0;
  var lastFocusedTile = null;
  var toastTimer = null;
  var loading = false;

  var preferredNames = [
    "youtube", "tizentube", "netflix", "internet", "browser",
    "fpt play", "vieon", "galaxy play", "spotify", "prime video",
    "apple tv", "jellyfin", "plex"
  ];

  function safeText(v) {
    return v == null ? "" : String(v);
  }

  function lower(v) {
    return safeText(v).toLowerCase();
  }

  function toast(message) {
    toastEl.textContent = message;
    toastEl.className = "show";
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.className = "";
    }, 2200);
  }

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function updateClock() {
    var d = new Date();
    var hh = ("0" + d.getHours()).slice(-2);
    var mm = ("0" + d.getMinutes()).slice(-2);
    var days = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
    var months = ["tháng 1", "tháng 2", "tháng 3", "tháng 4", "tháng 5", "tháng 6",
                  "tháng 7", "tháng 8", "tháng 9", "tháng 10", "tháng 11", "tháng 12"];
    document.getElementById("clock").textContent = hh + ":" + mm;
    document.getElementById("date").textContent =
      days[d.getDay()] + ", " + d.getDate() + " " + months[d.getMonth()];
  }

  function initials(name) {
    var clean = safeText(name).replace(/[^a-zA-Z0-9À-ỹ ]/g, " ");
    var parts = clean.split(/\s+/);
    var result = "";
    var i;
    for (i = 0; i < parts.length && result.length < 3; i++) {
      if (parts[i]) result += parts[i].charAt(0).toUpperCase();
    }
    return result || "APP";
  }

  function hasFavorite(id) {
    var i;
    for (i = 0; i < favoriteIds.length; i++) {
      if (favoriteIds[i] === id) return true;
    }
    return false;
  }

  function appendInitials(parent, name) {
    var fallback = document.createElement("div");
    fallback.className = "initials";
    fallback.textContent = initials(name);
    parent.appendChild(fallback);
  }

  function makeTile(info) {
    var tile = document.createElement("div");
    tile.className = "tile" + (hasFavorite(info.id) ? " favoriteMark" : "");
    tile.setAttribute("data-app-id", info.id);

    var iconWrap = document.createElement("div");
    iconWrap.className = "iconWrap";

    if (info.iconPath) {
      var img = document.createElement("img");
      img.alt = "";
      img.src = info.iconPath;
      img.onerror = function () {
        if (!img.parentNode) return;
        img.parentNode.removeChild(img);
        appendInitials(iconWrap, info.name);
      };
      iconWrap.appendChild(img);
    } else {
      appendInitials(iconWrap, info.name);
    }

    var label = document.createElement("div");
    label.className = "label";
    label.textContent = info.name;

    tile.appendChild(iconWrap);
    tile.appendChild(label);
    return tile;
  }

  function currentApp() {
    if (section === "favorites") {
      return favoriteApps[focusIndex] || null;
    }
    return pageApps[focusIndex] || null;
  }

  function currentTiles() {
    return section === "favorites" ? favoritesEl.children : gridEl.children;
  }

  function renderFavorites() {
    favoritesEl.innerHTML = "";
    favoriteApps = [];

    var i, j;
    for (i = 0; i < favoriteIds.length; i++) {
      for (j = 0; j < allApps.length; j++) {
        if (allApps[j].id === favoriteIds[i]) {
          favoriteApps.push(allApps[j]);
          break;
        }
      }
    }

    if (favoriteApps.length !== favoriteIds.length) {
      favoriteIds = [];
      for (i = 0; i < favoriteApps.length; i++) {
        favoriteIds.push(favoriteApps[i].id);
      }
      writeJson(FAVORITES_KEY, favoriteIds);
    }

    if (!favoriteApps.length) {
      var empty = document.createElement("div");
      empty.className = "emptyFavorites";
      empty.textContent = "Chọn một ứng dụng bên dưới rồi bấm nút XANH LÁ để ghim";
      favoritesEl.appendChild(empty);
    } else {
      for (i = 0; i < favoriteApps.length; i++) {
        favoritesEl.appendChild(makeTile(favoriteApps[i]));
      }
    }

    favoriteCountEl.textContent = favoriteApps.length + "/" + MAX_FAVORITES;
  }

  function renderGrid() {
    gridEl.innerHTML = "";

    var count = Math.max(1, Math.ceil(allApps.length / PAGE_SIZE));
    if (page >= count) page = count - 1;
    if (page < 0) page = 0;

    var start = page * PAGE_SIZE;
    var end = Math.min(start + PAGE_SIZE, allApps.length);
    pageApps = allApps.slice(start, end);

    var i;
    for (i = 0; i < pageApps.length; i++) {
      gridEl.appendChild(makeTile(pageApps[i]));
    }

    pageInfoEl.textContent =
      allApps.length + " app • Trang " + (page + 1) + "/" + count;
  }

  function normalizeFocus() {
    var list = section === "favorites" ? favoriteApps : pageApps;

    if (section === "favorites" && !favoriteApps.length) {
      section = "grid";
      focusIndex = 0;
      list = pageApps;
    }

    if (!list.length) {
      focusIndex = 0;
      return;
    }

    if (focusIndex < 0) focusIndex = 0;
    if (focusIndex >= list.length) focusIndex = list.length - 1;
  }

  function applyFocus() {
    if (lastFocusedTile) {
      lastFocusedTile.classList.remove("focused");
      lastFocusedTile = null;
    }

    normalizeFocus();

    var app = currentApp();
    var tiles = currentTiles();

    if (!app) {
      focusedNameEl.textContent =
        allApps.length ? "Chọn ứng dụng" : "Không có ứng dụng";
      focusedMetaEl.textContent = "";
      return;
    }

    if (tiles[focusIndex] &&
        tiles[focusIndex].classList &&
        tiles[focusIndex].classList.contains("tile")) {
      lastFocusedTile = tiles[focusIndex];
      lastFocusedTile.classList.add("focused");
    }

    focusedNameEl.textContent = app.name;
    focusedMetaEl.textContent =
      (section === "favorites" ? "Yêu thích" : "Tất cả ứng dụng") +
      " • " + (hasFavorite(app.id) ? "Đã ghim" : "Chưa ghim");
  }

  function renderAll(keepFocus) {
    var previousId = keepFocus && currentApp() ? currentApp().id : "";

    renderFavorites();
    renderGrid();

    if (previousId) {
      var list = section === "favorites" ? favoriteApps : pageApps;
      var i;
      for (i = 0; i < list.length; i++) {
        if (list[i].id === previousId) {
          focusIndex = i;
          break;
        }
      }
    }

    normalizeFocus();
    applyFocus();
  }

  function defaultFavorites() {
    var chosen = [];
    var used = {};
    var i, j, name;

    for (i = 0;
         i < preferredNames.length && chosen.length < 5;
         i++) {
      for (j = 0; j < allApps.length; j++) {
        name = lower(allApps[j].name);
        if (!used[allApps[j].id] &&
            name.indexOf(preferredNames[i]) !== -1) {
          chosen.push(allApps[j].id);
          used[allApps[j].id] = true;
          break;
        }
      }
    }

    for (i = 0; i < allApps.length && chosen.length < 5; i++) {
      if (!used[allApps[i].id]) {
        chosen.push(allApps[i].id);
        used[allApps[i].id] = true;
      }
    }

    return chosen;
  }

  function ensureFavorites() {
    var initialized = false;

    try {
      initialized = localStorage.getItem(FIRST_RUN_KEY) === "1";
    } catch (e) {}

    if (!initialized) {
      favoriteIds = defaultFavorites();
      writeJson(FAVORITES_KEY, favoriteIds);
      try {
        localStorage.setItem(FIRST_RUN_KEY, "1");
      } catch (e2) {}
    } else {
      favoriteIds = readJson(FAVORITES_KEY, []);
      if (!favoriteIds || typeof favoriteIds.length !== "number") {
        favoriteIds = [];
      }
      if (favoriteIds.length > MAX_FAVORITES) {
        favoriteIds = favoriteIds.slice(0, MAX_FAVORITES);
      }
    }
  }

  function toggleFavorite() {
    var app = currentApp();
    if (!app) return;

    var i;
    var next = [];

    if (hasFavorite(app.id)) {
      for (i = 0; i < favoriteIds.length; i++) {
        if (favoriteIds[i] !== app.id) next.push(favoriteIds[i]);
      }

      favoriteIds = next;
      writeJson(FAVORITES_KEY, favoriteIds);
      toast("Đã bỏ ghim " + app.name);

      if (section === "favorites") {
        renderFavorites();
        if (!favoriteApps.length) {
          section = "grid";
          focusIndex = 0;
        } else if (focusIndex >= favoriteApps.length) {
          focusIndex = favoriteApps.length - 1;
        }
        renderGrid();
        applyFocus();
      } else {
        renderAll(true);
      }

      return;
    }

    if (favoriteIds.length >= MAX_FAVORITES) {
      toast("Favorites đã đủ " + MAX_FAVORITES + " ứng dụng");
      return;
    }

    favoriteIds.push(app.id);
    writeJson(FAVORITES_KEY, favoriteIds);
    toast("Đã ghim " + app.name);
    renderAll(true);
  }

  function launchCurrent() {
    var app = currentApp();
    if (!app) return;

    if (!(window.tizen &&
          tizen.application &&
          tizen.application.launch)) {
      toast("Tizen Application API không khả dụng");
      return;
    }

    try {
      tizen.application.launch(
        app.id,
        function () {},
        function (err) {
          toast(
            "Không mở được " + app.name +
            (err && err.message ? ": " + err.message : "")
          );
        }
      );
    } catch (e) {
      toast("Không mở được " + app.name);
    }
  }

  function pageCount() {
    return Math.max(1, Math.ceil(allApps.length / PAGE_SIZE));
  }

  function changePage(delta) {
    var next = page + delta;
    var count = pageCount();

    if (next < 0 || next >= count) return;

    page = next;
    section = "grid";
    focusIndex = 0;
    renderGrid();
    applyFocus();
  }

  function moveLeft() {
    if (section === "favorites") {
      if (focusIndex > 0) focusIndex--;
    } else {
      var col = focusIndex % COLS;
      if (col > 0) focusIndex--;
    }
    applyFocus();
  }

  function moveRight() {
    var list = section === "favorites" ? favoriteApps : pageApps;

    if (section === "favorites") {
      if (focusIndex + 1 < list.length) focusIndex++;
    } else {
      var col = focusIndex % COLS;
      if (col < COLS - 1 && focusIndex + 1 < list.length) {
        focusIndex++;
      }
    }

    applyFocus();
  }

  function moveDown() {
    if (section === "favorites") {
      section = "grid";
      focusIndex = Math.min(
        focusIndex,
        Math.max(0, pageApps.length - 1)
      );
    } else {
      var target = focusIndex + COLS;
      if (target < pageApps.length) focusIndex = target;
    }

    applyFocus();
  }

  function moveUp() {
    if (section === "grid") {
      var target = focusIndex - COLS;

      if (target >= 0) {
        focusIndex = target;
      } else if (favoriteApps.length) {
        section = "favorites";
        focusIndex = Math.min(
          focusIndex % COLS,
          favoriteApps.length - 1
        );
      }
    }

    applyFocus();
  }

  function goBack() {
    try {
      if (window.history && history.length > 1) {
        history.back();
        return;
      }
    } catch (e) {}

    try {
      if (window.tizen && tizen.application) {
        tizen.application.getCurrentApplication().exit();
      }
    } catch (e2) {}
  }

  function isLikelyHiddenSystemApp(app) {
    var name = lower(app.name);
    var id = lower(app.id);

    if (!name) return true;
    if (name.indexOf("com.") === 0) return true;

    if ((name.indexOf("service") !== -1 ||
         name.indexOf("daemon") !== -1) &&
        (id.indexOf("service") !== -1 ||
         id.indexOf("daemon") !== -1)) {
      return true;
    }

    return false;
  }

  function normalizeApps(apps) {
    var currentId = "";
    try {
      currentId =
        tizen.application.getCurrentApplication().appInfo.id;
    } catch (e) {}

    var seen = {};
    var out = [];
    var i, app, info;

    for (i = 0; i < apps.length; i++) {
      app = apps[i];

      if (!app || !app.id || app.id === currentId) continue;
      if (app.show === false) continue;
      if (seen[app.id]) continue;

      info = {
        id: app.id,
        name: app.name || app.id,
        iconPath: app.iconPath || "",
        packageId: app.packageId || ""
      };

      if (isLikelyHiddenSystemApp(info)) continue;

      seen[app.id] = true;
      out.push(info);
    }

    out.sort(function (a, b) {
      var aa = lower(a.name);
      var bb = lower(b.name);
      if (aa < bb) return -1;
      if (aa > bb) return 1;
      return 0;
    });

    return out;
  }

  function loadApps(showMessage) {
    if (loading) return;

    loading = true;
    focusedNameEl.textContent = "Đang đọc ứng dụng…";
    focusedMetaEl.textContent = "";

    if (!(window.tizen &&
          tizen.application &&
          tizen.application.getAppsInfo)) {
      loading = false;

      allApps = [
        { id: "demo.youtube", name: "YouTube", iconPath: "" },
        { id: "demo.netflix", name: "Netflix", iconPath: "" },
        { id: "demo.internet", name: "Internet", iconPath: "" },
        { id: "demo.spotify", name: "Spotify", iconPath: "" },
        { id: "demo.apple", name: "Apple TV", iconPath: "" }
      ];

      ensureFavorites();
      page = 0;
      renderAll(false);
      toast("Đang ở chế độ demo: không thấy Tizen API");
      return;
    }

    try {
      tizen.application.getAppsInfo(
        function (apps) {
          loading = false;
          allApps = normalizeApps(apps || []);
          ensureFavorites();

          if (page >= pageCount()) {
            page = pageCount() - 1;
          }

          renderAll(false);

          if (showMessage) {
            toast("Đã làm mới " + allApps.length + " ứng dụng");
          }

          if (!allApps.length) {
            toast("Không tìm thấy ứng dụng hiển thị được");
          }
        },
        function (err) {
          loading = false;
          toast(
            "Không đọc được danh sách app" +
            (err && err.message ? ": " + err.message : "")
          );
          renderAll(false);
        }
      );
    } catch (e) {
      loading = false;
      toast("Lỗi Tizen API: " + e.message);
      renderAll(false);
    }
  }

  function onKey(e) {
    var code = e.keyCode || e.which;

    if (code === 37) {
      moveLeft();
    } else if (code === 39) {
      moveRight();
    } else if (code === 38) {
      moveUp();
    } else if (code === 40) {
      moveDown();
    } else if (code === 13) {
      launchCurrent();
    } else if (code === 10009 || code === 27) {
      goBack();
    } else if (code === 403) {
      changePage(-1);
    } else if (code === 404) {
      toggleFavorite();
    } else if (code === 405) {
      loadApps(true);
    } else if (code === 406) {
      changePage(1);
    } else {
      return;
    }

    if (e.preventDefault) e.preventDefault();
  }

  window.addEventListener("keydown", onKey, false);

  updateClock();
  setInterval(updateClock, 30000);
  loadApps(false);
})();

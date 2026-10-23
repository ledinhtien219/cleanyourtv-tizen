(function () {
  "use strict";

  var dockEl = document.getElementById("dock");
  var gridEl = document.getElementById("grid");
  var focusedNameEl = document.getElementById("focusedName");
  var countEl = document.getElementById("count");
  var appsSectionEl = document.getElementById("appsSection");
  var ambientEl = document.getElementById("ambient");
  var toastEl = document.getElementById("toast");

  var allApps = [];
  var dockApps = [];
  var gridApps = [];
  var section = "dock";
  var index = 0;
  var columns = 7;
  var toastTimer = null;

  var preferred = [
    "youtube", "netflix", "browser", "internet", "fpt",
    "vieon", "galaxy play", "spotify", "plex", "prime",
    "apple tv", "jellyfin"
  ];

  function safeText(v) {
    return (v == null ? "" : String(v));
  }

  function initials(name) {
    var parts = safeText(name).replace(/[^a-zA-Z0-9À-ỹ ]/g, " ").split(/\s+/);
    var out = "";
    var i;
    for (i = 0; i < parts.length && out.length < 3; i++) {
      if (parts[i]) out += parts[i].charAt(0).toUpperCase();
    }
    return out || "APP";
  }

  function colorFor(name) {
    var h = 0, i;
    name = safeText(name);
    for (i = 0; i < name.length; i++) h = ((h << 5) - h) + name.charCodeAt(i);
    h = Math.abs(h) % 360;
    return "hsla(" + h + ",70%,55%,.27)";
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.className = "show";
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.className = ""; }, 2300);
  }

  function updateClock() {
    var d = new Date();
    var hh = ("0" + d.getHours()).slice(-2);
    var mm = ("0" + d.getMinutes()).slice(-2);
    var days = ["Chủ nhật","Thứ hai","Thứ ba","Thứ tư","Thứ năm","Thứ sáu","Thứ bảy"];
    var months = ["tháng 1","tháng 2","tháng 3","tháng 4","tháng 5","tháng 6",
                  "tháng 7","tháng 8","tháng 9","tháng 10","tháng 11","tháng 12"];
    document.getElementById("clock").textContent = hh + ":" + mm;
    document.getElementById("date").textContent =
      days[d.getDay()] + ", " + d.getDate() + " " + months[d.getMonth()];
  }

  function makeTile(info) {
    var tile = document.createElement("div");
    tile.className = "tile";
    tile.setAttribute("data-app-id", info.id);

    var wrap = document.createElement("div");
    wrap.className = "iconWrap";

    if (info.iconPath) {
      var img = document.createElement("img");
      img.src = info.iconPath;
      img.alt = "";
      img.onerror = function () {
        if (img.parentNode) {
          img.parentNode.removeChild(img);
          var fallback = document.createElement("div");
          fallback.className = "initials";
          fallback.textContent = initials(info.name);
          wrap.appendChild(fallback);
        }
      };
      wrap.appendChild(img);
    } else {
      var fallback2 = document.createElement("div");
      fallback2.className = "initials";
      fallback2.textContent = initials(info.name);
      wrap.appendChild(fallback2);
    }

    var label = document.createElement("div");
    label.className = "label";
    label.textContent = info.name;

    tile.appendChild(wrap);
    tile.appendChild(label);
    return tile;
  }

  function chooseDock(apps) {
    var chosen = [];
    var used = {};
    var i, j, n;

    for (i = 0; i < preferred.length && chosen.length < 5; i++) {
      for (j = 0; j < apps.length; j++) {
        n = safeText(apps[j].name).toLowerCase();
        if (!used[apps[j].id] && n.indexOf(preferred[i]) !== -1) {
          chosen.push(apps[j]);
          used[apps[j].id] = true;
          break;
        }
      }
    }

    for (i = 0; i < apps.length && chosen.length < 5; i++) {
      if (!used[apps[i].id]) {
        chosen.push(apps[i]);
        used[apps[i].id] = true;
      }
    }

    return chosen;
  }

  function render() {
    dockEl.innerHTML = "";
    gridEl.innerHTML = "";

    dockApps = chooseDock(allApps);
    var dockIds = {};
    var i;

    for (i = 0; i < dockApps.length; i++) {
      dockIds[dockApps[i].id] = true;
      dockEl.appendChild(makeTile(dockApps[i]));
    }

    gridApps = [];
    for (i = 0; i < allApps.length; i++) {
      if (!dockIds[allApps[i].id]) gridApps.push(allApps[i]);
    }

    for (i = 0; i < gridApps.length; i++) {
      gridEl.appendChild(makeTile(gridApps[i]));
    }

    countEl.textContent = allApps.length + " app";
    section = dockApps.length ? "dock" : "grid";
    index = 0;
    applyFocus();
  }

  function currentList() {
    return section === "dock" ? dockApps : gridApps;
  }

  function currentTiles() {
    return section === "dock" ? dockEl.children : gridEl.children;
  }

  function applyFocus() {
    var i;
    var allTiles = document.querySelectorAll(".tile");

    for (i = 0; i < allTiles.length; i++) {
      allTiles[i].classList.remove("focused");
    }

    var list = currentList();
    var tiles = currentTiles();

    if (!list.length) {
      focusedNameEl.textContent = "Không có ứng dụng";
      return;
    }

    if (index < 0) index = 0;
    if (index >= list.length) index = list.length - 1;

    if (tiles[index]) tiles[index].classList.add("focused");

    focusedNameEl.textContent = list[index].name || "Ứng dụng";
    ambientEl.style.background = colorFor(list[index].name);
    appsSectionEl.className = section === "grid" ? "active" : "";

    if (section === "grid" && tiles[index] && tiles[index].scrollIntoView) {
      try { tiles[index].scrollIntoView(false); } catch (e) {}
    }
  }

  function launchCurrent() {
    var list = currentList();
    if (!list.length || !list[index]) return;

    var info = list[index];

    if (window.tizen && tizen.application && tizen.application.launch) {
      try {
        tizen.application.launch(
          info.id,
          function () {},
          function (e) {
            toast("Không mở được " + info.name + ": " +
              (e && e.message ? e.message : "lỗi"));
          }
        );
      } catch (e2) {
        toast("Không mở được " + info.name);
      }
    } else {
      toast("Tizen Application API không khả dụng");
    }
  }

  function moveLeft() {
    if (index > 0) index--;
    applyFocus();
  }

  function moveRight() {
    if (index + 1 < currentList().length) index++;
    applyFocus();
  }

  function moveDown() {
    if (section === "dock" && gridApps.length) {
      section = "grid";
      index = Math.min(index, gridApps.length - 1);
    } else if (section === "grid") {
      var n = index + columns;
      if (n < gridApps.length) index = n;
    }
    applyFocus();
  }

  function moveUp() {
    if (section === "grid") {
      if (index - columns >= 0) {
        index -= columns;
      } else if (dockApps.length) {
        section = "dock";
        index = Math.min(index, dockApps.length - 1);
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

  function onKey(e) {
    var code = e.keyCode || e.which;

    if (code === 37) {
      moveLeft();
      e.preventDefault();
    } else if (code === 39) {
      moveRight();
      e.preventDefault();
    } else if (code === 38) {
      moveUp();
      e.preventDefault();
    } else if (code === 40) {
      moveDown();
      e.preventDefault();
    } else if (code === 13) {
      launchCurrent();
      e.preventDefault();
    } else if (code === 10009 || code === 27) {
      goBack();
      e.preventDefault();
    } else if (code === 405) {
      loadApps();
      e.preventDefault();
    }
  }

  function normalizeApps(apps) {
    var currentId = "";

    try {
      currentId = tizen.application.getCurrentApplication().appInfo.id;
    } catch (e) {}

    var out = [];
    var i, a;

    for (i = 0; i < apps.length; i++) {
      a = apps[i];

      if (!a || !a.id || a.id === currentId) continue;
      if (a.show === false) continue;

      out.push({
        id: a.id,
        name: a.name || a.id,
        iconPath: a.iconPath || "",
        packageId: a.packageId || ""
      });
    }

    out.sort(function (x, y) {
      return safeText(x.name).toLowerCase()
        .localeCompare(safeText(y.name).toLowerCase());
    });

    return out;
  }

  function loadApps() {
    focusedNameEl.textContent = "Đang đọc ứng dụng…";

    if (!(window.tizen &&
          tizen.application &&
          tizen.application.getAppsInfo)) {
      allApps = [
        { id: "demo.youtube", name: "YouTube", iconPath: "" },
        { id: "demo.netflix", name: "Netflix", iconPath: "" },
        { id: "demo.browser", name: "Internet", iconPath: "" },
        { id: "demo.apps", name: "Apps", iconPath: "" }
      ];

      render();
      toast("Đang ở chế độ demo: không thấy Tizen API");
      return;
    }

    try {
      tizen.application.getAppsInfo(
        function (apps) {
          allApps = normalizeApps(apps || []);
          render();

          if (!allApps.length) {
            toast("Không tìm thấy app hiển thị được");
          }
        },
        function (err) {
          allApps = [];
          render();
          toast("Không đọc được danh sách app: " +
            (err && err.message ? err.message : "lỗi"));
        }
      );
    } catch (e) {
      allApps = [];
      render();
      toast("Lỗi Tizen API: " + e.message);
    }
  }

  window.addEventListener("keydown", onKey, false);

  updateClock();
  setInterval(updateClock, 15000);
  loadApps();
})();

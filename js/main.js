(function () {
  var saved = localStorage.getItem("site-lang");
  var lang = saved === "en" || saved === "zh" ? saved : "zh";

  function apply(next) {
    lang = next;
    document.body.dataset.lang = next;
    document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
    localStorage.setItem("site-lang", next);
    document.querySelectorAll(".lang button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.dataset.setLang === next ? "true" : "false");
    });
  }

  document.querySelectorAll(".lang button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      apply(btn.dataset.setLang);
    });
  });
  apply(lang);

  var links = Array.prototype.slice.call(document.querySelectorAll(".nav a"));
  var sections = links
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);

  function spy() {
    var mark = window.scrollY + 120;
    var current = sections[0];
    sections.forEach(function (sec) {
      if (sec.offsetTop <= mark) current = sec;
    });
    links.forEach(function (link) {
      link.classList.toggle("active", current && link.getAttribute("href") === "#" + current.id);
    });
  }
  window.addEventListener("scroll", spy, { passive: true });
  spy();

  var grid = document.getElementById("gallery");
  var files = (Array.isArray(window.GALLERY) ? window.GALLERY.filter(Boolean) : []).slice();
  var photos = [];

  function shuffled(list) {
    var arr = list.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var swap = arr[i];
      arr[i] = arr[j];
      arr[j] = swap;
    }
    return arr;
  }

  function pack() {
    var ready = photos.filter(function (img) { return img.naturalWidth; });
    if (!grid || !ready.length) return;
    ready.forEach(function (img) { img.style.width = "1px"; });
    var width = grid.clientWidth;
    if (!width) return;
    var target = width < 700 ? 150 : 200;
    var rows = [];
    var row = [];
    var sum = 0;
    ready.forEach(function (img) {
      var ratio = img.naturalWidth / img.naturalHeight;
      if (row.length && (sum + ratio) * target > width) {
        rows.push(row);
        row = [];
        sum = 0;
      }
      row.push({ img: img, ratio: ratio });
      sum += ratio;
    });
    if (row.length) rows.push(row);
    grid.innerHTML = "";
    rows.forEach(function (items) {
      var ratioSum = items.reduce(function (acc, item) { return acc + item.ratio; }, 0);
      var height = width / ratioSum;
      var rowEl = document.createElement("div");
      rowEl.className = "mosaic-row";
      var used = 0;
      items.forEach(function (item, index) {
        var itemWidth = index === items.length - 1 ? width - used : Math.round(height * item.ratio);
        used += itemWidth;
        item.img.style.width = itemWidth + "px";
        item.img.style.height = Math.round(height) + "px";
        rowEl.appendChild(item.img);
      });
      grid.appendChild(rowEl);
    });
  }

  function whenReady(fn) {
    var pending = 0;
    photos.forEach(function (img) {
      if (!img.complete) pending += 1;
    });
    if (!pending) {
      fn();
      return;
    }
    photos.forEach(function (img) {
      if (img.complete) return;
      function done() {
        pending -= 1;
        if (!pending) fn();
      }
      img.addEventListener("load", done);
      img.addEventListener("error", done);
    });
  }

  function showGallery() {
    var count = 8 + Math.floor(Math.random() * 5);
    var chosen = shuffled(files).slice(0, Math.min(count, files.length));
    photos = chosen.map(function (file) {
      var img = document.createElement("img");
      img.src = "assets/gallery/" + file;
      img.alt = "";
      return img;
    });
    if (grid) grid.innerHTML = "";
    whenReady(pack);
  }

  var shuffleBtn = document.getElementById("gallery-shuffle");
  if (shuffleBtn) shuffleBtn.addEventListener("click", showGallery);
  showGallery();
  window.addEventListener("resize", pack);

  var box = document.getElementById("lightbox");
  var view = document.getElementById("lightbox-img");
  grid.addEventListener("click", function (event) {
    var img = event.target.closest("img");
    if (!img) return;
    view.src = img.src;
    view.alt = img.alt;
    box.classList.add("open");
  });
  box.addEventListener("click", function () {
    box.classList.remove("open");
    view.src = "";
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      box.classList.remove("open");
      view.src = "";
    }
  });

  var news = document.getElementById("news-list");
  var newsBtn = document.getElementById("news-toggle");
  if (news && newsBtn) {
    newsBtn.addEventListener("click", function () {
      var open = news.classList.toggle("is-collapsed") === false;
      newsBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  var cite = document.getElementById("cite-count");
  if (cite) {
    fetch("assets/citations.json?t=" + Date.now())
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var count = parseInt(data && data.citations, 10);
        if (count >= 50 && count < 1000000) cite.textContent = String(count);
      })
      .catch(function () {});
  }
})();

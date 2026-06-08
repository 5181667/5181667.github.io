// professional placeholder cover markup
function phCover(c) {
  const stackTxt = (c.stack || c.tags).slice(0, 4).join(" · ");
  return `<div class="ph-pro" style="--g1:${c.g1};--g2:${c.g2}">
      <div class="ph-net"></div>
      <div class="ph-bar"><i></i><i></i><i></i></div>
      <div class="ph-emoji">${c.emoji}</div>
      <div class="ph-core">
        <div class="ph-title">${c.title}</div>
        <div class="ph-stack">${stackTxt}</div>
      </div>
      <div class="ph-hint">封面待替换</div>
    </div>`;
}

const grid = document.getElementById("cases-grid");
CASES.forEach((c, i) => {
  const src = c.img || c.cover;
  const imgTag = src
    ? `<img src="${src}" alt="${c.title}" loading="lazy" onerror="this.style.display='none'">`
    : "";
  const cover = `<div class="case-cover">${phCover(c)}${imgTag}<span class="case-cat">${c.catName}</span></div>`;
  const miniFeats = c.features.slice(0, 4).map(f => `<li><span class="ck">✓</span>${f}</li>`).join("");
  const el = document.createElement("article");
  el.className = "case reveal";
  el.dataset.cat = c.cat;
  el.style.transitionDelay = (i % 3) * 0.07 + "s";
  el.innerHTML = `${cover}
    <div class="case-body">
      <h4>${c.title}</h4>
      <p>${c.desc}</p>
      <div class="case-feats">
        <div class="feat-head"><span>支持功能</span><b>${c.features.length} 项</b></div>
        <ul class="feat-list-mini">${miniFeats}</ul>
      </div>
      <div class="case-tags">${c.tags.map(t=>`<span>${t}</span>`).join("")}</div>
      <div class="case-price"><span class="p">${c.price}</span><span class="more">查看全部功能 →</span></div>
    </div>`;
  el.addEventListener("click", () => openModal(c));
  grid.appendChild(el);
});

// Filters + curated "show more" logic
const CASE_LIMIT = 9;
let curFilter = "all";
let expanded = false;
const moreWrap = document.getElementById("casesMore");
const moreBtn = document.getElementById("moreBtn");
const moreCount = document.getElementById("moreCount");
const moreText = moreBtn ? moreBtn.querySelector(".mb-text") : null;

function applyCaseView() {
  const cards = [...document.querySelectorAll(".case")];
  let shown = 0, matched = 0;
  cards.forEach(card => {
    const match = curFilter === "all" || card.dataset.cat === curFilter;
    if (!match) { card.classList.add("hide"); return; }
    matched++;
    const within = expanded || shown < CASE_LIMIT;
    card.classList.toggle("hide", !within);
    if (within) shown++;
  });
  const remaining = matched - CASE_LIMIT;
  if (matched > CASE_LIMIT) {
    moreWrap.style.display = "";
    moreBtn.classList.toggle("is-open", expanded);
    moreText.textContent = expanded ? "收起案例" : "查看全部案例";
    moreCount.textContent = expanded ? "" : `+${remaining}`;
  } else {
    moreWrap.style.display = "none";
  }
}

document.getElementById("filters").addEventListener("click", e => {
  const b = e.target.closest(".filter"); if (!b) return;
  document.querySelectorAll(".filter").forEach(x => x.classList.remove("active"));
  b.classList.add("active");
  curFilter = b.dataset.f;
  expanded = false;
  applyCaseView();
});

if (moreBtn) {
  moreBtn.addEventListener("click", () => {
    expanded = !expanded;
    applyCaseView();
    if (!expanded) {
      document.getElementById("cases").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

applyCaseView();

// Modal
const modal = document.getElementById("modal");
function openModal(c) {
  document.getElementById("m-cat").textContent = c.catName;
  document.getElementById("m-title").textContent = c.title;
  document.getElementById("m-desc").textContent = c.desc;
  document.getElementById("m-feat-title").textContent = `功能清单 · ${c.features.length} 项`;
  document.getElementById("m-feats").innerHTML = c.features.map(f=>`<li><span class="ck">✓</span>${f}</li>`).join("");
  document.getElementById("m-stack").innerHTML = c.stack.map(s=>`<span>${s}</span>`).join("");
  document.getElementById("m-scenes").innerHTML = c.scenes.map(s=>`<span>${s}</span>`).join("");
  const src = c.img || c.cover;
  document.getElementById("modal-media").innerHTML =
    `<div class="modal-cover">${phCover(c)}${src ? `<img src="${src}" alt="${c.title}" onerror="this.style.display='none'">` : ""}</div>`;
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}
modal.addEventListener("click", e => {
  if (e.target.hasAttribute("data-close")) { modal.classList.remove("open"); document.body.style.overflow = ""; }
});
document.addEventListener("keydown", e => { if (e.key === "Escape") { modal.classList.remove("open"); document.body.style.overflow = ""; } });

// Reveal on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      en.target.classList.add("in");
      const bar = en.target.querySelector && en.target.querySelector(".bar i");
      if (bar) bar.style.width = en.target.querySelector(".bar").dataset.w;
      io.unobserve(en.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

// Count up
const countIO = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target, target = +el.dataset.count, suf = el.dataset.suffix || "";
    let cur = 0; const step = Math.max(1, Math.ceil(target / 40));
    const t = setInterval(() => { cur += step; if (cur >= target) { cur = target; clearInterval(t); } el.textContent = cur + suf; }, 28);
    countIO.unobserve(el);
  });
}, { threshold: 0.6 });
document.querySelectorAll("[data-count]").forEach(el => countIO.observe(el));

// Typed role
const words = ["一个微信小程序", "一套 Web 管理系统", "一块数据可视化大屏", "一个 AI 智能体", "一个深度学习系统", "一款能跑的产品"];
let wi = 0, ci = 0, deleting = false;
const typedEl = document.getElementById("typed");
(function type() {
  const w = words[wi];
  typedEl.textContent = w.slice(0, ci);
  if (!deleting && ci < w.length) { ci++; setTimeout(type, 110); }
  else if (!deleting && ci === w.length) { deleting = true; setTimeout(type, 1500); }
  else if (deleting && ci > 0) { ci--; setTimeout(type, 50); }
  else { deleting = false; wi = (wi + 1) % words.length; setTimeout(type, 300); }
})();

// Custom cursor
const dot = document.getElementById("cdot"), ring = document.getElementById("cring");
let mx = 0, my = 0, rx = 0, ry = 0;
window.addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; dot.style.left = mx+"px"; dot.style.top = my+"px"; });
(function ringLoop(){ rx += (mx-rx)*0.18; ry += (my-ry)*0.18; ring.style.left = rx+"px"; ring.style.top = ry+"px"; requestAnimationFrame(ringLoop); })();
function bindCursor(){ document.querySelectorAll("a, button, .case, [data-cursor], .filter, .back-top, .modal-close").forEach(el => {
  if (el._cb) return; el._cb = 1;
  el.addEventListener("mouseenter", () => ring.classList.add("grow"));
  el.addEventListener("mouseleave", () => ring.classList.remove("grow"));
}); }
bindCursor();

// Scroll progress + nav
const prog = document.getElementById("progress"), nav = document.getElementById("nav");
let lastY = 0;
window.addEventListener("scroll", () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  prog.style.width = (scrollY / h * 100) + "%";
  nav.classList.toggle("scrolled", scrollY > 20);
  if (scrollY > lastY && scrollY > 400) nav.classList.add("hide"); else nav.classList.remove("hide");
  lastY = scrollY;
});

// 3D tilt hero card
const tilt = document.getElementById("tiltCard");
const hv = tilt.closest(".hero-visual");
hv.addEventListener("mousemove", e => {
  const r = tilt.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width - 0.5;
  const py = (e.clientY - r.top) / r.height - 0.5;
  tilt.style.transform = `rotateY(${px*9}deg) rotateX(${-py*9}deg) translateZ(8px)`;
});
hv.addEventListener("mouseleave", () => tilt.style.transform = "");

// 3D tilt on case cards
document.querySelectorAll(".case").forEach(card => {
  card.addEventListener("mousemove", e => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left)/r.width - 0.5, py = (e.clientY - r.top)/r.height - 0.5;
    card.style.transform = `rotateY(${px*5}deg) rotateX(${-py*5}deg) translateY(-6px)`;
  });
  card.addEventListener("mouseleave", () => card.style.transform = "");
});

// Burger
const burger = document.getElementById("burger"), navLinks = document.getElementById("navLinks");
burger.addEventListener("click", () => navLinks.classList.toggle("open"));
navLinks.querySelectorAll("a").forEach(a => a.addEventListener("click", () => navLinks.classList.remove("open")));

// Orb parallax + hero spotlight
const heroSpot = document.getElementById("heroSpot");
const heroSec = document.getElementById("top");
window.addEventListener("mousemove", e => {
  const x = (e.clientX/innerWidth - 0.5), y = (e.clientY/innerHeight - 0.5);
  document.querySelector(".orb.a").style.transform = `translate(${x*26}px,${y*26}px)`;
  document.querySelector(".orb.c").style.transform = `translate(${-x*34}px,${-y*34}px)`;
  const r = heroSec.getBoundingClientRect();
  if (e.clientY < r.bottom) { heroSpot.style.left = e.clientX + "px"; heroSpot.style.top = (e.clientY - r.top) + "px"; }
});

// Intro / opening animation
(function () {
  const intro = document.getElementById("intro");
  if (!intro) return;
  const bar = document.getElementById("introBar");
  const pct = document.getElementById("introPct");
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.style.overflow = "hidden";

  function finish() {
    intro.classList.add("exiting");
    setTimeout(() => {
      intro.classList.add("done");
      root.style.overflow = "";
      setTimeout(() => intro.remove(), 1000);
    }, 520);
  }

  if (reduce) { root.style.overflow = ""; intro.remove(); return; }

  const start = performance.now();
  const dur = 1700;
  function tick(now) {
    const t = Math.min(1, (now - start) / dur);
    const p = Math.round((1 - Math.pow(1 - t, 2)) * 100);
    if (bar) bar.style.width = p + "%";
    if (pct) pct.textContent = p;
    if (t < 1) requestAnimationFrame(tick);
    else finish();
  }
  requestAnimationFrame(tick);
})();

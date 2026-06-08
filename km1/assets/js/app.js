// =========================================================
// 主应用：路由 / 主题 / 题库加载 / Mermaid 初始化
// =========================================================
(function () {
  'use strict';

  const VIEW = document.getElementById('view');
  const NAV  = document.getElementById('navTabs');
  const LOADER = document.getElementById('loader');
  const THEME_BTN = document.getElementById('themeBtn');
  const MINI_STATS = document.getElementById('miniStats');

  // ------------ 主题 ------------
  function applyTheme(theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    Storage.set('theme', theme);
    if (window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: theme === 'dark' ? 'dark' : 'default',
        flowchart: { htmlLabels: true, curve: 'basis' },
        themeVariables: { fontSize: '14px' }
      });
    }
  }
  THEME_BTN.addEventListener('click', () => {
    const cur = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    applyTheme(cur === 'dark' ? 'light' : 'dark');
    // 重新渲染当前路由以刷新 Mermaid
    render();
  });
  applyTheme(Storage.get('theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

  // ------------ 题库 ------------
  window.DB = { questions: [], byId: new Map(), byChapter: new Map(), chapterNames: {}, loaded: false };

  async function loadQuestions() {
    try {
      const res = await fetch('data/questions.json');
      if (!res.ok) throw new Error('题库文件请求失败 ' + res.status);
      const data = await res.json();
      DB.questions = data.questions;
      DB.chapterNames = data.chapters;
      DB.questions.forEach(q => {
        DB.byId.set(q.id, q);
        const list = DB.byChapter.get(q.chapter) || [];
        list.push(q);
        DB.byChapter.set(q.chapter, list);
      });
      DB.loaded = true;
      updateMiniStats();
    } catch (err) {
      console.error(err);
      VIEW.innerHTML = `<div class="card text-center text-bad">题库加载失败：${err.message}<br/><span class="text-slate-500 text-sm">请通过本地服务器访问（不能直接 file:// 打开）。<br/>参考 README：<code>python3 -m http.server 8000</code></span></div>`;
    } finally {
      LOADER.classList.add('opacity-0');
      setTimeout(() => LOADER.style.display = 'none', 300);
    }
  }

  // ------------ 路由 ------------
  const ROUTES = {
    manual: () => ManualView.render(VIEW),
    quiz  : () => QuizView.render(VIEW, 'sequential'),
    random: () => QuizView.render(VIEW, 'random'),
    wrong : () => QuizView.render(VIEW, 'wrong'),
    fav   : () => QuizView.render(VIEW, 'fav'),
    mock  : () => MockView.render(VIEW),
  };

  function parseHash() {
    const m = (location.hash || '#/manual').match(/^#\/(\w+)/);
    return m ? m[1] : 'manual';
  }

  async function render() {
    const name = parseHash();
    // nav 高亮
    NAV.querySelectorAll('.nav-tab').forEach(a => {
      a.classList.toggle('active', a.dataset.route === name);
      if (!a.href) a.href = '#/' + a.dataset.route;
    });
    VIEW.classList.remove('animate-fade-in'); void VIEW.offsetWidth; VIEW.classList.add('animate-fade-in');

    if (!DB.loaded && name !== 'manual') {
      await loadQuestions();
    }
    const fn = ROUTES[name] || ROUTES.manual;
    fn();
    updateMiniStats();
  }

  window.addEventListener('hashchange', render);

  NAV.addEventListener('click', (e) => {
    const a = e.target.closest('.nav-tab');
    if (a) {
      e.preventDefault();
      location.hash = '#/' + a.dataset.route;
    }
  });

  // ------------ 数据管理 ------------
  document.getElementById('dataBtn').addEventListener('click', () => {
    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4 animate-fade-in';
    backdrop.innerHTML = `
      <div class="card w-full max-w-md animate-slide-up" onclick="event.stopPropagation()">
        <h3 class="text-lg font-bold mb-3">💾 数据管理</h3>
        <p class="text-sm text-slate-500 mb-4">所有学习数据仅保存在本地浏览器 localStorage 中，可导出备份，也可导入到其它浏览器。</p>
        <div class="grid grid-cols-2 gap-2">
          <button class="btn btn-primary" id="expBtn">📤 导出全部数据</button>
          <button class="btn btn-ghost" id="impBtn">📥 导入数据</button>
          <button class="btn btn-ghost col-span-2" id="clearBtn">🗑 重置全部数据</button>
        </div>
        <input type="file" id="impFile" accept=".json" class="hidden" />
        <button class="btn btn-ghost mt-4 w-full" id="closeModal">关闭</button>
      </div>`;
    document.body.appendChild(backdrop);
    backdrop.onclick = () => backdrop.remove();
    const close = () => backdrop.remove();
    backdrop.querySelector('#closeModal').onclick = close;
    backdrop.querySelector('#expBtn').onclick = () => {
      const data = Storage.exportAll();
      DrawIO.download('km1-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(data, null, 2), 'application/json');
    };
    backdrop.querySelector('#impBtn').onclick = () => backdrop.querySelector('#impFile').click();
    backdrop.querySelector('#impFile').onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const obj = JSON.parse(r.result);
          if (Storage.importAll(obj)) { toast('导入成功'); close(); updateMiniStats(); render(); }
          else toast('数据格式错误');
        } catch { toast('解析失败'); }
      };
      r.readAsText(f);
    };
    backdrop.querySelector('#clearBtn').onclick = () => {
      if (confirm('确认清空全部学习数据？此操作不可恢复。')) {
        Storage.clearAll(); toast('已清空'); close(); updateMiniStats(); render();
      }
    };
  });

  // ------------ 迷你统计 ------------
  function updateMiniStats() {
    const s = Storage.stats();
    const total = s.answered || 0;
    const right = s.right || 0;
    const acc = total ? ((right / total) * 100).toFixed(1) : '0.0';
    MINI_STATS.textContent = `已答 ${total} · 正确率 ${acc}% · 错题 ${Storage.wrongIds().length}`;
  }
  window.updateMiniStats = updateMiniStats;

  // ------------ 启动 ------------
  (async function start() {
    await loadQuestions();
    render();
  })();

  // ------------ Toast ------------
  window.toast = (msg) => {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2100);
  };
})();

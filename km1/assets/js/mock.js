// =========================================================
// 模拟考试：100 题（40 判断 + 60 单选/多选），45 分钟，90 分及格
// =========================================================
(function () {
  'use strict';

  const TOTAL = 100, JUDGE_N = 40, CHOICE_N = 60;
  const DURATION = 45 * 60; // 秒
  const PASS = 90;

  let state = null;
  let timer = null;

  function render(root) {
    root.innerHTML = `
      <section class="mb-6">
        <h1 class="text-2xl font-extrabold mb-2">🧪 模拟考试</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">100 题（40 判断 + 60 选择），45 分钟，90 分及格。每题 1 分，错题自动加入错题本。</p>
      </section>
      <div id="mockMain"></div>`;
    renderHome(root.querySelector('#mockMain'));
  }

  function renderHome(el) {
    const history = Storage.mockHistory();
    const best = history.reduce((m, r) => Math.max(m, r.score), 0);
    const last = history[history.length - 1];
    el.innerHTML = `
      <div class="grid md:grid-cols-2 gap-4">
        <div class="card">
          <div class="text-sm text-slate-500 mb-2">考试规则</div>
          <ul class="text-sm space-y-1 list-disc pl-5">
            <li>题量：100 题（判断 40 + 选择 60）</li>
            <li>时长：45 分钟，倒计时剩 5 分钟会红色闪烁</li>
            <li>判题：所有题型确认答案后即时显示对错与解析</li>
            <li>通过：90 分及格，错题自动进入错题本</li>
          </ul>
          <button class="btn btn-primary mt-4" id="startBtn">▶ 开始考试</button>
        </div>
        <div class="card">
          <div class="text-sm text-slate-500 mb-2">历史成绩（最近 ${history.length} 次，最高 ${best} 分）</div>
          <canvas id="historyChart" width="600" height="180" class="w-full"></canvas>
          ${last ? `<div class="text-xs text-slate-500 mt-2">最近一次：${new Date(last.ts).toLocaleString()} · ${last.score} 分 · 用时 ${formatTime(last.duration)}</div>` : '<div class="text-xs text-slate-400 mt-2">暂无历史记录</div>'}
        </div>
      </div>`;
    el.querySelector('#startBtn').onclick = () => startExam(el);
    if (history.length) drawHistory(el.querySelector('#historyChart'), history);
  }

  function pickQuestions() {
    const judges = DB.questions.filter(q => q.type === 'judge');
    const choices = DB.questions.filter(q => q.type !== 'judge');
    return [...sample(judges, JUDGE_N), ...sample(choices, CHOICE_N)];
  }
  function sample(arr, n) {
    const pool = arr.slice();
    const out = [];
    for (let i = 0; i < n && pool.length; i++) {
      const j = Math.floor(Math.random() * pool.length);
      out.push(pool.splice(j, 1)[0]);
    }
    return out;
  }

  function startExam(root) {
    const list = pickQuestions();
    state = {
      list, idx: 0,
      answers: new Array(list.length).fill(null), // 存 selected 数组
      judged: new Array(list.length).fill(false),  // 是否已判定
      results: new Array(list.length).fill(null),  // true=对 false=错
      remain: DURATION, startAt: Date.now(),
    };
    root.innerHTML = `
      <div class="flex items-start gap-4 flex-col lg:flex-row">
        <aside class="w-full lg:w-72 card sticky top-20 self-start">
          <div class="flex items-center justify-between mb-3">
            <div class="font-bold">答题进度</div>
            <div id="timer" class="font-mono text-lg font-bold text-brand-600">45:00</div>
          </div>
          <div class="num-grid" id="mNumGrid"></div>
          <div class="mt-3 flex items-center gap-2 text-xs flex-wrap text-slate-500">
            <span class="inline-block w-3 h-3 rounded bg-green-500"></span>答对
            <span class="inline-block w-3 h-3 rounded bg-red-500 ml-1"></span>答错
            <span class="inline-block w-3 h-3 rounded bg-blue-300 ml-1"></span>已选未判
          </div>
          <button class="btn btn-primary w-full mt-4" id="submitExam">📝 交卷</button>
        </aside>
        <section class="flex-1 w-full">
          <div id="mQBox" class="card animate-slide-up"></div>
          <div class="flex gap-2 mt-3 flex-wrap">
            <button class="btn btn-ghost" id="mPrev">← 上一题</button>
            <button class="btn btn-primary" id="mNext">下一题 →</button>
          </div>
        </section>
      </div>`;
    root.querySelector('#submitExam').onclick = () => submitExam(root);
    root.querySelector('#mPrev').onclick = () => mGoto(-1);
    root.querySelector('#mNext').onclick = () => mGoto(1);
    startTimer(root);
    renderMockQ();
    renderMockGrid();
  }

  function startTimer(root) {
    const el = root.querySelector('#timer');
    clearInterval(timer);
    const tick = () => {
      state.remain -= 1;
      const m = String(Math.floor(state.remain / 60)).padStart(2, '0');
      const s = String(state.remain % 60).padStart(2, '0');
      el.textContent = `${m}:${s}`;
      el.classList.toggle('timer-critical', state.remain <= 300);
      if (state.remain <= 0) { clearInterval(timer); submitExam(root); }
    };
    tick();
    timer = setInterval(tick, 1000);
  }

  function renderMockQ() {
    const q = state.list[state.idx];
    const box = document.getElementById('mQBox');
    const idx = state.idx;
    const sel = state.answers[idx] || [];
    const judged = state.judged[idx];
    const typeLabel = q.type === 'judge' ? '判断题' : q.type === 'single' ? '单选题' : '多选题';
    const typeColor = q.type === 'multi' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';

    const optsHTML = q.options.map((o, i) => {
      let cls = 'opt';
      if (judged) {
        const isAns = q.answer.includes(i);
        const isSel = sel.includes(i);
        if (isAns) cls += ' correct';
        else if (isSel) cls += ' wrong';
        else cls += ' cursor-default';
      } else if (sel.includes(i)) {
        cls += ' ring-2 ring-blue-500';
      }
      return `<div class="${cls}" data-i="${i}" style="${judged ? 'cursor:default' : ''}">
        <span class="mark">${o.key || String.fromCharCode(65 + i)}</span>
        <span class="flex-1">${escapeHtml(o.text)}</span>
        ${judged && q.answer.includes(i) ? '<span class="ml-auto text-green-600 font-bold text-sm">✓</span>' : ''}
      </div>`;
    }).join('');

    // 解析区（已判定时显示）
    const explainHTML = judged ? `
      <div class="mt-4 p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg border-l-4 ${state.results[idx] ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-red-400 bg-red-50 dark:bg-red-900/20'} animate-slide-up">
        <div class="font-bold mb-1 ${state.results[idx] ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}">
          ${state.results[idx] ? '✅ 回答正确！' : `❌ 回答错误！正确答案：${q.answer.map(i => q.options[i]?.key || '').join(' ')}`}
        </div>
        ${q.skill ? `<div class="text-sm mt-2">🎯 <b>答题技巧：</b>${escapeHtml(q.skill)}</div>` : ''}
        ${q.explain ? `<div class="text-sm mt-2">💡 <b>解析：</b>${escapeHtml(q.explain)}</div>` : ''}
      </div>` : '';

    // 多选确认按钮（未判定时显示）
    const multiConfirmHTML = (!judged && q.type === 'multi') ? `
      <div class="mt-3 flex items-center gap-3">
        <span class="text-xs text-slate-400">多选题：全部选完后点"确认答案"</span>
        <button class="btn btn-primary btn-sm" id="mConfirmMulti">确认答案</button>
      </div>` : '';

    box.innerHTML = `
      <div class="flex items-center gap-2 mb-3 text-xs flex-wrap">
        <span class="px-2 py-1 rounded ${typeColor}">${typeLabel}</span>
        <span class="text-slate-500">第 ${idx + 1} / ${state.list.length} 题</span>
        ${judged ? (state.results[idx]
          ? '<span class="text-green-600 font-semibold">✓ 答对</span>'
          : '<span class="text-red-600 font-semibold">✗ 答错</span>') : ''}
      </div>
      <h2 class="text-lg leading-relaxed font-semibold mb-4">${escapeHtml(q.question)}</h2>
      ${q.image ? `<div class="mb-4"><img src="${q.image}" class="max-w-full max-h-60 rounded-lg border" onerror="this.style.display='none'"/></div>` : ''}
      <div class="space-y-2" id="mOpts">${optsHTML}</div>
      ${multiConfirmHTML}
      ${explainHTML}`;

    // 绑定事件
    if (!judged) {
      box.querySelectorAll('.opt').forEach(el => el.onclick = () => mockSelect(Number(el.dataset.i)));
      const confirmBtn = box.querySelector('#mConfirmMulti');
      if (confirmBtn) confirmBtn.onclick = () => judgeCurrentQ();
    }
  }

  function mockSelect(i) {
    const q = state.list[state.idx];
    const idx = state.idx;
    if (state.judged[idx]) return; // 已判定，不可修改
    let sel = state.answers[idx] || [];
    if (q.type === 'multi') {
      const p = sel.indexOf(i);
      if (p >= 0) sel.splice(p, 1); else sel.push(i);
      state.answers[idx] = sel;
      renderMockQ();
    } else {
      // 单选/判断：选择即立即判定
      state.answers[idx] = [i];
      judgeCurrentQ();
    }
  }

  // 判定当前题目，即时显示结果
  function judgeCurrentQ() {
    const idx = state.idx;
    const q = state.list[idx];
    const sel = (state.answers[idx] || []).slice().sort();
    const ans = q.answer.slice().sort();
    if (sel.length === 0) { toast('请先选择答案'); return; }
    const isRight = sel.length === ans.length && sel.every((v, j) => v === ans[j]);
    state.judged[idx] = true;
    state.results[idx] = isRight;
    renderMockQ();
    renderMockGrid();
    // 答对且非多选题时，延迟自动跳下一题
    if (isRight && q.type !== 'multi') {
      setTimeout(() => mGoto(1), 800);
    }
  }

  function mGoto(d) {
    const ni = state.idx + d;
    if (ni < 0 || ni >= state.list.length) { toast(d > 0 ? '已是最后一题' : '已是第一题'); return; }
    state.idx = ni;
    renderMockQ();
    renderMockGrid();
  }

  function renderMockGrid() {
    const grid = document.getElementById('mNumGrid');
    if (!grid) return;
    grid.innerHTML = state.list.map((q, i) => {
      let statusCls = '';
      if (state.judged[i]) {
        statusCls = state.results[i] ? 'right' : 'wrong';
      } else if (state.answers[i] && state.answers[i].length) {
        statusCls = 'done'; // 已选但未确认（多选等待确认）
      }
      const cls = ['num-cell', statusCls, state.idx === i ? 'active' : ''].filter(Boolean).join(' ');
      return `<div class="${cls}" data-i="${i}">${i + 1}</div>`;
    }).join('');
    grid.querySelectorAll('.num-cell').forEach(el => {
      el.onclick = () => { state.idx = Number(el.dataset.i); renderMockQ(); renderMockGrid(); };
    });
  }

  function submitExam(root) {
    if (!state) return;
    // 统计未判定（含未作答）的题目数量
    const unjudged = state.judged.filter(j => !j).length;
    if (unjudged > 0 && state.remain > 0) {
      if (!confirm(`还有 ${unjudged} 题未完成作答，确认交卷？未作答题目将记为错题。`)) return;
    }
    clearInterval(timer);
    let right = 0;
    const wrongList = [];
    state.list.forEach((q, i) => {
      // 已即时判定的直接用已有结果，否则重算（未作答 = 错）
      const isR = state.judged[i] ? state.results[i] : false;
      if (isR) right++;
      else {
        const sel = state.answers[i] || [];
        wrongList.push({ q, sel });
      }
      Storage.recordAnswer(q.id, !!isR);
    });
    const duration = DURATION - state.remain;
    const rec = { score: right, total: state.list.length, duration, ts: Date.now() };
    Storage.pushMock(rec);
    renderResult(root, right, wrongList, duration);
    state = null;
    window.updateMiniStats && window.updateMiniStats();
  }

  function renderResult(root, score, wrong, duration) {
    const pass = score >= PASS;
    root.innerHTML = `
      <div class="card text-center py-10 animate-slide-up">
        <div class="text-7xl mb-3 animate-pop">${pass ? '🎉' : '😮'}</div>
        <div class="text-4xl font-extrabold ${pass ? 'text-green-600' : 'text-red-600'}">${score} 分</div>
        <div class="mt-2 text-slate-500">${pass ? '恭喜通过！90 分及格，你已达标' : '未达 90 分，再接再厉'} · 用时 ${formatTime(duration)}</div>
        <div class="mt-6 flex gap-3 justify-center flex-wrap">
          <button class="btn btn-primary" id="againBtn">🔄 再来一次</button>
          <button class="btn btn-ghost" id="backHome">返回模考主页</button>
          <a class="btn btn-ghost" href="#/wrong">去错题本</a>
        </div>
      </div>
      ${wrong.length ? `
      <div class="card mt-4">
        <h3 class="font-bold mb-3">❌ 错题回顾（${wrong.length} 题）</h3>
        <div class="space-y-3 max-h-[500px] overflow-auto">
          ${wrong.map(({ q, sel }) => `
            <div class="p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div class="font-medium mb-2">${escapeHtml(q.question)}</div>
              <div class="text-xs text-slate-500">你的答案：<span class="text-red-600">${(sel.map(i => q.options[i]?.key).join(' ')) || '未作答'}</span> · 正确答案：<span class="text-green-600">${q.answer.map(i => q.options[i]?.key).join(' ')}</span></div>
              ${q.explain ? `<div class="text-xs mt-2 text-slate-600 dark:text-slate-300">${escapeHtml(q.explain)}</div>` : ''}
            </div>`).join('')}
        </div>
      </div>` : ''}`;
    root.querySelector('#againBtn').onclick = () => startExam(root);
    root.querySelector('#backHome').onclick = () => renderHome(root);
  }

  function drawHistory(canvas, history) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const pad = 30;
    const data = history.slice(-15);
    const maxScore = 100;
    // 网格
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
    [0, 25, 50, 75, 100].forEach(s => {
      const y = H - pad - (s / maxScore) * (H - pad * 2);
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
      ctx.fillStyle = '#94a3b8'; ctx.font = '10px sans-serif'; ctx.fillText(s, 4, y + 3);
    });
    // 90 分线
    const y90 = H - pad - (90 / maxScore) * (H - pad * 2);
    ctx.strokeStyle = '#16a34a'; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(pad, y90); ctx.lineTo(W - pad, y90); ctx.stroke();
    ctx.setLineDash([]);

    if (data.length === 0) return;
    const stepX = (W - pad * 2) / Math.max(1, data.length - 1);
    // 折线
    ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = pad + i * stepX;
      const y = H - pad - (d.score / maxScore) * (H - pad * 2);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    // 节点
    data.forEach((d, i) => {
      const x = pad + i * stepX;
      const y = H - pad - (d.score / maxScore) * (H - pad * 2);
      ctx.fillStyle = d.score >= PASS ? '#16a34a' : '#dc2626';
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    });
  }

  function formatTime(s) {
    const m = Math.floor(s / 60), ss = s % 60;
    return `${m}分${String(ss).padStart(2, '0')}秒`;
  }
  function escapeHtml(s) {
    return String(s).replace(/[<>&"]/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;' }[c]));
  }

  window.MockView = { render };
})();

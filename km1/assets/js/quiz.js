// =========================================================
// 刷题器：顺序 / 随机 / 错题 / 收藏 / 按章节
// =========================================================
(function () {
  'use strict';

  const MODE_LABEL = {
    sequential: '顺序练习',
    random    : '随机练习',
    wrong     : '错题本',
    fav       : '我的收藏',
  };

  // 按模式获取题目列表
  function getQuestionsForMode(mode, chapter) {
    let list = DB.questions;
    if (mode === 'wrong') {
      const ids = new Set(Storage.wrongIds());
      list = list.filter(q => ids.has(q.id));
    } else if (mode === 'fav') {
      const ids = new Set(Storage.favs());
      list = list.filter(q => ids.has(q.id));
    } else if (chapter) {
      list = list.filter(q => q.chapter === chapter);
    }
    if (mode === 'random' && list.length) {
      list = list.slice().sort(() => Math.random() - 0.5);
    }
    return list;
  }

  let state = null; // { mode, chapter, list, idx, submitted, selected }

  function render(root, mode) {
    const chapter = Number(new URLSearchParams(location.hash.split('?')[1] || '').get('ch')) || null;
    const list = getQuestionsForMode(mode, chapter);

    if (!list.length) {
      root.innerHTML = `
        <div class="card text-center py-16 animate-slide-up">
          <div class="text-6xl mb-3">${mode === 'wrong' ? '🎉' : mode === 'fav' ? '⭐' : '📭'}</div>
          <div class="text-lg font-semibold mb-2">${mode === 'wrong' ? '暂无错题，太棒了！' : mode === 'fav' ? '还没有收藏题目' : '没有可用题目'}</div>
          <div class="text-sm text-slate-500 mb-4">${mode === 'wrong' ? '继续保持，多做模拟考试' : '刷题时点 ⭐ 即可收藏，方便集中复习'}</div>
          <a href="#/quiz" class="btn btn-primary">去顺序练习</a>
        </div>`;
      return;
    }

    let idx = 0;
    if (mode === 'sequential' || (mode === 'random' && !chapter)) {
      idx = Math.min(Storage.getProgress(mode), list.length - 1);
    }

    state = { mode, chapter, list, idx, submitted: false, selected: [] };

    root.innerHTML = `
      <div class="flex items-start gap-4 flex-col lg:flex-row">
        <!-- 左侧题号面板 -->
        <aside class="w-full lg:w-72 card sticky top-20 self-start">
          <div class="flex items-center justify-between mb-3">
            <div class="font-bold">${MODE_LABEL[mode] || '刷题'}</div>
            <div class="text-xs text-slate-500">共 <b>${list.length}</b> 题</div>
          </div>
          <div class="mb-2">
            ${mode === 'sequential' ? chapterFilterHTML(chapter) : ''}
          </div>
          <div class="num-grid" id="numGrid"></div>
          <div class="mt-3 flex items-center gap-1 text-xs text-slate-500 flex-wrap">
            <span class="inline-block w-3 h-3 rounded bg-green-500"></span>对
            <span class="inline-block w-3 h-3 rounded bg-red-500 ml-2"></span>错
            <span class="inline-block w-3 h-3 rounded bg-slate-200 dark:bg-slate-700 ml-2"></span>未做
          </div>
          <div class="mt-3 flex gap-2 flex-wrap">
            <button class="btn btn-ghost btn-sm" id="resetBtn">跳到未做</button>
            ${mode === 'wrong' ? '<button class="btn btn-ghost btn-sm" id="clearWrongBtn">清空错题</button><button class="btn btn-ghost btn-sm" id="exportWrongBtn">导出错题</button>' : ''}
            ${mode === 'fav' ? '<button class="btn btn-ghost btn-sm" id="exportFavBtn">导出收藏</button>' : ''}
          </div>
        </aside>

        <!-- 右侧题目 -->
        <section class="flex-1 w-full">
          <div id="qBox" class="card animate-slide-up"></div>
          <div class="flex gap-2 mt-3 flex-wrap">
            <button class="btn btn-ghost" id="prevBtn">← 上一题 (K)</button>
            <button class="btn btn-primary" id="nextBtn">下一题 → (空格/J)</button>
            <button class="btn btn-ghost" id="submitBtn" style="display:none">提交 (Enter)</button>
            <button class="btn btn-ghost ml-auto" id="favBtn">☆ 收藏 (S)</button>
          </div>
          <div class="mt-3 text-xs text-slate-400" id="hotkeyTip">快捷键：1-4 选项 · 空格/J 下一题 · K 上一题 · S 收藏 · Enter 提交多选</div>
        </section>
      </div>`;

    renderQuestion();
    renderGrid();

    root.querySelector('#prevBtn').onclick = () => goto(-1);
    root.querySelector('#nextBtn').onclick = () => goto(1);
    root.querySelector('#submitBtn').onclick = submitMulti;
    root.querySelector('#favBtn').onclick = toggleFav;
    const resetBtn = root.querySelector('#resetBtn');
    if (resetBtn) resetBtn.onclick = jumpUnanswered;
    const clearBtn = root.querySelector('#clearWrongBtn');
    if (clearBtn) clearBtn.onclick = () => {
      if (confirm('确认清空所有错题？')) { Storage.clearWrong(); render(root, mode); window.updateMiniStats(); }
    };
    const chSel = root.querySelector('#chSel');
    if (chSel) chSel.onchange = (e) => {
      const v = e.target.value;
      location.hash = '#/quiz' + (v ? '?ch=' + v : '');
    };
    const expW = root.querySelector('#exportWrongBtn');
    if (expW) expW.onclick = () => exportList(list, 'wrong-questions.json');
    const expF = root.querySelector('#exportFavBtn');
    if (expF) expF.onclick = () => exportList(list, 'fav-questions.json');

    // 键盘
    document.removeEventListener('keydown', onKey);
    document.addEventListener('keydown', onKey);
  }

  function chapterFilterHTML(cur) {
    const chapters = Object.entries(DB.chapterNames);
    return `
      <div class="mb-2 text-xs">
        <select id="chSel" class="w-full bg-slate-50 dark:bg-slate-800 rounded px-2 py-1.5 border border-slate-200 dark:border-slate-700 text-xs">
          <option value="">全部章节</option>
          ${chapters.map(([k, v]) => {
            const cnt = (DB.byChapter.get(Number(k)) || []).length;
            return `<option value="${k}" ${cur == k ? 'selected' : ''}>${v}（${cnt}）</option>`;
          }).join('')}
        </select>
      </div>`;
  }

  function currentQ() { return state.list[state.idx]; }

  function renderQuestion() {
    const q = currentQ();
    if (!q) return;
    const box = document.getElementById('qBox');
    state.submitted = false;
    state.selected = [];

    const typeLabel = q.type === 'judge' ? '判断题' : q.type === 'single' ? '单选题' : '多选题';
    const typeColor = q.type === 'judge' ? 'bg-emerald-100 text-emerald-700' : q.type === 'single' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700';

    const status = Storage.answerStatus(q.id);
    const fav = Storage.isFav(q.id);

    box.innerHTML = `
      <div class="flex items-center gap-2 mb-3 flex-wrap text-xs">
        <span class="px-2 py-1 rounded ${typeColor}">${typeLabel}</span>
        <span class="text-slate-500">第 ${state.idx + 1} / ${state.list.length} 题</span>
        <span class="text-slate-500">${DB.chapterNames[q.chapter] || ('章节' + q.chapter)}</span>
        ${q.errorRate ? `<span class="text-slate-500">错误率 ${q.errorRate}%</span>` : ''}
        ${status === 'right' ? '<span class="text-green-600">✓ 上次答对</span>' : ''}
        ${status === 'wrong' ? '<span class="text-red-600">✗ 上次答错</span>' : ''}
        ${fav ? '<span class="text-amber-500">★ 已收藏</span>' : ''}
      </div>
      <h2 class="text-lg leading-relaxed font-semibold mb-4">${escapeHtml(q.question)}</h2>
      ${q.image ? `<div class="mb-4"><img src="${q.image}" alt="题图" class="max-w-full max-h-64 rounded-lg border" onerror="this.style.display='none'"/></div>` : ''}
      <div class="space-y-2" id="opts">
        ${q.options.map((o, i) => `
          <div class="opt" data-i="${i}">
            <span class="mark">${o.key || String.fromCharCode(65 + i)}</span>
            <span class="flex-1">${escapeHtml(o.text)}</span>
          </div>`).join('')}
      </div>
      <div id="explainBox" style="display:none" class="mt-4 p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg border-l-4 border-sky-400 animate-slide-up">
        <div class="font-bold text-sky-700 dark:text-sky-200 mb-1">✅ 答案：${q.answer.map(i => q.options[i]?.key || '').join(' ')}</div>
        ${q.skill ? `<div class="text-sm mt-2"><b>🎯 答题技巧：</b>${escapeHtml(q.skill)}</div>` : ''}
        ${q.explain ? `<div class="text-sm mt-2"><b>💡 解析：</b>${escapeHtml(q.explain)}</div>` : ''}
        ${q.law ? `<div class="text-xs mt-2 text-slate-500"><b>📖 法规：</b>${escapeHtml(q.law)}</div>` : ''}
      </div>`;

    // 绑定选项
    box.querySelectorAll('.opt').forEach(el => {
      el.onclick = () => selectOption(Number(el.dataset.i));
    });

    // 多选显示提交按钮
    document.getElementById('submitBtn').style.display = q.type === 'multi' ? '' : 'none';

    // 进度
    if (state.mode === 'sequential' || state.mode === 'random') {
      Storage.setProgress(state.mode, state.idx);
    }
  }

  function selectOption(i) {
    const q = currentQ();
    if (state.submitted) return;
    if (q.type === 'multi') {
      const pos = state.selected.indexOf(i);
      if (pos >= 0) state.selected.splice(pos, 1); else state.selected.push(i);
      document.querySelectorAll('#opts .opt').forEach((el, j) => {
        el.classList.toggle('ring-2', state.selected.includes(j));
        el.classList.toggle('ring-blue-500', state.selected.includes(j));
      });
    } else {
      state.selected = [i];
      submitAnswer();
    }
  }

  function submitMulti() {
    if (currentQ().type !== 'multi') return;
    if (state.selected.length === 0) { toast('请至少选择一项'); return; }
    submitAnswer();
  }

  function submitAnswer() {
    const q = currentQ();
    state.submitted = true;
    const right = arraysEqual(state.selected.sort(), q.answer.slice().sort());
    document.querySelectorAll('#opts .opt').forEach((el, i) => {
      const isAns = q.answer.includes(i);
      const isSel = state.selected.includes(i);
      if (isAns) el.classList.add('correct');
      if (isSel && !isAns) el.classList.add('wrong');
      el.style.cursor = 'default';
    });
    document.getElementById('explainBox').style.display = '';
    Storage.recordAnswer(q.id, right);
    window.updateMiniStats && window.updateMiniStats();
    renderGrid();

    // 自动下一题（仅判断/单选且答对）
    if (right && q.type !== 'multi' && state.mode !== 'wrong' && state.mode !== 'fav') {
      setTimeout(() => { if (state.submitted) goto(1); }, 650);
    }
  }

  function goto(delta) {
    const ni = state.idx + delta;
    if (ni < 0 || ni >= state.list.length) {
      if (delta > 0) toast('已是最后一题'); else toast('已是第一题');
      return;
    }
    state.idx = ni;
    renderQuestion();
    renderGrid();
  }

  function jumpUnanswered() {
    const answered = Storage.answered();
    const ni = state.list.findIndex(q => !answered[q.id]);
    if (ni >= 0) { state.idx = ni; renderQuestion(); renderGrid(); }
    else toast('已全部做过');
  }

  function toggleFav() {
    const q = currentQ();
    const added = Storage.toggleFav(q.id);
    toast(added ? '已加入收藏 ⭐' : '已取消收藏');
    renderQuestion();
    renderGrid();
  }

  function renderGrid() {
    const grid = document.getElementById('numGrid');
    if (!grid) return;
    const answered = Storage.answered();
    const favs = new Set(Storage.favs());
    // 性能保护：>500 题仅渲染窗口
    const total = state.list.length;
    const WINDOW = 200;
    let start = 0, end = total;
    if (total > WINDOW) {
      start = Math.max(0, state.idx - WINDOW / 2);
      end = Math.min(total, start + WINDOW);
      start = Math.max(0, end - WINDOW);
    }
    let html = '';
    if (start > 0) html += `<div class="col-span-10 text-xs text-center text-slate-400 py-1">显示 ${start + 1}-${end} / ${total} 题（题量较大）</div>`;
    for (let i = start; i < end; i++) {
      const q = state.list[i];
      const a = answered[q.id];
      const cls = [
        'num-cell',
        a ? (a.right ? 'right' : 'wrong') : '',
        state.idx === i ? 'active' : '',
        favs.has(q.id) ? 'fav' : ''
      ].filter(Boolean).join(' ');
      html += `<div class="${cls}" data-i="${i}">${i + 1}</div>`;
    }
    grid.innerHTML = html;
    grid.querySelectorAll('.num-cell').forEach(el => {
      el.onclick = () => { state.idx = Number(el.dataset.i); renderQuestion(); renderGrid(); };
    });
  }

  function onKey(e) {
    if (!state) return;
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    const q = currentQ();
    if (e.key === ' ' || e.key.toLowerCase() === 'j') { e.preventDefault(); goto(1); }
    else if (e.key.toLowerCase() === 'k') { e.preventDefault(); goto(-1); }
    else if (e.key.toLowerCase() === 's') { e.preventDefault(); toggleFav(); }
    else if (e.key === 'Enter' && q.type === 'multi') { e.preventDefault(); submitMulti(); }
    else if (/^[1-4]$/.test(e.key)) {
      const idx = Number(e.key) - 1;
      if (idx < q.options.length) selectOption(idx);
    }
  }

  function exportList(list, filename) {
    const payload = list.map(q => ({
      id: q.id, type: q.type, chapter: DB.chapterNames[q.chapter],
      question: q.question,
      options: q.options.map(o => `${o.key}. ${o.text}`),
      answer: q.answer.map(i => q.options[i]?.key).join(''),
      explain: q.explain, skill: q.skill, law: q.law
    }));
    DrawIO.download(filename, JSON.stringify(payload, null, 2), 'application/json');
    toast(`已导出 ${list.length} 题`);
  }

  function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  function escapeHtml(s) {
    return String(s).replace(/[<>&"]/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;' }[c]));
  }

  window.QuizView = { render };
})();

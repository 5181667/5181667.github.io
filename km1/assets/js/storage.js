// =========================================================
// localStorage 封装：进度 / 错题 / 收藏 / 统计 / 模考历史
// 命名空间 km1_*  versioned via km1_ver
// =========================================================
(function () {
  'use strict';

  const VER = 1;
  const K = {
    ver:'km1_ver',
    theme:'km1_theme',
    progress:'km1_progress',  // { sequential: idx, random: idx, ... }
    wrong:'km1_wrong',        // { id: {count, lastWrong} }
    fav:'km1_fav',            // [id, id, ...]
    stats:'km1_stats',        // { answered, right }
    answered:'km1_answered',  // { id: {right: bool, t: ts} }
    mock:'km1_mock',          // 历史：[{ score, total, duration, ts }]
  };

  function read(k, def) {
    try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); }
    catch { return def; }
  }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

  // 版本迁移占位
  if (read(K.ver) !== VER) write(K.ver, VER);

  const Storage = {
    // 通用 KV
    get(k, def) {
      if (k === 'theme') return localStorage.getItem(K.theme) || def;
      return read(k, def);
    },
    set(k, v) {
      if (k === 'theme') { try { localStorage.setItem(K.theme, v); } catch {} return; }
      write(k, v);
    },

    // 进度：不同模式各自保存
    getProgress(mode) {
      const p = read(K.progress, {});
      return p[mode] || 0;
    },
    setProgress(mode, idx) {
      const p = read(K.progress, {});
      p[mode] = idx;
      write(K.progress, p);
    },

    // 错题本
    wrong() { return read(K.wrong, {}); },
    wrongIds() { return Object.keys(read(K.wrong, {})); },
    markWrong(id) {
      const w = read(K.wrong, {});
      const item = w[id] || { count: 0 };
      item.count += 1;
      item.lastWrong = Date.now();
      w[id] = item;
      write(K.wrong, w);
    },
    unmarkWrong(id) {
      const w = read(K.wrong, {});
      delete w[id];
      write(K.wrong, w);
    },
    clearWrong() { write(K.wrong, {}); },

    // 收藏
    favs() { return read(K.fav, []); },
    isFav(id) { return read(K.fav, []).includes(id); },
    toggleFav(id) {
      const s = new Set(read(K.fav, []));
      if (s.has(id)) s.delete(id); else s.add(id);
      write(K.fav, [...s]);
      return s.has(id);
    },

    // 统计
    stats() { return read(K.stats, { answered: 0, right: 0 }); },
    recordAnswer(id, isRight) {
      const s = read(K.stats, { answered: 0, right: 0 });
      const a = read(K.answered, {});
      const prev = a[id];
      if (!prev) {
        s.answered += 1;
        if (isRight) s.right += 1;
      } else {
        // 已答过则只更正"正确"一次
        if (prev.right !== isRight) {
          if (isRight) s.right += 1; else s.right = Math.max(0, s.right - 1);
        }
      }
      a[id] = { right: isRight, t: Date.now() };
      write(K.stats, s);
      write(K.answered, a);
      if (!isRight) Storage.markWrong(id);
      else if (prev && prev.right === false) Storage.unmarkWrong(id);
    },
    answered() { return read(K.answered, {}); },
    answerStatus(id) {
      const a = read(K.answered, {});
      const x = a[id];
      if (!x) return null;
      return x.right ? 'right' : 'wrong';
    },
    clearAll() {
      [K.progress, K.wrong, K.fav, K.stats, K.answered, K.mock].forEach(k => localStorage.removeItem(k));
    },

    // 模考历史
    mockHistory() { return read(K.mock, []); },
    pushMock(rec) {
      const arr = read(K.mock, []);
      arr.push(rec);
      if (arr.length > 30) arr.shift();
      write(K.mock, arr);
    },

    // 导出
    exportAll() {
      return {
        ver: VER,
        progress: read(K.progress, {}),
        wrong: read(K.wrong, {}),
        fav: read(K.fav, []),
        stats: read(K.stats, {}),
        answered: read(K.answered, {}),
        mock: read(K.mock, []),
        exportedAt: new Date().toISOString()
      };
    },
    importAll(obj) {
      if (!obj || typeof obj !== 'object') return false;
      if (obj.progress) write(K.progress, obj.progress);
      if (obj.wrong) write(K.wrong, obj.wrong);
      if (obj.fav) write(K.fav, obj.fav);
      if (obj.stats) write(K.stats, obj.stats);
      if (obj.answered) write(K.answered, obj.answered);
      if (obj.mock) write(K.mock, obj.mock);
      return true;
    }
  };

  window.Storage = Storage;
})();

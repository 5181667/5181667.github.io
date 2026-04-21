// =========================================================
// drawio XML 导出：把 Mermaid 节点文本粗略组织为可编辑 mxGraph XML
// 目的：让用户能在 draw.io 中二次编辑（简单流程图骨架）
// 注意：此处不做精确语法解析，只按行拆出节点文本，生成纵向/横向排版骨架
// =========================================================
(function () {
  'use strict';

  function escapeXML(s) {
    return String(s).replace(/[<>&"']/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;' }[c]));
  }

  // 从 mermaid 源码中抽取节点的 id 与文本（flowchart）
  function parseFlow(src) {
    const nodes = new Map();      // id -> text
    const edges = [];             // { from, to, label }
    const nodePattern = /([A-Za-z_][A-Za-z0-9_]*)\s*(?:\[\s*"([^"]+)"\s*\]|\[([^\]]+)\]|\{\s*"([^"]+)"\s*\}|\{([^}]+)\})/g;
    const edgePattern = /([A-Za-z_][A-Za-z0-9_]*)\s*(?:--\>|--)\|?\s*(?:"?([^"|\n]+?)"?\s*\|)?\s*([A-Za-z_][A-Za-z0-9_]*)/g;

    let m;
    while ((m = nodePattern.exec(src)) !== null) {
      const id = m[1];
      const text = (m[2] || m[3] || m[4] || m[5] || '').replace(/\\n/g, '\n');
      if (!nodes.has(id)) nodes.set(id, text);
    }
    while ((m = edgePattern.exec(src)) !== null) {
      edges.push({ from: m[1], to: m[3], label: (m[2] || '').trim() });
      if (!nodes.has(m[1])) nodes.set(m[1], m[1]);
      if (!nodes.has(m[3])) nodes.set(m[3], m[3]);
    }
    return { nodes, edges };
  }

  // 简易层级布局
  function layout(nodes, edges) {
    const children = new Map();
    const indeg = new Map();
    for (const id of nodes.keys()) { children.set(id, []); indeg.set(id, 0); }
    edges.forEach(e => { children.get(e.from).push(e.to); indeg.set(e.to, (indeg.get(e.to) || 0) + 1); });

    const level = new Map();
    const queue = [];
    for (const [id, d] of indeg) if (d === 0) { level.set(id, 0); queue.push(id); }
    while (queue.length) {
      const u = queue.shift();
      for (const v of children.get(u) || []) {
        const lv = (level.get(u) || 0) + 1;
        if (lv > (level.get(v) || 0)) level.set(v, lv);
        queue.push(v);
      }
    }
    // 同层水平排列
    const byLv = new Map();
    for (const [id, lv] of level) { if (!byLv.has(lv)) byLv.set(lv, []); byLv.get(lv).push(id); }
    const pos = new Map();
    const W = 180, H = 80, GX = 40, GY = 60;
    for (const [lv, arr] of byLv) {
      arr.forEach((id, i) => { pos.set(id, { x: 40 + i * (W + GX), y: 40 + lv * (H + GY) }); });
    }
    for (const id of nodes.keys()) if (!pos.has(id)) pos.set(id, { x: 40, y: 40 });
    return { pos, W, H };
  }

  function toDrawioXML(mermaidSrc, title) {
    const { nodes, edges } = parseFlow(mermaidSrc);
    const { pos, W, H } = layout(nodes, edges);

    let cells = '';
    let zid = 2;
    const idMap = new Map();
    for (const [id, text] of nodes) {
      const mxId = String(++zid);
      idMap.set(id, mxId);
      const { x, y } = pos.get(id);
      cells += `
        <mxCell id="${mxId}" value="${escapeXML(text)}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="${x}" y="${y}" width="${W}" height="${H}" as="geometry"/>
        </mxCell>`;
    }
    for (const e of edges) {
      const mxId = String(++zid);
      cells += `
        <mxCell id="${mxId}" value="${escapeXML(e.label || '')}" style="endArrow=classic;html=1;rounded=0;edgeStyle=orthogonalEdgeStyle;" edge="1" parent="1" source="${idMap.get(e.from)}" target="${idMap.get(e.to)}">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="科一手册导出" version="22.0">
  <diagram id="km1" name="${escapeXML(title || '记忆图')}">
    <mxGraphModel dx="1000" dy="700" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        ${cells}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
  }

  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function copyText(text) {
    if (navigator.clipboard) return navigator.clipboard.writeText(text);
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
    return Promise.resolve();
  }

  window.DrawIO = { toDrawioXML, download, copyText };
})();

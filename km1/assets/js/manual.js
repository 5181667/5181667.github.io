// =========================================================
// 记忆手册数据 + 10 张 Mermaid 记忆图 + 视图渲染
// 所有内容基于科目一常考点整理（C1/C2 通用）
// =========================================================
(function () {
  'use strict';

  // ---------- 10 张 Mermaid 记忆图 ----------
  const CHARTS = {
    overspeed: {
      title: '超速扣分决策树（普36，高6/12；中校危普1/6/9、高6/12）',
      desc: '口诀：普36，高6 12；中校危普1 6 9，中校危高6 12。',
      src: `flowchart TD
    S["查超速扣分<br/>先看车型再看路况"] --> T{车辆类型?}
    T -->|普通车| P{公路类型?}
    T -->|"中校危<br/>中型客车/校车/危险品"| D{公路类型?}
    P -->|普通公路| P1["20%-50% → 记3分<br/>50%以上 → 记6分"]
    P -->|高速/快速路| P2["20%-50% → 记6分<br/>50%以上 → 记12分"]
    D -->|普通公路| D1["10%-20% → 记1分<br/>20%-50% → 记6分<br/>50%以上 → 记9分"]
    D -->|高速/快速路| D2["20%以下 → 记6分<br/>20%以上 → 记12分"]`
    },

    overload: {
      title: '超员扣分决策树（下36、上69，以上扣12）',
      desc: '校车/客运/旅游更严：未达20% 记6分，20%以上直接12分。',
      src: `flowchart TD
    A["超员百分比<br/>按车型分三类"] --> B{车辆类型?}
    B -->|"校车/公路客运/旅游客运"| R1["未达20% → 记6分<br/>20%以上 → 记12分"]
    B -->|7座以下| R2["20%-50% → 记3分<br/>50%-100% → 记6分<br/>100%以上 → 记12分"]
    B -->|7座以上| R3["20%-50% → 记6分<br/>50%-100% → 记9分<br/>100%以上 → 记12分"]`
    },

    overcargo: {
      title: '超载扣分（载货汽车）',
      desc: '记忆：30%以下1分；30%-50% 记3分；50%以上 记6分。',
      src: `flowchart LR
    A["货车超载%"] --> B["30%以下<br/>记1分"]
    A --> C["30%-50%<br/>记3分"]
    A --> D["50%以上<br/>记6分"]`
    },

    alcohol: {
      title: '酒驾 / 醉驾处罚对照',
      desc: '酒驾：20 ≤ BAC < 80 mg/100ml；醉驾：BAC ≥ 80 mg/100ml。',
      src: `flowchart LR
    J1["饮酒驾车<br/>20 ≤ BAC < 80"] --> J2["扣证6个月<br/>罚款1000-2000元"]
    J2 --> J3["再次酒驾<br/>吊销证 + 拘10日以下<br/>罚1000-2000元"]
    J2 --> J4["酒驾营运车<br/>吊销证 + 拘15日<br/>罚5000元<br/>5年内不得重取"]
    Z1["醉酒驾车<br/>BAC ≥ 80"] --> Z2["吊销证 + 追究刑责<br/>5年内不得重取"]
    Z2 --> Z3["醉驾营运车<br/>吊销证 + 刑责<br/>10年内不得重取"]
    Z2 --> Z4["酒后/醉酒发生重大事故<br/>构成犯罪<br/>终生不得重取"]`
    },

    speedLimit: {
      title: '城市/公路 × 有无中心线 限速矩阵（35/47）',
      desc: '口诀"35、47"：城市30/50、公路40/70。',
      src: `flowchart TD
    A["限速记忆"] --> B["城市道路"]
    A --> C["公路"]
    B --> B1["无中心线 → 30 km/h"]
    B --> B2["有中心线 → 50 km/h"]
    C --> C1["无中心线 → 40 km/h"]
    C --> C2["有中心线 → 70 km/h"]`
    },

    visibility: {
      title: '高速能见度 261 / 145 / 52离',
      desc: '能见度越低，车速越低、车距越大。52离 = 能见度<50米尽快驶离。',
      src: `flowchart TD
    A["高速公路能见度"] --> L1["<200米<br/>车速 ≤ 60 km/h<br/>车距 > 100米<br/>(261)"]
    A --> L2["<100米<br/>车速 ≤ 40 km/h<br/>车距 > 50米<br/>(145)"]
    A --> L3["<50米<br/>车速 ≤ 20 km/h<br/>尽快驶离高速<br/>(52离)"]`
    },

    time: {
      title: '科一常考"时间"速查',
      desc: '背口诀：1日核发 / 3日号牌、受理 / 15日补换申领 / 30日信息转让 / 90日有效期满前 / 12月周期实习期。',
      src: `flowchart LR
    T1["核发驾驶证明 → 1日"]
    T2["收到机动号牌 → 3日"]
    T3["受理 → 3日"]
    T4["调解 → 10日"]
    T5["补换号牌/申领号牌 → 15日"]
    T6["信息变更/所有权转让 → 30日"]
    T7["有效期满前 → 90日"]
    T8["周期/实习期 → 12月"]
    T9["凭证齐全 → 当场"]
    T10["增驾轻型 → 受理直接发"]`
    },

    fine: {
      title: '常考罚款金额速查',
      desc: '由小到大一张图记住。',
      src: `flowchart LR
    F1["虚假材料 → 500元"] --> F2["弄虚作假 → 1000元"]
    F2 --> F3["贿赂舞弊 → 2000元"]
    F3 --> F4["伪造变造 → 2000-5000元"]
    F4 --> F5["饮酒/醉酒 → 1000-2000元"]
    F5 --> F6["逾期 → 200-500元"]
    F6 --> F7["补领 → 20-200元"]
    F7 --> F8["组织他人代审<br/>有违法所得 3倍2万<br/>无违法所得 2万以下"]
    F8 --> F9["组织他人代罚<br/>3倍5万"]
    F9 --> F10["不正当手段牟利<br/>3-5倍，≤10万"]`
    },

    deduct: {
      title: '扣分项 1 / 3 / 6 / 9 / 12 分级汇总',
      desc: '按金字塔记忆：条目越上越严重。',
      src: `flowchart TB
    subgraph P12 ["扣12分（最严重）"]
      A12["卖分牟利 / 伪造变造行驶证、号牌 / 饮酒醉酒开车 / 高速倒车逆行 / 致人轻伤以上或死亡逃逸"]
    end
    subgraph P9 ["扣9分"]
      A9["故意遮挡、污损号牌 / 未悬挂号牌 / 与准驾车型不符 / 高速公路违法停车"]
    end
    subgraph P6 ["扣6分"]
      A6["违反信号灯 / 违法占用应急车道 / 致人轻微伤或财产损失逃逸 / 未设置警示标志"]
    end
    subgraph P3 ["扣3分"]
      A3["不按规定车道行驶 / 不避让行人校车 / 拨打接听电话 / 普通公路逆行 / 穿插等候车辆 / 未设置警告标志 / 不按规定安装号牌 / 高速低于规定最低时速 / 事故后不按规定使用灯光"]
    end
    subgraph P1 ["扣1分"]
      A1["未系安全带 / 未按规定年检 / 违反禁令标志 / 不按规定会车 / 不按规定使用灯光 / 普路不按规定倒车掉头"]
    end
    P1 --> P3 --> P6 --> P9 --> P12`
    },

    yield: {
      title: '十字路口让行优先级（直 > 左 > 右 > 掉）',
      desc: '同级别情况下：右方车优先；左转让直行；转弯让直行。',
      src: `flowchart LR
    A["直行"] -->|优先于| B["左转"]
    B -->|优先于| C["右转"]
    C -->|优先于| D["掉头"]`
    },

    sentence: {
      title: '重大事故责任量刑阶梯',
      desc: '3 年以下 → 3-7 年 → 7 年以上。',
      src: `flowchart TD
    A["发生重大事故"] --> B{情节?}
    B -->|致人重伤、死亡、重大财产损失| C["3年以下<br/>有期徒刑或拘役"]
    B -->|致人死亡且逃逸 / 其他恶劣情节| D["3-7年<br/>有期徒刑"]
    B -->|逃逸致人死亡| E["7年以上<br/>有期徒刑"]`
    }
  };

  // ---------- 27 知识点结构化内容 ----------
  const MANUAL_DATA = [
    { n:1, title:'假一吊二撤三醉五逃终生', items:[
      ['假一','提供虚假材料，一年内不得报考'],
      ['吊二','吊销驾驶证后，两年内不得报考'],
      ['撤三','被撤销驾驶证，三年内不得报考'],
      ['醉五','醉驾吊销驾照，五年内不得报考'],
      ['逃终生','交通肇事逃逸，终身不能报考']
    ], tip:'只要看到"假吊撤醉逃"立刻对应 1/2/3/5/终生。'},

    { n:2, title:'口五站三 —— 不能停车', items:[
      ['口五','题里有"口"的选 50米不能停车'],
      ['站三','题目有"站"的选 30米不能停车'],
      ['剩下','全选150米，没有150米的选最大']
    ], tip:'关键字匹配即可，口→50，站→30，其他默认150。'},

    { n:3, title:'高速能见度 261 / 145 / 52离', chart:'visibility', items:[
      ['261','能见度 <200米，车速 ≤60km/h，车距 >100米'],
      ['145','能见度 <100米，车速 ≤40km/h，车距 >50米'],
      ['52离','能见度 <50米，车速 ≤20km/h，尽快驶离高速']
    ], tip:'三段记忆；最低能见度必须尽快驶离。'},

    { n:4, title:'高速车道限速：两车道、三车道', items:[
      ['高速两车道','100-120 km/h、60-100 km/h'],
      ['高速三车道','110-120、90-110、60-90 km/h']
    ], tip:'车道越靠左速度越高；最低车道不得低于 60。'},

    { n:5, title:'城市35、公路47 限速', chart:'speedLimit', items:[
      ['城市无中心线','30 km/h'],
      ['城市有中心线','50 km/h'],
      ['公路无中心线','40 km/h'],
      ['公路有中心线','70 km/h']
    ], tip:'记口诀"35、47"：城市30/50，公路40/70。'},

    { n:6, title:'警告标志放置距离', items:[
      ['高速公路','来车方向 150米以外 放置警告标志'],
      ['普通公路','来车方向 50-100米 放置警告标志']
    ]},

    { n:7, title:'减分政策：公益、网上、现场 (111 / 331 / 112)', items:[
      ['公益活动 111','满1小时为1次，1次扣减1分'],
      ['网上学习 331','学习3日内，满30分钟，1次扣减1分'],
      ['现场学习 112','现场学习满1小时，1次扣减2分']
    ]},

    { n:8, title:'客挂不可初申领', items:[
      ['初次可申领','C1、C2 可初次申领'],
      ['初次不可申领','客车、挂车 不可初次申领，只能增驾取得']
    ]},

    { n:9, title:'上路行驶应携带：2证、2标、1号牌', items:[
      ['2证','驾驶证、行驶证'],
      ['2标','保险标志、检验合格标志'],
      ['1号牌','机动车号牌']
    ]},

    { n:10, title:'手动挡踏板：离、制、加（从左到右）', items:[
      ['离','离合踏板（离合器）'],
      ['制','制动踏板（刹车）'],
      ['加','加速踏板（油门）']
    ]},

    { n:11, title:'自动挡踏板：左休息，右制加', items:[
      ['左休息','左脚不踩踏板'],
      ['右脚制','制动踏板（刹车）'],
      ['右脚加','加速踏板（油门）']
    ]},

    { n:12, title:'漫水路安全行驶：一停、二看、三通过', items:[
      ['过漫水路','一停、二看、三通过，确认安全后低速通过']
    ]},

    { n:13, title:'重大事故责任判定', chart:'sentence', items:[
      ['3年以下','致人重伤、死亡、财产重大损失'],
      ['3-7年','致人死亡且逃逸、逃逸或其他恶劣情节'],
      ['7年以上','逃逸致人死亡']
    ]},

    { n:14, title:'登记地、核发地', items:[
      ['车登记','和车相关，找登记地'],
      ['人核发','和人相关，找核发地']
    ], tip:'车在哪登记就在哪办，驾驶人手续回核发地。'},

    { n:15, title:'道路虚线、实线', items:[
      ['虚线','可以跨越虚线，变更车道'],
      ['实线','不可以跨越实线，变更车道']
    ]},

    { n:16, title:'特殊路段、天气：限速30 km/h', items:[
      ['口路桥','通过铁路道口、急弯路、窄路、窄桥'],
      ['掉弯坡','掉头、转弯、下陡坡'],
      ['雾雨雪沙冰雹','雾、雨、雪、沙尘、冰雹']
    ], tip:'只要是题里提到上面任意一种，都选 30km/h。'},

    { n:17, title:'校车停车，其他车道行驶', items:[
      ['只有一条车道','校车后方车辆停车等待'],
      ['二条以上车道','校车后方及相邻车道车辆要停车等待，其他车道车辆可以减速通过']
    ]},

    { n:18, title:'驾驶证有效期', items:[
      ['初次申领','6年'],
      ['6年满换发','10年'],
      ['10年满换发','长期'],
    ], tip:'常考判断 20年有效期是否正确（错，没有20年）。'},

    { n:19, title:'优先通行原则：直行 > 左转 > 右转 > 掉头', chart:'yield', items:[
      ['典型题','十字路口A车直行、B车左转 → A车先行'],
      ['同方向让行','直行让对向来车优先于让左转']
    ]},

    { n:20, title:'驾照考试科目', items:[
      ['科目一','道路交通安全法律法规和相关知识'],
      ['科目二','场地驾驶技能考试'],
      ['科目三','道路驾驶技能、安全文明驾驶常识（俗称科目四）']
    ]},

    { n:21, title:'C1 手动挡科目二考试项目', items:[
      ['五项','倒车入库、侧方位停车、曲线行驶、直角转弯、坡道定点停车与起步'],
      ['注意','C2 自动挡没有坡道定点停车与起步'],
      ['考试机会','科二科三各5次机会，超5次不合格需重考']
    ]},

    { n:22, title:'点火开关 4 个挡位', items:[
      ['LOCK','切断电源，锁定方向盘'],
      ['ACC','接通附件电源，如收音机等'],
      ['ON','接通除起动机外的全车全部电源'],
      ['START','接通起动机电源，起动发动机']
    ]},

    { n:23, title:'酒驾、醉驾判定', chart:'alcohol', items:[
      ['酒驾','80 mg/100ml > 血液酒精含量 ≥ 20 mg/100ml'],
      ['醉驾','血液酒精含量 ≥ 80 mg/100ml']
    ]},

    { n:24, title:'酒驾处罚', chart:'alcohol', items:[
      ['首次酒驾','扣证6个月 + 罚1000-2000元'],
      ['再次酒驾','吊销证 + 拘10日以下 + 罚1000-2000元'],
      ['酒驾营运车','吊销证 + 罚5000元 + 拘15日 + 5年内不得重取']
    ]},

    { n:25, title:'醉驾处罚', chart:'alcohol', items:[
      ['醉驾','吊销证 + 刑事责任 + 5年内不得重取驾驶证'],
      ['醉驾营运车','吊销证 + 刑责 + 10年内不得重取，此后不得驾营运车'],
      ['构成犯罪','终生不得重取机动车驾驶证']
    ]},

    { n:26, title:'常考罚款题', chart:'fine', items:[
      ['虚假材料','500元'],
      ['弄虚作假','1000元'],
      ['贿赂舞弊','2000元'],
      ['伪造变造','2000-5000元'],
      ['饮酒醉酒','1000-2000元'],
      ['逾期','200-500元'],
      ['补领','20-200元'],
      ['不正当手段牟利','3-5倍罚款，不超过10万']
    ]},

    { n:27, title:'常考时间题（记关键字→天数）', chart:'time', items:[
      ['1日','核发驾驶证明'],
      ['3日','收到机动号牌 / 受理'],
      ['10日','调解'],
      ['15日','补换号牌、申领号牌'],
      ['30日','信息变更、所有权转让'],
      ['90日','有效期满前'],
      ['12月','周期 / 实习期'],
      ['1年','虚假 / 贿赂舞弊'],
      ['2年','吊销'],
      ['3年','兵役 / 吸毒 / 欺骗贿赂'],
      ['5年','醉酒'],
      ['6年','初次驾驶证'],
      ['终生','逃逸 / 犯罪']
    ], tip:'考试时看到关键字直接映射，如"受理"→3日，"醉酒"→5年。'},

    { n:28, title:'超员 / 超速 / 超载扣分（精华口诀）', chart:'deduct', extraCharts:['overspeed','overload','overcargo'], items:[
      ['超员口诀','下36 上69，看到以上扣12'],
      ['超速口诀','普36 高6、12；中校危普1、6、9；中校危高6、12'],
      ['超载口诀','30%以下1分，30-50% 3分，50%以上 6分']
    ], tip:'三张流程图横向对比即可 100% 命中。'}
  ];

  // ---------- 渲染 ----------
  let mermaidCounter = 0;
  function mermaidId() { return 'mmd_' + (++mermaidCounter) + '_' + Date.now().toString(36); }

  function renderChart(key) {
    const c = CHARTS[key];
    if (!c) return '';
    const id = mermaidId();
    return `
      <div class="mt-3 chart-block" data-chart="${key}">
        <div class="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div class="text-sm font-semibold text-slate-700 dark:text-slate-200">📊 ${escapeHtml(c.title)}</div>
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-sm" data-act="copy" data-key="${key}">复制 Mermaid</button>
            <button class="btn btn-ghost btn-sm" data-act="drawio" data-key="${key}">导出 drawio XML</button>
          </div>
        </div>
        <div class="mermaid-box">
          <div class="mermaid" id="${id}">${c.src}</div>
        </div>
        ${c.desc ? `<p class="text-xs text-slate-500 dark:text-slate-400 mt-2">${escapeHtml(c.desc)}</p>` : ''}
      </div>`;
  }

  function renderKnowledge(kp) {
    const itemsHTML = (kp.items || []).map(([label, val]) => `
      <div class="kp-item">
        <span class="kp-item-label">${escapeHtml(label)}</span>
        <span class="text-slate-700 dark:text-slate-200">：${formatRich(val)}</span>
      </div>`).join('');
    const charts = [kp.chart, ...(kp.extraCharts || [])].filter(Boolean);
    const chartsHTML = charts.map(renderChart).join('');
    return `
      <article class="card kp-card animate-slide-up" style="animation-delay:${kp.n * 18}ms">
        <div class="kp-head">
          <span class="kp-num">知识点 ${kp.n}</span>
          <span class="kp-title">${escapeHtml(kp.title)}</span>
        </div>
        ${itemsHTML}
        ${kp.tip ? `<div class="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 rounded-r text-sm">💡 <b>技巧</b>：${formatRich(kp.tip)}</div>` : ''}
        ${chartsHTML}
      </article>`;
  }

  function render(root) {
    root.innerHTML = `
      <section class="mb-6">
        <h1 class="text-2xl sm:text-3xl font-extrabold mb-2">
          <span class="tag-yellow">科目一</span>
          <span class="ml-2">懒人速记口诀 + 记忆图</span>
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">共 ${MANUAL_DATA.length} 个知识点 · ${Object.keys(CHARTS).length} 张记忆图 · 支持复制 Mermaid 源码与导出 drawio XML</p>
        <nav class="mt-4 flex flex-wrap gap-2" id="kpNav">
          ${MANUAL_DATA.map(k => `<a href="#kp${k.n}" class="tag-blue hover:scale-105 transition text-xs">#${k.n}</a>`).join('')}
        </nav>
      </section>
      <div class="grid md:grid-cols-2 gap-4">
        ${MANUAL_DATA.map(k => `<div id="kp${k.n}" class="kp-anchor">${renderKnowledge(k)}</div>`).join('')}
      </div>`;

    root.addEventListener('click', onManualClick, { once: false });
    initMermaid(root);
  }

  async function initMermaid(root) {
    if (!window.mermaid) return;
    const nodes = root.querySelectorAll('.mermaid');
    try {
      await window.mermaid.run({ nodes });
    } catch (e) { console.warn('mermaid render error', e); }
  }

  function onManualClick(e) {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const key = btn.dataset.key;
    const c = CHARTS[key];
    if (!c) return;
    if (btn.dataset.act === 'copy') {
      DrawIO.copyText(c.src).then(() => window.toast && toast('Mermaid 源码已复制'));
    } else if (btn.dataset.act === 'drawio') {
      const xml = DrawIO.toDrawioXML(c.src, c.title);
      DrawIO.download(key + '.drawio.xml', xml, 'application/xml');
      window.toast && toast('已下载 drawio XML，可拖入 draw.io');
    }
  }

  // ---------- 工具 ----------
  function escapeHtml(s) {
    return String(s).replace(/[<>&"]/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;' }[c]));
  }
  // 对文本里的数字+单位做高亮（仅处理数字 + 单位的组合，避免误伤）
  function formatRich(s) {
    const esc = escapeHtml(s);
    return esc.replace(
      /(\d+(?:\.\d+)?(?:\s*)(?:-\s*\d+)?\s*(?:km\/h|mg\/100ml|km|米|分|元|日|月|年|小时|%|倍|次|座))/g,
      '<span class="tag-red">$1</span>'
    );
  }

  window.ManualView = { render };
  window.CHARTS = CHARTS;
})();

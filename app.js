/**
 * P33 主编的权柄（左滑右滑）
 * Upgraded: 8 clues (doubled), swipe animation, ending evaluation, statistics
 */
const card = document.getElementById("card");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const statusEl = document.getElementById("status");
const credEl = document.getElementById("cred");
const trafficEl = document.getElementById("traffic");
const resultEl = document.getElementById("result");

const CLUES = [
  { text: "匿名爆料指控某校食堂回扣，但仅有微信群截图，无法联系到爆料人。", release: { cred: -8, traffic: +10 }, hold: { cred: +4, traffic: -2 } },
  { text: "独家视频显示工地安全隐患，有两位目击证人，现场照片清晰。", release: { cred: +6, traffic: +8 }, hold: { cred: -4, traffic: -3 } },
  { text: "网传明星离婚，来源仅一个营销号，当事人社交账号无异常。", release: { cred: -6, traffic: +12 }, hold: { cred: +3, traffic: -1 } },
  { text: "公共预算数据出现异常波动，需核对 3 年原始财报表格。", release: { cred: +2, traffic: +3 }, hold: { cred: +6, traffic: 0 } },
  { text: "竞对媒体已抢发相似内容，但核实度存疑。跟进还是等待？", release: { cred: -4, traffic: +7 }, hold: { cred: +5, traffic: -5 } },
  { text: "知情人透露某上市公司财务造假，提供了部分内部邮件。", release: { cred: +3, traffic: +9 }, hold: { cred: +2, traffic: -2 } },
  { text: "社交媒体热传一段暴力执法视频，但仅有 8 秒画面且无上下文。", release: { cred: -5, traffic: +11 }, hold: { cred: +4, traffic: -1 } },
  { text: "调查记者历时 3 个月完成的深度稿，但涉及多方利益可能引发诉讼。", release: { cred: +8, traffic: +5 }, hold: { cred: -6, traffic: -4 } },
  { text: "一位受害者家属愿意接受独家采访，但要求不经核实直接发布其说法。", release: { cred: -7, traffic: +8 }, hold: { cred: +3, traffic: -3 } },
  { text: "某环保组织提供了工厂排污的检测报告，数据详实但该组织有利益诉求。", release: { cred: +1, traffic: +6 }, hold: { cred: +4, traffic: -1 } },
  { text: "AI 工具检测一篇投稿可能是机器生成，但作者坚称原创。", release: { cred: -3, traffic: +4 }, hold: { cred: +5, traffic: -2 } },
  { text: "一份疑似政府内部会议纪要在网上流传，内容涉及重大政策调整。", release: { cred: -4, traffic: +14 }, hold: { cred: +6, traffic: -6 } },
  { text: "自家记者在灾难现场发回独家，但画面中可辨认出伤者面部。", release: { cred: -5, traffic: +9 }, hold: { cred: +7, traffic: -3 } },
  { text: "一项学术研究称某食品有害健康，但样本仅 50 人且未经同行评审。", release: { cred: -6, traffic: +10 }, hold: { cred: +5, traffic: -1 } },
  { text: "某公益基金会内部人士举报善款挪用，提供了银行流水截图。", release: { cred: +4, traffic: +7 }, hold: { cred: +3, traffic: -2 } },
  { text: "社交媒体上一段感人视频引发刷屏，但反向搜图发现是两年前的旧素材。", release: { cred: -8, traffic: +6 }, hold: { cred: +6, traffic: -1 } },
  { text: "某地发生群体性事件，目前只有现场群众的碎片化信息，官方尚未回应。", release: { cred: -3, traffic: +12 }, hold: { cred: +4, traffic: -4 } },
  { text: "独家获取一份企业 ESG 报告与实际排放数据的对比分析，数据扎实。", release: { cred: +7, traffic: +6 }, hold: { cred: -3, traffic: -5 } },
  { text: "一位公众人物的私人聊天记录被泄露，内容涉及公共利益但获取方式存疑。", release: { cred: -2, traffic: +13 }, hold: { cred: +5, traffic: -3 } },
  { text: "本社实习记者写了一篇有深度的调查，但行文中有明显立场倾向。", release: { cred: -4, traffic: +5 }, hold: { cred: +6, traffic: -2 } }
];


let idx = 0;
let cred = 50;
let traffic = 50;
let decisions = [];

function setStatus(text) {
  statusEl.textContent = `状态: ${text}`;
}

function updateBars() {
  credEl.innerHTML = `公信力: <strong>${cred}</strong> <span class="bar-mini"><span class="bar-fill cred-fill" style="width:${cred}%"></span></span>`;
  trafficEl.innerHTML = `流量: <strong>${traffic}</strong> <span class="bar-mini"><span class="bar-fill traffic-fill" style="width:${traffic}%"></span></span>`;
}

function showCard() {
  if (idx >= CLUES.length) {
    showEnding();
    return;
  }
  // Slide-in animation
  card.style.transform = "translateX(40px)";
  card.style.opacity = "0";
  card.textContent = `📰 线索 ${idx + 1}/${CLUES.length}: ${CLUES[idx].text}`;
  requestAnimationFrame(() => {
    card.style.transition = "transform 0.3s, opacity 0.3s";
    card.style.transform = "translateX(0)";
    card.style.opacity = "1";
  });
  setStatus(`第 ${idx + 1} 条线索，请做出决策`);
}

function apply(delta) {
  cred = Math.max(0, Math.min(100, cred + delta.cred));
  traffic = Math.max(0, Math.min(100, traffic + delta.traffic));
  updateBars();
}

function showEnding() {
  const released = decisions.filter(d => d.action === "发布").length;
  const held = decisions.filter(d => d.action === "扣留").length;

  let title, desc, emoji;
  if (cred >= 70 && traffic >= 50) {
    emoji = "🏆"; title = "标杆主编"; desc = "你在公信力和流量之间找到了完美平衡！";
  } else if (cred >= 60) {
    emoji = "📰"; title = "严谨主编"; desc = "你重视事实核查，但可能错过了一些流量机会。";
  } else if (traffic >= 70) {
    emoji = "📈"; title = "流量猎手"; desc = "你追逐热度的嗅觉一流，但公信力需要修复。";
  } else {
    emoji = "😰"; title = "两难困境"; desc = "公信力和流量双双受挫，新闻伦理确实不易。";
  }

  card.innerHTML = `
    <div class="ending">
      <div class="ending-emoji">${emoji}</div>
      <h2>${title}</h2>
      <p>${desc}</p>
      <p class="ending-stats">发布 ${released} 条 / 扣留 ${held} 条</p>
      <p class="ending-scores">最终公信力: ${cred} | 最终流量: ${traffic}</p>
    </div>
  `;
  leftBtn.disabled = true;
  rightBtn.disabled = true;
  setStatus("本轮结束。刷新页面可重玩。");

  if (resultEl) {
    resultEl.innerHTML = decisions.map((d, i) =>
      `<div class="decision-log"><span>${i + 1}. ${d.action === "发布" ? "📤" : "📥"} ${d.action}</span><span class="decision-effect">公信力 ${d.delta.cred >= 0 ? "+" : ""}${d.delta.cred} / 流量 ${d.delta.traffic >= 0 ? "+" : ""}${d.delta.traffic}</span></div>`
    ).join("");
  }
}

leftBtn.addEventListener("click", () => {
  const delta = CLUES[idx].hold;
  decisions.push({ action: "扣留", delta });
  // Swipe left animation
  card.style.transition = "transform 0.2s, opacity 0.2s";
  card.style.transform = "translateX(-60px)";
  card.style.opacity = "0";
  setTimeout(() => {
    apply(delta);
    idx += 1;
    showCard();
  }, 200);
});

rightBtn.addEventListener("click", () => {
  const delta = CLUES[idx].release;
  decisions.push({ action: "发布", delta });
  // Swipe right animation
  card.style.transition = "transform 0.2s, opacity 0.2s";
  card.style.transform = "translateX(60px)";
  card.style.opacity = "0";
  setTimeout(() => {
    apply(delta);
    idx += 1;
    showCard();
  }, 200);
});

updateBars();
showCard();

// === PM Metrics Integration ===
(function () {
  try {
    if (!window.pmMetrics) return;
    let taskStarted = false;
    document.addEventListener('click', function (e) {
      if (taskStarted) return;
      const btn = e.target.closest('button');
      if (btn) {
        taskStarted = true;
        window.pmMetrics.markTaskStart('editor_swipe_task');
      }
    }, { once: false });
  } catch (_e) { }
})();

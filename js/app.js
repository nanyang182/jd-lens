/* ============================================================
   JD Lens · 应用逻辑
   ------------------------------------------------------------
   单一状态 + 全量重渲染。数据量小（几十份 JD），
   与其上框架，不如把状态和渲染写清楚。
   ============================================================ */
(function () {
  "use strict";

  var DICT = window.JD_DICT;
  var P = window.JD_PARSER;
  var CH = window.JD_CHARTS;
  var esc = CH.esc;

  var KEY = "jdlens.v2";
  var state = {
    mine: DICT.defaultMine.slice(),
    custom: [],      // 用户自定义技能：{id, name}
    docs: [],
    currentId: null,
    sampleIndex: 0
  };

  var $ = function (id) { return document.getElementById(id); };

  /* ---------------------------------------------------------- 持久化 */
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (Array.isArray(saved.mine)) state.mine = saved.mine;
      if (Array.isArray(saved.custom)) state.custom = saved.custom;
      if (Array.isArray(saved.docs)) state.docs = saved.docs;
      if (saved.currentId) state.currentId = saved.currentId;
      if (typeof saved.sampleIndex === "number") state.sampleIndex = saved.sampleIndex;
    } catch (e) {
      /* 存储损坏就当第一次用 */
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        mine: state.mine,
        custom: state.custom,
        docs: state.docs,
        currentId: state.currentId,
        sampleIndex: state.sampleIndex
      }));
    } catch (e) {
      toast("本地存储已满，历史记录可能未保存");
    }
  }

  /* ---------------------------------------------------------- 工具 */
  function allSkills() {
    return DICT.skills.concat(
      state.custom.map(function (c) {
        return { id: c.id, name: c.name, cat: "general", w: 1.0, aliases: [c.name] };
      })
    );
  }

  function current() {
    for (var i = 0; i < state.docs.length; i++) {
      if (state.docs[i].id === state.currentId) return state.docs[i];
    }
    return state.docs.length ? state.docs[0] : null;
  }

  function reanalyzeAll() {
    var skills = allSkills();
    state.docs = state.docs.map(function (d) {
      var next = P.analyze(d.text, state.mine, skills);
      if (!next) return d;
      next.id = d.id;
      next.savedAt = d.savedAt;
      return next;
    });
  }

  var toastTimer = null;
  function toast(msg) {
    var el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2200);
  }

  /* ---------------------------------------------------------- 渲染 */
  function renderMeta() {
    $("meta-docs").textContent = state.docs.length + " 份 JD";
    $("meta-skills").textContent = state.mine.length + " 项技能";
    $("doc-count").textContent = state.docs.length + " 份";
    $("foot-note").textContent = "词库 " + allSkills().length + " 项 · 纯本地解析";
  }

  function renderSkills() {
    var host = $("skill-tags");
    host.innerHTML = allSkills()
      .map(function (s) {
        var on = state.mine.indexOf(s.id) !== -1;
        var custom = s.id.indexOf("c_") === 0;
        return (
          '<span class="tag' + (on ? " on" : "") + '" data-id="' + s.id + '" role="button" tabindex="0">' +
            esc(s.name) +
            (custom ? '<span class="x" data-del="' + s.id + '" title="删除这个自定义技能">×</span>' : "") +
          "</span>"
        );
      })
      .join("");
  }

  function renderDocList() {
    var host = $("doc-list");
    if (!state.docs.length) {
      host.innerHTML = '<li class="doc-empty">分析过的 JD 会出现在这里，方便对比。</li>';
      return;
    }
    host.innerHTML = state.docs
      .map(function (d) {
        var on = d.id === state.currentId ? " on" : "";
        return (
          '<li class="doc-item' + on + '" data-id="' + d.id + '">' +
            '<span class="t" title="' + esc(d.title) + '">' + esc(d.title) + "</span>" +
            '<span class="s">' + d.score + "%</span>" +
            '<button class="del" data-del="' + d.id + '" title="删除">×</button>' +
          "</li>"
        );
      })
      .join("");
  }

  function renderResult() {
    var doc = current();
    var empty = $("empty-state");
    var box = $("result");

    if (!doc) {
      empty.hidden = false;
      box.hidden = true;
      return;
    }
    empty.hidden = true;
    box.hidden = false;

    $("doc-title").textContent = doc.title;

    var metaPairs = [
      ["岗位", doc.meta.role],
      ["经验", doc.meta.years],
      ["学历", doc.meta.degree],
      ["城市", doc.meta.city],
      ["薪资", doc.meta.salary]
    ].filter(function (p) { return p[1]; });

    $("doc-meta").innerHTML =
      metaPairs.map(function (p) {
        return '<span class="chip">' + p[0] + " <b>" + esc(p[1]) + "</b></span>";
      }).join("") +
      '<span class="chip">识别 <b>' + doc.hits.length + "</b> 项要求</span>";

    // 匹配度
    CH.ring($("ring-fg"), doc.score);
    $("score-num").textContent = doc.score + "%";
    $("kpi-hit").textContent = doc.hits.length;
    $("kpi-have").textContent = doc.have.length;
    $("kpi-gap").textContent = doc.missing.length;

    var line;
    if (!doc.hits.length) {
      line = "这段文字里没有识别到技能关键词。如果确实是 JD，可以补充技能词典里没有的词。";
    } else if (!doc.missing.length) {
      line = "这份 JD 要求的 " + doc.hits.length + " 项技能你全部覆盖，准备作品集和实习经历就行。";
    } else {
      var top3 = doc.missing.slice(0, 3).map(function (m) { return "「" + m.name + "」"; }).join("");
      line = "这份 JD 识别出 " + doc.hits.length + " 项要求，你已覆盖 " +
        doc.have.length + " 项。建议优先补 " + top3 + "。";
    }
    $("score-line").textContent = line;

    // 条形图：前 8 项
    CH.bars($("bars-hits"), doc.hits.slice(0, 8).map(function (h) {
      var isHave = state.mine.indexOf(h.id) !== -1;
      return {
        name: h.name,
        value: h.weight,
        cat: h.cat,
        miss: !isHave,
        title: h.name + "：出现 " + h.count + " 次 · 权重 " + h.w + (isHave ? " · 已具备" : " · 待补齐"),
        label: h.count + " 次"
      };
    }));

    // 缺口：严格按"要求强度"排，次数只作为同权重时的次序
    var gapHost = $("gap-list");
    if (!doc.missing.length) {
      gapHost.innerHTML = '<li class="gap-ok">没有缺口。下一步是准备能证明这些技能的作品或经历。</li>';
    } else {
      var ordered = doc.missing.slice().sort(function (a, b) {
        return b.w - a.w || b.count - a.count;
      });
      gapHost.innerHTML = ordered.slice(0, 5).map(function (m, i) {
        var lv = m.w >= 1.2 ? "high" : m.w >= 0.8 ? "mid" : "low";
        var lvText = lv === "high" ? "高" : lv === "mid" ? "中" : "低";
        return (
          '<li class="gap ' + lv + '">' +
            '<span class="idx">' + (i + 1) + "</span>" +
            '<div class="body">' +
              '<div class="name">' + esc(m.name) + "</div>" +
              '<div class="why">JD 提到 ' + m.count + " 次 · 权重 " + m.w +
                (lv === "high" ? " · 核心要求" : lv === "mid" ? " · 常见要求" : " · 加分项") + "</div>" +
            "</div>" +
            '<span class="lv">' + lvText + "</span>" +
          "</li>"
        );
      }).join("");
    }
  }

  function renderSummary() {
    var panel = $("summary");
    if (!state.docs.length) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    var agg = P.aggregate(state.docs).slice(0, 8);
    $("summary-sub").textContent =
      "共 " + state.docs.length + " 份 JD · 出现次数越多，越是这个方向的硬通货";

    CH.bars($("bars-summary"), agg.map(function (a) {
      var mine = state.mine.indexOf(a.id) !== -1;
      return {
        name: a.name,
        value: a.docs,
        cat: a.cat,
        miss: !mine,
        title: a.name + "：出现在 " + a.docs + " 份 JD 中，累计 " + a.count + " 次",
        label: a.docs + " 份"
      };
    }));
  }

  function renderAll() {
    renderMeta();
    renderSkills();
    renderDocList();
    renderResult();
    renderSummary();
  }

  /* ---------------------------------------------------------- 动作 */
  function analyzeCurrentText() {
    var raw = $("jd-text").value;
    if (raw.trim().length < 20) {
      toast("JD 太短了，至少粘一段完整的要求");
      $("jd-text").focus();
      return;
    }
    var doc = P.analyze(raw, state.mine, allSkills());
    if (!doc) return;

    var dup = state.docs.some(function (d) { return d.text === doc.text; });
    if (dup) {
      toast("这份 JD 已经分析过了，直接在左边点它就能看");
      return;
    }

    state.docs.unshift(doc);
    state.currentId = doc.id;
    $("jd-text").value = "";
    save();
    renderAll();
    toast("已分析：" + doc.title);
  }

  function toggleSkill(id) {
    var i = state.mine.indexOf(id);
    if (i === -1) state.mine.push(id);
    else state.mine.splice(i, 1);
    reanalyzeAll();
    save();
    renderAll();
  }

  function addCustomSkill(name) {
    name = String(name || "").trim();
    if (!name) return;
    if (name.length > 20) name = name.slice(0, 20);

    var exists = allSkills().some(function (s) { return s.name === name; });
    if (exists) { toast("「" + name + "」已经在词库里了"); return; }

    var id = "c_" + name;
    state.custom.push({ id: id, name: name });
    state.mine.push(id);          // 自己加的词，默认认为你已具备
    reanalyzeAll();
    save();
    renderAll();
    toast("已加入词库并标记为已具备");
  }

  function removeCustomSkill(id) {
    state.custom = state.custom.filter(function (c) { return c.id !== id; });
    state.mine = state.mine.filter(function (m) { return m !== id; });
    reanalyzeAll();
    save();
    renderAll();
  }

  function selectDoc(id) {
    state.currentId = id;
    save();
    renderAll();
    var box = $("result");
    if (box && !box.hidden) box.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function deleteDoc(id) {
    state.docs = state.docs.filter(function (d) { return d.id !== id; });
    if (state.currentId === id) state.currentId = state.docs.length ? state.docs[0].id : null;
    save();
    renderAll();
  }

  function loadSample() {
    var s = DICT.samples[state.sampleIndex % DICT.samples.length];
    state.sampleIndex++;
    $("jd-text").value = s.text;
    $("jd-text").focus();
    save();
    toast("已载入示例：" + s.title);
  }

  function exportMarkdown() {
    var doc = current();
    if (!doc) { toast("还没有可导出的分析"); return; }

    var lines = [];
    lines.push("# JD 分析 · " + doc.title);
    lines.push("");
    lines.push("- 生成时间：" + new Date().toLocaleString("zh-CN"));
    lines.push("- 匹配度：" + doc.score + "%（" + doc.have.length + "/" + doc.hits.length + " 项）");
    var metaBits = [doc.meta.role, doc.meta.years, doc.meta.degree, doc.meta.city, doc.meta.salary].filter(Boolean);
    if (metaBits.length) lines.push("- 岗位信息：" + metaBits.join(" · "));
    lines.push("");
    lines.push("## 要求技能（按权重）");
    doc.hits.forEach(function (h) {
      var mine = state.mine.indexOf(h.id) !== -1;
      lines.push("- " + (mine ? "[x]" : "[ ]") + " " + h.name + "（出现 " + h.count + " 次，权重 " + h.w + "）");
    });
    if (doc.missing.length) {
      lines.push("");
      lines.push("## 待补齐");
      doc.missing.slice(0, 5).forEach(function (m, i) {
        lines.push((i + 1) + ". " + m.name + " —— JD 提到 " + m.count + " 次");
      });
    }
    lines.push("");
    lines.push("> 由 JD Lens 生成（纯本地解析，未上传任何内容）");

    var blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = doc.title.replace(/[\\/:*?"<>|]/g, "_") + "_分析.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast("已导出 Markdown");
  }

  /* ---------------------------------------------------------- 事件 */
  function bind() {
    $("btn-analyze").addEventListener("click", analyzeCurrentText);
    $("btn-sample").addEventListener("click", loadSample);
    $("btn-export").addEventListener("click", exportMarkdown);

    $("jd-text").addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        analyzeCurrentText();
      }
    });

    // 技能标签：点击切换、回车切换、删除自定义
    $("skill-tags").addEventListener("click", function (e) {
      var del = e.target.closest("[data-del]");
      if (del) { removeCustomSkill(del.getAttribute("data-del")); return; }
      var tag = e.target.closest(".tag");
      if (tag) toggleSkill(tag.getAttribute("data-id"));
    });

    $("skill-tags").addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var tag = e.target.closest(".tag");
      if (!tag) return;
      e.preventDefault();
      toggleSkill(tag.getAttribute("data-id"));
    });

    $("new-skill").addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      addCustomSkill(this.value);
      this.value = "";
    });

    // 文档列表
    $("doc-list").addEventListener("click", function (e) {
      var del = e.target.closest("[data-del]");
      if (del) { e.stopPropagation(); deleteDoc(del.getAttribute("data-del")); return; }
      var item = e.target.closest(".doc-item");
      if (item) selectDoc(item.getAttribute("data-id"));
    });

    // 清空
    $("btn-clear").addEventListener("click", function () {
      if (!state.docs.length && !state.custom.length) { toast("没有可清空的数据"); return; }
      if (!window.confirm("清空所有已分析的 JD 和自定义技能？这个操作不能撤销。")) return;
      state.docs = [];
      state.currentId = null;
      state.custom = [];
      save();
      renderAll();
      toast("已清空");
    });

    // 拖拽 .txt
    var drop = $("drop");
    ["dragenter", "dragover"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) {
        e.preventDefault();
        drop.classList.add("over");
      });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) {
        e.preventDefault();
        drop.classList.remove("over");
      });
    });
    drop.addEventListener("drop", function (e) {
      var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!file) return;
      if (!/\.(txt|md)$/i.test(file.name)) { toast("只支持 .txt / .md 文件"); return; }
      var reader = new FileReader();
      reader.onload = function () {
        $("jd-text").value = String(reader.result || "");
        toast("已导入 " + file.name);
      };
      reader.readAsText(file, "utf-8");
    });

    // 窗口尺寸变化时重画一次条形（宽度百分比不受影响，但保持简单一致）
    var t = null;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(renderAll, 160);
    });
  }

  /* ---------------------------------------------------------- 启动 */
  load();
  reanalyzeAll();
  if (!state.currentId && state.docs.length) state.currentId = state.docs[0].id;
  bind();
  renderAll();

  // 演示模式：网址加 ?demo=1，自动分析两份示例 JD，方便直接截图/分享
  if (/[?&]demo(=|&|$)/.test(location.search) && !state.docs.length) {
    DICT.samples.slice(0, 2).forEach(function (s) {
      var d = P.analyze(s.text, state.mine, allSkills());
      if (d) state.docs.unshift(d);
    });
    if (state.docs.length) state.currentId = state.docs[state.docs.length - 1].id;
    renderAll();
  }
})();

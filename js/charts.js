/* ============================================================
   JD Lens · 图形
   ------------------------------------------------------------
   只用 DOM + 一个 SVG 环，不引任何图表库。
   柱状用 CSS 宽度过渡做动画，比 SVG 省一半代码。
   ============================================================ */
(function (global) {
  "use strict";

  var CIRC = 2 * Math.PI * 50; // r = 50

  /** 匹配度环：0~100 */
  function ring(circleEl, pct) {
    var p = Math.max(0, Math.min(100, pct));
    circleEl.style.strokeDasharray = CIRC.toFixed(1);
    circleEl.style.strokeDashoffset = (CIRC * (1 - p / 100)).toFixed(1);
    circleEl.style.stroke = p >= 70 ? "#16A34A" : p >= 40 ? "#1E63D8" : "#E5484D";
  }

  /**
   * 横向条形列表
   * @param {HTMLElement} host
   * @param {Array<{name,value,label,cat,miss}>} items
   */
  function bars(host, items) {
    if (!items.length) {
      host.innerHTML = '<p class="doc-empty">没有可展示的数据</p>';
      return;
    }
    var max = Math.max.apply(null, items.map(function (i) { return i.value; })) || 1;

    host.innerHTML = items
      .map(function (it) {
        var w = Math.max(3, (it.value / max) * 100);
        var nameCls = "bar-name" + (it.miss ? " miss" : "");
        var fillCls = "bar-fill cat-" + (it.cat || "general");
        return (
          '<div class="bar-row" title="' + esc(it.title || it.name) + '">' +
            '<div class="' + nameCls + '">' + esc(it.name) + "</div>" +
            '<div class="bar-track"><div class="' + fillCls + '" data-w="' + w.toFixed(1) + '"></div></div>' +
            '<div class="bar-val">' + esc(it.label) + "</div>" +
          "</div>"
        );
      })
      .join("");

    // 下一帧再赋宽度，触发过渡动画
    requestAnimationFrame(function () {
      Array.prototype.forEach.call(host.querySelectorAll(".bar-fill"), function (el) {
        el.style.width = el.getAttribute("data-w") + "%";
      });
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  global.JD_CHARTS = { ring: ring, bars: bars, esc: esc };
})(window);

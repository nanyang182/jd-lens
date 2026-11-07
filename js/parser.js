/* ============================================================
   JD Lens · 解析器
   ------------------------------------------------------------
   做三件事：抽元信息（岗位/年限/学历/薪资/城市）、
   匹配技能、算匹配度。
   纯规则实现：可解释、可调试，但不是语义理解。
   ============================================================ */
(function (global) {
  "use strict";

  var DICT = global.JD_DICT;

  function normalize(text) {
    return String(text || "")
      .replace(/\r\n?/g, "\n")
      .replace(/[\u3000\u00a0]/g, " ")
      .replace(/[ \t]+/g, " ")
      .trim();
  }

  function lower(text) {
    return text.toLowerCase();
  }

  /** 统计某个技能在文本中的命中次数；重叠区间只算一次 */
  function countSkill(haystackLower, skill) {
    var spans = [];
    skill.aliases.forEach(function (alias) {
      var needle = alias.toLowerCase();
      var from = 0;
      while (needle && from <= haystackLower.length - needle.length) {
        var at = haystackLower.indexOf(needle, from);
        if (at === -1) break;
        spans.push([at, at + needle.length]);
        from = at + needle.length;
      }
    });
    if (!spans.length) return 0;

    spans.sort(function (a, b) { return a[0] - b[0] || b[1] - a[1]; });
    var count = 1;
    var end = spans[0][1];
    for (var i = 1; i < spans.length; i++) {
      if (spans[i][0] >= end) {
        count++;
        end = spans[i][1];
      } else if (spans[i][1] > end) {
        end = spans[i][1];
      }
    }
    return count;
  }

  function pick(list, text) {
    for (var i = 0; i < list.length; i++) {
      if (text.indexOf(list[i]) !== -1) return list[i];
    }
    return "";
  }

  function extractYears(text) {
    var range = text.match(/(\d+)\s*[-~—至到]\s*(\d+)\s*年/);
    if (range) return range[1] + "–" + range[2] + " 年";
    var plus = text.match(/(\d+)\s*年(以上|及以上|\+)/);
    if (plus) return plus[1] + " 年以上";
    var once = text.match(/(\d+)\s*年(?:以上)?(?:工作)?经验/);
    if (once) return once[1] + " 年经验";
    return "";
  }

  function extractDegree(text) {
    var m = text.match(/(博士|硕士|研究生|本科|大专)/);
    if (!m) return "";
    return m[1] === "研究生" ? "硕士" : m[1];
  }

  function extractSalary(text) {
    var day = text.match(/(\d+)\s*[-~—]\s*(\d+)\s*元\s*\/?\s*(天|日|小时)/);
    if (day) return day[1] + "–" + day[2] + " 元/" + day[3];
    var k = text.match(/(\d+)\s*[-~—]\s*(\d+)\s*[kK千]/);
    if (k) return k[1] + "–" + k[2] + "K";
    var one = text.match(/(\d+)\s*[kK](?![a-zA-Z])/);
    if (one) return one[1] + "K";
    var oneDay = text.match(/(\d+)\s*元\s*\/?\s*(天|日)/);
    if (oneDay) return oneDay[1] + " 元/" + oneDay[2];
    return "";
  }

  var HEADER_LINE = /^(岗位职责|工作内容|职位描述|任职要求|岗位要求|职责描述|工作职责|职位要求|工作地点|薪资待遇)[:：]?$/;

  function extractTitle(text) {
    var lines = text.split("\n")
      .map(function (l) { return l.replace(/^#+\s*/, "").trim(); })
      .filter(Boolean);

    // 找一个像"岗位名"的短行：不含冒号、不以数字开头、长度可控
    var candidate = "";
    for (var i = 0; i < Math.min(lines.length, 4); i++) {
      var l = lines[i];
      if (HEADER_LINE.test(l)) continue;
      if (/[:：]/.test(l)) continue;
      if (/^\d/.test(l)) continue;
      if (l.length > 26) continue;
      candidate = l;
      break;
    }

    var role = "";
    for (var j = 0; j < DICT.roles.length; j++) {
      if (text.indexOf(DICT.roles[j]) !== -1) { role = DICT.roles[j]; break; }
    }

    if (candidate) return candidate;
    if (role) return role;
    return (lines[0] || "未命名 JD").slice(0, 26);
  }

  /**
   * @param {string} raw JD 原文
   * @param {string[]} mySkills 我已有的技能 id
   * @param {Array} [skills] 词库，默认用内置词典（可传用户自定义词库合并后的结果）
   */
  function analyze(raw, mySkills, skills) {
    var text = normalize(raw);
    if (!text) return null;

    var lowerText = lower(text);
    var dict = skills && skills.length ? skills : DICT.skills;
    var hits = [];

    dict.forEach(function (skill) {
      var count = countSkill(lowerText, skill);
      if (count > 0) {
        hits.push({
          id: skill.id,
          name: skill.name,
          cat: skill.cat,
          w: skill.w,
          count: count,
          weight: +(skill.w * (1 + Math.log(count))).toFixed(2)
        });
      }
    });

    hits.sort(function (a, b) { return b.weight - a.weight; });

    var mine = mySkills || [];
    var totalWeight = hits.reduce(function (s, h) { return s + h.w; }, 0);
    var gotWeight = hits.reduce(function (s, h) {
      return s + (mine.indexOf(h.id) !== -1 ? h.w : 0);
    }, 0);

    var have = hits.filter(function (h) { return mine.indexOf(h.id) !== -1; });
    var missing = hits.filter(function (h) { return mine.indexOf(h.id) === -1; });

    return {
      id: "jd_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: extractTitle(text),
      text: text,
      meta: {
        role: pick(DICT.roles, text),
        years: extractYears(text),
        degree: extractDegree(text),
        salary: extractSalary(text),
        city: pick(DICT.cities, text)
      },
      hits: hits,
      have: have,
      missing: missing,
      score: totalWeight ? Math.round((gotWeight / totalWeight) * 100) : 0
    };
  }

  /** 多份 JD 的技能出现次数汇总 */
  function aggregate(docs) {
    var map = {};
    docs.forEach(function (doc) {
      doc.hits.forEach(function (h) {
        if (!map[h.id]) {
          map[h.id] = { id: h.id, name: h.name, cat: h.cat, docs: 0, count: 0 };
        }
        map[h.id].docs += 1;
        map[h.id].count += h.count;
      });
    });
    return Object.keys(map)
      .map(function (k) { return map[k]; })
      .sort(function (a, b) { return b.docs - a.docs || b.count - a.count; });
  }

  global.JD_PARSER = { analyze: analyze, aggregate: aggregate };
})(window);

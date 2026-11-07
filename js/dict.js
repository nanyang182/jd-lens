/* ============================================================
   JD Lens · 技能词典与示例数据
   ------------------------------------------------------------
   词典是这套工具唯一的"知识"：靠中文同义词匹配，不是语义模型。
   所以它准确率高、可解释，但覆盖有限——换行业需要改这里。
   ============================================================ */
(function (global) {
  "use strict";

  // cat: product / data / general    w: 权重（1.5 = 核心要求）
  var SKILLS = [
    // ---------------- 产品
    { id: "req", name: "需求分析", cat: "product", w: 1.5,
      aliases: ["需求分析", "需求调研", "需求梳理", "需求拆解", "需求评审"] },
    { id: "research", name: "用户研究", cat: "product", w: 1.2,
      aliases: ["用户研究", "用户访谈", "用户调研", "可用性测试", "用户洞察"] },
    { id: "competitor", name: "竞品分析", cat: "product", w: 1.0,
      aliases: ["竞品分析", "竞品调研", "市场分析"] },
    { id: "prd", name: "PRD", cat: "product", w: 1.2,
      aliases: ["prd", "产品需求文档", "需求文档"] },
    { id: "prototype", name: "原型设计", cat: "product", w: 1.2,
      aliases: ["原型设计", "原型图", "原型", "线框图", "高保真"] },
    { id: "axure", name: "Axure", cat: "product", w: 0.8,
      aliases: ["axure"] },
    { id: "figma", name: "Figma / 墨刀", cat: "product", w: 0.8,
      aliases: ["figma", "墨刀", "sketch", "mastergo", "即时设计"] },
    { id: "metrics", name: "指标体系", cat: "product", w: 1.2,
      aliases: ["指标体系", "北极星指标", "核心指标", "指标定义"] },
    { id: "abtest", name: "A/B 测试", cat: "product", w: 1.0,
      aliases: ["a/b测试", "ab测试", "a/b test", "ab test", "灰度发布", "灰度"] },
    { id: "tracking", name: "埋点", cat: "product", w: 0.8,
      aliases: ["埋点", "数据埋点", "事件上报"] },
    { id: "growth", name: "用户增长", cat: "product", w: 1.0,
      aliases: ["用户增长", "增长黑客", "拉新", "促活", "留存提升"] },
    { id: "pm", name: "项目管理", cat: "product", w: 1.0,
      aliases: ["项目管理", "项目推进", "项目落地", "排期"] },
    { id: "cross", name: "跨部门协作", cat: "product", w: 0.9,
      aliases: ["跨部门", "跨团队", "协同推进", "推动落地"] },
    { id: "agile", name: "敏捷开发", cat: "product", w: 0.7,
      aliases: ["敏捷", "scrum", "迭代开发"] },
    { id: "monetize", name: "商业化", cat: "product", w: 0.8,
      aliases: ["商业化", "变现", "营收增长"] },
    { id: "tob", name: "B 端产品", cat: "product", w: 0.8,
      aliases: ["b端", "tob", "企业服务", "saas"] },
    { id: "toc", name: "C 端产品", cat: "product", w: 0.8,
      aliases: ["c端", "toc", "用户产品"] },
    { id: "ecommerce", name: "电商 / 交易", cat: "product", w: 0.6,
      aliases: ["电商", "交易链路", "履约"] },
    { id: "backend", name: "后台 / 中台", cat: "product", w: 0.6,
      aliases: ["后台系统", "中台", "管理系统"] },

    // ---------------- 数据
    { id: "data_analysis", name: "数据分析", cat: "data", w: 1.5,
      aliases: ["数据分析", "数据驱动", "数据洞察", "数据敏感"] },
    { id: "sql", name: "SQL", cat: "data", w: 1.3,
      aliases: ["sql", "mysql", "数据库查询", "hive"] },
    { id: "python", name: "Python", cat: "data", w: 1.0,
      aliases: ["python", "pandas"] },
    { id: "excel", name: "Excel", cat: "data", w: 1.0,
      aliases: ["excel", "透视表", "vlookup"] },
    { id: "bi", name: "BI 工具", cat: "data", w: 0.7,
      aliases: ["tableau", "power bi", "powerbi", "finebi", "帆软", "quickbi"] },
    { id: "dataviz", name: "数据可视化", cat: "data", w: 0.9,
      aliases: ["可视化", "看板", "dashboard", "报表"] },
    { id: "persona", name: "用户画像", cat: "data", w: 0.8,
      aliases: ["用户画像", "标签体系"] },
    { id: "funnel", name: "漏斗 / 转化", cat: "data", w: 0.8,
      aliases: ["漏斗", "转化率", "转化分析"] },
    { id: "stats", name: "统计学", cat: "data", w: 0.6,
      aliases: ["统计学", "假设检验", "回归分析", "统计建模"] },
    { id: "governance", name: "数据治理", cat: "data", w: 0.5,
      aliases: ["数据治理", "数据质量", "数据口径"] },

    // ---------------- 通用
    { id: "logic", name: "逻辑思维", cat: "general", w: 0.7,
      aliases: ["逻辑", "结构化思维", "分析能力"] },
    { id: "communication", name: "沟通表达", cat: "general", w: 0.8,
      aliases: ["沟通能力", "沟通表达", "表达能力", "汇报能力"] },
    { id: "english", name: "英语", cat: "general", w: 0.6,
      aliases: ["英语", "cet-6", "六级", "雅思", "托福"] },
    { id: "learning", name: "学习能力", cat: "general", w: 0.6,
      aliases: ["学习能力", "自学能力", "快速学习"] },
    { id: "teamwork", name: "团队协作", cat: "general", w: 0.6,
      aliases: ["团队协作", "团队合作", "协作能力"] },
    { id: "pressure", name: "抗压", cat: "general", w: 0.5,
      aliases: ["抗压", "高强度", "快节奏"] },
    { id: "ownership", name: "责任心", cat: "general", w: 0.4,
      aliases: ["责任心", "owner意识", "owner 意识", "主动性强"] },
    { id: "writing", name: "文档能力", cat: "general", w: 0.5,
      aliases: ["文档能力", "文档撰写", "写作能力"] }
  ];

  var CITIES = ["北京", "上海", "广州", "深圳", "杭州", "成都", "南京", "武汉",
                "西安", "苏州", "合肥", "长沙", "天津", "重庆", "厦门", "青岛", "郑州"];

  var ROLES = ["产品经理", "产品实习生", "产品助理", "数据分析师", "数据分析实习生",
               "用户研究员", "产品运营", "策略产品", "增长产品"];

  // 默认"我已有的技能"——应届产品方向常见底子，可自行增减
  var DEFAULT_MINE = ["req", "research", "competitor", "prd", "prototype",
                      "excel", "data_analysis", "communication", "teamwork", "learning"];

  // 示例 JD（自己写的，结构参照真实招聘启事，不指向具体公司）
  var SAMPLES = [
    {
      title: "产品经理实习生（电商方向）",
      text: [
        "产品经理实习生（电商方向）",
        "岗位职责：",
        "1. 参与电商交易链路的需求分析与方案设计，独立输出 PRD 与原型图；",
        "2. 配合数据分析同学搭建核心指标体系，基于转化漏斗定位问题；",
        "3. 跟进项目排期与跨部门协作，推动版本按时上线；",
        "4. 参与 A/B 测试方案设计与结果复盘。",
        "任职要求：",
        "1. 本科及以上学历，每周可实习 4 天，实习 3 个月以上；",
        "2. 逻辑清晰、沟通能力强，有较强的责任心；",
        "3. 熟练使用 Axure 或 Figma 输出原型；",
        "4. 会 SQL 取数、了解数据埋点者优先。",
        "薪资：150-200 元/天　地点：上海"
      ].join("\n")
    },
    {
      title: "数据分析实习生",
      text: [
        "数据分析实习生",
        "工作内容：",
        "1. 使用 SQL 完成日常取数与数据核对，维护数据口径；",
        "2. 搭建业务看板，输出用户画像与留存分析；",
        "3. 参与专题分析，形成结论并推动落地。",
        "岗位要求：",
        "1. 本科及以上，统计、数学、计算机相关专业优先；",
        "2. 熟练使用 SQL 与 Excel，会 Python 加分；",
        "3. 有 Tableau 或 Power BI 使用经验者优先；",
        "4. 逻辑思维强，学习能力强，能承受一定强度的工作节奏。",
        "薪资：200-250 元/天　地点：杭州"
      ].join("\n")
    },
    {
      title: "产品经理（B 端 SaaS）",
      text: [
        "产品经理实习生（电商方向）",
        "岗位职责：",
        "1. 负责企业服务产品的需求调研与产品规划，输出 PRD；",
        "2. 与研发、设计、销售跨团队协同，推动项目落地；",
        "3. 搭建产品指标体系，通过数据分析驱动迭代；",
        "4. 参与商业化方案设计，跟进营收目标。",
        "任职要求：",
        "1. 本科及以上学历，3 年以上 B 端产品经验；",
        "2. 熟悉 Scrum 敏捷开发流程，有较强的项目管理能力；",
        "3. 具备数据分析能力，能用数据验证方案效果；",
        "4. 英语可作为工作语言，沟通表达清晰。",
        "薪资：25-35K　地点：深圳"
      ].join("\n")
    }
  ];

  global.JD_DICT = {
    skills: SKILLS,
    cities: CITIES,
    roles: ROLES,
    defaultMine: DEFAULT_MINE,
    samples: SAMPLES
  };
})(window);


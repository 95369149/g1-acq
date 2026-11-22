/**
 * g1-acq-v2.js — Google One 订阅页商品 ID 映射 v2.1
 * 基于 crhywun/g1-acq v6，改动：
 * 1. 优惠档真正进目录才映射（v6 的 README 声称如此，但代码没做）；
 * 2. 优惠档不在目录时，降级到土区打法（yanglei 实测）：Ultra 月付 → 同档基础月付
 *    30tb.ai.pro.m → 30tb.m，20tb.m.v2 → 20tb.m，目标是目录里本来就有的常规商品；
 * 3. 日志写清源商品有没有出现：源商品不在响应里，说明账号没 Ultra 资格或地区不对，改脚本没用。
 *
 * v2.1 修复（2026-11-22）：去掉基础档“必须在响应里出现才映射”的检查。
 * 该检查用子串匹配，20TB 源商品 g1.ios.20tb.m.v2 本身就包含 g1.ios.20tb.m，
 * 检查恒通过；30TB 源商品 g1.ios.30tb.ai.pro.m 不包含 g1.ios.30tb.m，
 * 检查恒失败，导致 30TB 档被跳过、弹窗仍是原价。土区打法照 yanglei 的做法
 * 直接替换，收银台会自己校验商品是否存在，映射错了也只是拉不起、不扣费。
 *
 * 版本：v2.1
 */
"use strict";

console.log("[g1-acq] v2.1 loaded");

/* 原始 iOS 内购 ID → 优惠档（90p 主档） */
var SKU_MAP = {
  "g1.ios.20tb.m.v2":     "g1.20tb.3months_ip_90p.acq",
  "g1.ios.30tb.ai.pro.m": "g1.ai.ultra.3months_ip_90p.acq"
};

/* 主档不在目录时的备用优惠档 */
var FALLBACK = {
  "g1.20tb.3months_ip_90p.acq":     "g1.20tb.3months_ip_75p.acq",
  "g1.ai.ultra.3months_ip_90p.acq": "g1.ai.ultra.3months_ip_75p.acq"
};

/* 优惠档都不在目录时的土区打法：Ultra 月付 → 基础月付（yanglei 实测） */
var BASE_MAP = {
  "g1.ios.20tb.m.v2":     "g1.ios.20tb.m",
  "g1.ios.30tb.ai.pro.m": "g1.ios.30tb.m"
};

function occurrences(s, needle) {
  return needle ? s.split(needle).length - 1 : 0;
}

function run() {
  var body = $response && $response.body;
  if (typeof body !== "string" || body === "") {
    $done({});
    return;
  }

  var raw = body.match(/g1\.[a-z0-9._]{2,60}acq/g) || [];
  var seen = {};
  var catalog = [];
  for (var r = 0; r < raw.length; r++) {
    if (!seen[raw[r]]) { seen[raw[r]] = 1; catalog.push(raw[r]); }
  }
  console.log("[g1-acq] 目录优惠档: " + (catalog.join(", ") || "无"));

  var out = body, total = 0;
  var froms = Object.keys(SKU_MAP);
  for (var k = 0; k < froms.length; k++) {
    var from = froms[k];
    var n = occurrences(out, from);
    if (n === 0) {
      console.log("[g1-acq] 源商品不在响应里: " + from + "（账号可能没 Ultra 资格或地区不对）");
      continue;
    }

    var to = SKU_MAP[from];
    var mode = "优惠档";
    if (catalog.indexOf(to) === -1) {
      if (FALLBACK[to] && catalog.indexOf(FALLBACK[to]) !== -1) {
        console.log("[g1-acq] 主档不在目录，降级 " + to + " -> " + FALLBACK[to]);
        to = FALLBACK[to];
      } else {
        to = BASE_MAP[from];
        mode = "土区打法";
        console.log("[g1-acq] 优惠档不在目录，降级土区打法 " + from + " -> " + to);
      }
    }

    out = out.split(from).join(to);
    total += n;
    console.log("[g1-acq] [" + mode + "] " + from + " -> " + to + " x" + n);
  }

  console.log(total ? "[g1-acq] 共改写 " + total + " 处" : "[g1-acq] 未命中");
  $done(total ? { body: out } : {});
}

run();

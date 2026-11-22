# g1-acq · Google One Ultra 土区打法 v2.1

在 `one.google.com/ai` 订阅页的响应里，把 20TB / 30TB 两个 Ultra 月付档的原始 iOS 内购 ID 替换为实际存在的商品 ID，让 App Store 收银台以更低的价格拉起。Surge / Loon 实测。

> 只改写响应文本中的商品 ID 字符串。改写后实际能否下单、价格与权益，以 App Store 收银台面板和 Google One 账户的实际状态为准。

## 实测结果（2026-11-22，Surge / Loon）

| 档位 | 面板价（Google 侧） | Apple 付款弹窗价 | 状态 |
|---|---|---|---|
| 20TB Ultra（Gemini 5 倍用量） | TRY 4,749.99/月 | **TRY 1,989.99/月** | ✅ 实测到弹窗价 |
| 30TB Ultra（Gemini 20 倍用量） | TRY 8,999.99/月 | TRY 2,949.99/月 | v2 在 30TB 档被脚本检查误跳过（见下方 v2.1 修复）；v2.1 复测中，yanglei 文章同价 |

说明：面板上显示的价格不会变，改写改的是收银台要收的钱。点「订阅此方案」后看 Apple 付款弹窗的价，那个才是准的。

## 前置条件（缺一个都跑不通）

1. **土耳其区 Apple ID**（付款走这个号的 App Store 内购）。
2. **一个从未订阅过 Google One 的 Gmail**（开过试用也不行，目录里会没有 Ultra 优惠档）。

## 一键安装

| 工具 | 一键安装 |
|---|---|
| Loon | [点我安装插件](loon://import?plugin=https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2F95369149%2Fg1-acq%40main%2Fg1-acq-v2.plugin) |
| Surge | [点我安装模块](surge:///install-module?url=https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2F95369149%2Fg1-acq%40main%2Fg1-acq-v2.sgmodule) |

> 聊天里点链接没反应是正常的（App 不跳转 scheme 链接）。没反应时用下面的手动安装。

## 手动安装

**Loon**

1. 复制插件地址：`https://cdn.jsdelivr.net/gh/95369149/g1-acq@main/g1-acq-v2.plugin`
2. Loon → 配置 → 插件 → 右上角 `+` → 从 URL 导入，粘贴安装
3. 打开插件开关

**Surge**

1. 复制模块地址：`https://cdn.jsdelivr.net/gh/95369149/g1-acq@main/g1-acq-v2.sgmodule`
2. Surge → 模块 → 右上角 `+` → 粘贴安装
3. 打开模块开关，重连一次

**证书（两步缺一不可，装完必须开信任开关，否则解密无效）**

1. 在工具里生成并安装 CA 描述文件（设置 → 通用 → VPN 与设备管理 → 安装）
2. 设置 → 通用 → 关于本机 → 证书信任设置 → 打开对应根证书的信任开关

## 使用流程

1. 打开 **Google App**（彩色 G 图标那个）→ 头像 → **Google One 管理**，进入订阅管理页（模块改写的就是这个页面发出的 `/ai` 响应；从 Google One 独立 App 进入走原生接口，不在改写范围）
2. 点进 Ultra 方案，「订阅此方案」
3. **看 Apple 付款弹窗的价**：20TB 档是 TRY 1,989.99/月就对了；30TB 档是 TRY 2,949.99/月。价不对就取消，别按
4. 付款前盯一眼弹窗金额；用完把代理 / MITM 关掉（否则工具一退手机直接断网）

## 原理

v2.1 在 v2 的基础上修了一处：去掉基础档「必须在响应里出现才映射」的检查。该检查用子串匹配，20TB 源商品 `g1.ios.20tb.m.v2` 本身就包含 `g1.ios.20tb.m`，检查恒通过；30TB 源商品 `g1.ios.30tb.ai.pro.m` 不包含 `g1.ios.30tb.m`，检查恒失败，导致 30TB 档被跳过、弹窗仍是原价。土区打法照 yanglei 的做法直接替换，收银台会自己校验商品是否存在。

v2 在原作者 v6 的基础上改了三处：

1. **优惠档真正进目录才映射**：v6 的 README 声称如此，但代码没做——主档 / 备用档都不在目录时仍会替换成不存在的优惠档，收银台拉不起。v2 先查目录，优惠档不在才往下走。
2. **降级土区打法**（yanglei 实测）：优惠档都不在目录时，把 Ultra 月付换成同档基础月付——`30tb.ai.pro.m → 30tb.m`，`20tb.m.v2 → 20tb.m`。基础月付是目录里本来就有的常规商品，不依赖促销档存在。
3. **日志写清源商品是否出现**：源商品不在响应里，说明账号没 Ultra 资格或地区不对，改脚本没用。

映射表：

| 原始 iOS 内购 ID | 优先替换为 | 降级替换为 |
|---|---|---|
| `g1.ios.20tb.m.v2` | `g1.20tb.3months_ip_90p.acq`（不在目录则 `g1.20tb.3months_ip_75p.acq`） | `g1.ios.20tb.m` |
| `g1.ios.30tb.ai.pro.m` | `g1.ai.ultra.3months_ip_90p.acq`（不在目录则 `g1.ai.ultra.3months_ip_75p.acq`） | `g1.ios.30tb.m` |

## 验证与排错

进工具的日志，搜 `g1-acq`：

| 日志 | 含义 |
|---|---|
| `[g1-acq] v2 loaded` | 脚本已加载，版本正确 |
| `目录优惠档: ...` | 响应里真实存在的全部优惠档 |
| `[优惠档] ... -> ...` | 已按优惠档改写 |
| `[土区打法] ... -> ...` | 已按基础月付改写 |
| `源商品不在响应里: ...` | 账号没 Ultra 资格或地区不对，换号 |
| `共改写 N 处` | 替换已执行 |
| 完全没有 `g1-acq` | 脚本未触发，检查 VPN / HTTPS 解密（证书安装 + 信任开关）/ 模块开关 |

## 风险与提醒

- 非官方玩法。改客户端响应不等于服务器认可，可能结算失败或账号权益异常；付完请在 Google One 里确认显示 Ultra、Gemini 里确认用量倍数。
- 优惠档与价格随 Google 活动变化，目录探测日志为准。
- 价格随时会变，付钱前盯一眼自己弹窗里的金额，别闭着眼按。
- 随时可在 iPhone 设置 → Apple 账户里取消订阅。

## 来源

- 原作者仓库：[crhywun/g1-acq](https://github.com/crhywun/g1-acq)（v6 脚本与模块）
- 帖子：[@muihbb](https://x.com/muihbb/status/2124461332439408931)、[@taiyanghere](https://x.com/taiyanghere/status/2124370746105561295)
- 土区打法：[@yangleiocx3](https://x.com/yangleiocx3/status/2124350908263723508)（Reqable 重写规则与实测价）

## 文件

| 文件 | 用途 |
|---|---|
| `g1-acq-v2.js` | 响应改写脚本（v2） |
| `g1-acq-v2.plugin` | Loon 插件（规则 + 脚本引用 + MITM） |
| `g1-acq-v2.sgmodule` | Surge 模块（规则 + 脚本引用 + MITM） |

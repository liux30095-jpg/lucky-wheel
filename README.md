# 🍧 幸运大转盘（带后端）

水果捞门店扫码抽奖 H5。前端转盘 + Cloudflare Pages Functions 后端 + D1 数据库，**免费额度即可承载几百~几千人**。

## 功能
- 扫码进入，**手机号防重复**（一个号只抽一次，服务器判定）
- 中奖概率/库存**全在服务器**算，前端改不了
- 中奖发**核销码**（无有效期），到店出示，店员后台核销，一券一次
- `admin.html`：前台**核销** + **看板**（参与数 / 各奖发放 / 中奖名单 / 导出 CSV）

## 奖品与概率（改 `schema.sql`）
| 奖项 | 概率 | 库存 |
|---|---|---|
| 一等奖·免费水果捞 | 2%（50人中1） | 不限（可改成限量） |
| 二等奖·单份5折 | 9% | 不限 |
| 三等奖·第二份半价 | 30% | 不限 |
| 1元代金券 | 20% | 不限 |
| 谢谢参与 | 39% | — |

## 部署步骤（Cloudflare，免费）
```bash
cd lucky-wheel

# 1. 登录 Cloudflare（浏览器授权一次）
npx wrangler login

# 2. 创建 D1 数据库，把输出的 database_id 填进 wrangler.toml
npx wrangler d1 create lucky-wheel-db

# 3. 建表 + 初始化奖品
npx wrangler d1 execute lucky-wheel-db --remote --file=./schema.sql

# 4. 创建 Pages 项目
npx wrangler pages project create lucky-wheel --production-branch main

# 5. 设置后台密码（不要写进代码，本仓库是公开的）
npx wrangler pages secret put ADMIN_TOKEN --project-name lucky-wheel

# 6. 部署
npx wrangler pages deploy . --project-name lucky-wheel
```
部署完成会得到 `https://lucky-wheel.pages.dev`：
- 抽奖页：`/`
- 核销后台：`/admin.html`

> 若 `wrangler.toml` 的 D1 绑定未生效，可到 Cloudflare 控制台 → Pages → 项目 → Settings → Functions → D1 bindings，手动把变量名 `DB` 绑到 `lucky-wheel-db`，再重新部署。

## 微信里访问不稳？
`pages.dev` 在国内微信内偶发慢/被拦。要稳定秒开，把它绑到一个**已备案的域名**（域名约 ¥50/年）即可，代码无需改动。

## 改奖品/概率后重新生效
改 `schema.sql` 再执行第 3 步（会重置奖品表），或直接用 `wrangler d1 execute` 跑 UPDATE 语句。

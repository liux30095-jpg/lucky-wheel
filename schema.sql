-- ========= 幸运大转盘 数据库结构 + 初始奖品 =========
-- 用法：npx wrangler d1 execute lucky-wheel-db --remote --file=./schema.sql

-- 奖品表
CREATE TABLE IF NOT EXISTS prizes (
  id      INTEGER PRIMARY KEY,
  name    TEXT    NOT NULL,
  weight  INTEGER NOT NULL,                  -- 中奖权重（概率 = 权重 / 总权重）
  stock   INTEGER,                           -- 剩余库存；NULL = 不限量
  color   TEXT    NOT NULL DEFAULT '#cccccc',-- 转盘扇区颜色
  is_lose INTEGER NOT NULL DEFAULT 0         -- 1 = 谢谢参与
);

-- 抽奖 / 中奖记录
CREATE TABLE IF NOT EXISTS draws (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  phone      TEXT    NOT NULL,
  name       TEXT,
  prize_id   INTEGER,
  prize_name TEXT,
  code       TEXT,                                   -- 核销码；谢谢参与为 NULL
  status     TEXT    NOT NULL DEFAULT 'unused',      -- unused | used
  created_at TEXT    NOT NULL,
  used_at    TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_draws_phone ON draws(phone);  -- 一个手机号只能抽一次
CREATE INDEX        IF NOT EXISTS idx_draws_code  ON draws(code);

-- 初始奖品（概率：一等奖 2%，二等奖5折 30%，三等奖半价 35%，5元代金券 32%，谢谢参与 1%）
-- 想限量「免费水果捞」：把第 1 行的 NULL 改成数字（如 30），送完自动转谢谢参与
DELETE FROM prizes;
INSERT INTO prizes (id, name, weight, stock, color, is_lose) VALUES
  (1, '一等奖·免费水果捞', 2,  NULL, '#ff6b6b', 0),
  (2, '二等奖·单份5折',    30, NULL, '#b794f6', 0),
  (3, '三等奖·第二份半价', 35, NULL, '#6ec1ff', 0),
  (4, '5元代金券',         32, NULL, '#ffe66d', 0),
  (5, '谢谢参与',          1,  NULL, '#dfe6e9', 1);

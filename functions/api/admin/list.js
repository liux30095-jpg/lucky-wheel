import { json, checkAuth } from '../_lib.js';

// GET /api/admin/list?key=管理员密码 —— 统计 + 中奖名单
export async function onRequestGet({ request, env }) {
  if (!checkAuth(request, env)) return json({ ok: false, error: '未授权' }, 401);

  const total = await env.DB.prepare('SELECT COUNT(*) AS n FROM draws').first();
  const byPrize = await env.DB.prepare(
    "SELECT prize_name, COUNT(*) AS cnt, SUM(CASE WHEN status='used' THEN 1 ELSE 0 END) AS used FROM draws GROUP BY prize_name"
  ).all();
  const stock = await env.DB.prepare('SELECT name, stock FROM prizes ORDER BY id').all();
  const winners = await env.DB.prepare(
    'SELECT phone, name, prize_name, code, status, created_at, used_at FROM draws WHERE code IS NOT NULL ORDER BY id DESC LIMIT 5000'
  ).all();

  return json({
    ok: true,
    total: total.n,
    byPrize: byPrize.results,
    stock: stock.results,
    winners: winners.results,
  });
}

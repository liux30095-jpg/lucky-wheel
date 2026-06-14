import { json, checkAuth } from '../_lib.js';

// POST /api/admin/redeem  body: { code? , phone? }  (header x-admin-token)
// 按核销码或手机号查到中奖记录 → 标记已领取（防重复领）
export async function onRequestPost({ request, env }) {
  if (!checkAuth(request, env)) return json({ ok: false, error: '未授权' }, 401);

  const body = await request.json().catch(() => ({}));
  const code = String(body.code || '').trim();
  const phone = String(body.phone || '').trim();

  let row;
  if (code)       row = await env.DB.prepare('SELECT * FROM draws WHERE code = ?').bind(code).first();
  else if (phone) row = await env.DB.prepare('SELECT * FROM draws WHERE phone = ?').bind(phone).first();
  else return json({ ok: false, error: '请输入核销码或手机号' }, 400);

  if (!row)        return json({ ok: true, found: false });
  if (!row.code)   return json({ ok: true, found: true, isLose: true, prizeName: row.prize_name, phone: row.phone });
  if (row.status === 'used') {
    return json({ ok: true, found: true, alreadyUsed: true, prizeName: row.prize_name, phone: row.phone, usedAt: row.used_at });
  }

  const now = new Date().toISOString();
  const upd = await env.DB
    .prepare("UPDATE draws SET status='used', used_at=? WHERE code=? AND status='unused'")
    .bind(now, row.code).run();
  if (!upd.meta || upd.meta.changes === 0) {
    return json({ ok: true, found: true, alreadyUsed: true, prizeName: row.prize_name, phone: row.phone });
  }

  return json({ ok: true, found: true, redeemed: true, prizeName: row.prize_name, code: row.code, phone: row.phone, usedAt: now });
}

import { json } from './_lib.js';

// 6 位核销码
function genCode() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return String(100000 + (a[0] % 900000));
}

// 按权重抽奖（只在 不限量 / 还有库存 / 谢谢参与 的奖品里抽）
function weightedPick(prizes) {
  const pool = prizes.filter(p => p.is_lose === 1 || p.stock == null || p.stock > 0);
  const total = pool.reduce((s, p) => s + p.weight, 0);
  if (total <= 0) return prizes.find(p => p.is_lose === 1) || null;
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  let r = (a[0] / 0xFFFFFFFF) * total;
  for (const p of pool) { r -= p.weight; if (r < 0) return p; }
  return pool[pool.length - 1];
}

// POST /api/draw  body: { phone, name? }
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: '参数错误' }, 400); }

  const phone = String(body.phone || '').trim();
  const name  = String(body.name || '').trim().slice(0, 20);
  if (!/^1\d{10}$/.test(phone)) return json({ ok: false, error: '请输入正确的手机号' }, 400);

  // 已抽过 → 原样返回上次结果（不再抽）
  const existed = await env.DB
    .prepare('SELECT prize_id, prize_name, code FROM draws WHERE phone = ?')
    .bind(phone).first();
  if (existed) {
    return json({ ok: true, repeated: true, prizeId: existed.prize_id, prizeName: existed.prize_name, code: existed.code, isLose: !existed.code });
  }

  // 抽奖
  const { results: prizes } = await env.DB.prepare('SELECT * FROM prizes ORDER BY id').all();
  let chosen = weightedPick(prizes);

  // 有限库存：原子扣减；扣不动(售罄)则回退谢谢参与
  if (chosen && chosen.stock != null && chosen.is_lose === 0) {
    const upd = await env.DB
      .prepare('UPDATE prizes SET stock = stock - 1 WHERE id = ? AND stock > 0')
      .bind(chosen.id).run();
    if (!upd.meta || upd.meta.changes === 0) {
      chosen = prizes.find(p => p.is_lose === 1) || chosen;
    }
  }

  const isLose = !chosen || chosen.is_lose === 1;
  let code = null;
  if (!isLose) {
    for (let i = 0; i < 6; i++) {
      const c = genCode();
      const dup = await env.DB.prepare('SELECT 1 FROM draws WHERE code = ?').bind(c).first();
      if (!dup) { code = c; break; }
    }
    if (!code) code = genCode();
  }

  const now = new Date().toISOString();
  try {
    await env.DB.prepare(
      'INSERT INTO draws (phone, name, prize_id, prize_name, code, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(phone, name || null, chosen ? chosen.id : null, chosen ? chosen.name : '谢谢参与', code, 'unused', now).run();
  } catch (e) {
    // 并发下手机号唯一冲突 → 返回已存在结果
    const again = await env.DB
      .prepare('SELECT prize_id, prize_name, code FROM draws WHERE phone = ?')
      .bind(phone).first();
    if (again) return json({ ok: true, repeated: true, prizeId: again.prize_id, prizeName: again.prize_name, code: again.code, isLose: !again.code });
    return json({ ok: false, error: '系统繁忙，请重试' }, 500);
  }

  return json({ ok: true, prizeId: chosen ? chosen.id : null, prizeName: chosen ? chosen.name : '谢谢参与', code, isLose });
}

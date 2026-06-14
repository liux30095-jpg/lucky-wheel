import { json } from './_lib.js';

// GET /api/prizes —— 给转盘渲染用，只暴露 名称/颜色/顺序，不泄露权重与库存
export async function onRequestGet({ env }) {
  const { results } = await env.DB
    .prepare('SELECT id, name, color FROM prizes ORDER BY id')
    .all();
  return json({ ok: true, prizes: results });
}

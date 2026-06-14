// 公共工具：JSON 响应 + 管理员鉴权
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json;charset=utf-8' },
  });
}

// 管理员鉴权：请求头 x-admin-token 或 ?key= 必须等于 env.ADMIN_TOKEN
export function checkAuth(request, env) {
  const url = new URL(request.url);
  const key = request.headers.get('x-admin-token') || url.searchParams.get('key') || '';
  return Boolean(env.ADMIN_TOKEN) && key === env.ADMIN_TOKEN;
}

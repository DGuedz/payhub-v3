export async function callApi(path: string, method = 'GET', body?: any, token?: string): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const url = `/api${path.startsWith('/') ? path : `/${path}`}`
  async function once(): Promise<{ res: Response; json: any }> {
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined })
    const json = await res.json().catch(() => null)
    return { res, json }
  }
  let { res, json } = await once()
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 500))
    const r2 = await once()
    res = r2.res
    json = r2.json
  }
  if (!res.ok) throw new Error((json && (json.error || json.message)) || 'API error')
  return json
}

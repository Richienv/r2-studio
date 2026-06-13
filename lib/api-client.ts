// Browser-side helpers for hitting our own API. Same-origin = no API key.

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      msg = body?.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => fetch(path, { cache: "no-store" }).then(json<T>),
  post: <T>(path: string, body: unknown) =>
    fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(json<T>),
  patch: <T>(path: string, body: unknown) =>
    fetch(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(json<T>),
  del: <T>(path: string) =>
    fetch(path, { method: "DELETE" }).then(json<T>),
};

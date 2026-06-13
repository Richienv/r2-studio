# R2·STUDIO Hermes MCP Config

Paste-ready config snippets for connecting Hermes (Mac Mini) to R2·STUDIO.

## Local dev (Mac Mini → local r2-studio dev server)

If Hermes runs on the same Mac as `npm run dev`:

```json
{
  "mcpServers": {
    "r2-studio": {
      "type": "http",
      "url": "http://localhost:3000/api/mcp",
      "headers": {
        "x-api-key": "dev-key-replace-me-32chars-abcdef",
        "x-actor": "hermes-ren"
      }
    }
  }
}
```

If Hermes runs on Mac Mini and dev server is on your laptop, replace `localhost` with the laptop's LAN IP and make sure port 3000 is reachable (`next dev -H 0.0.0.0`).

## Production (Hermes → Vercel)

After deploy:

```json
{
  "mcpServers": {
    "r2-studio": {
      "type": "http",
      "url": "https://r2-studio.vercel.app/api/mcp",
      "headers": {
        "x-api-key": "<R2_STUDIO_API_KEY-from-vercel-env>",
        "x-actor": "hermes-ren"
      }
    }
  }
}
```

## Tools exposed

| Tool | When Hermes calls it |
|---|---|
| `studio_today_brief` | Morning brief, "what's on today" |
| `studio_week_view` | Sunday batch planning, "show me the week" |
| `studio_capture_idea` | Ren says "capture idea: ..." or any content angle worth logging |
| `studio_capture_opinion` | Strong contrarian take, manifesto material |
| `studio_create_reel` | "Schedule a BUILD reel for Friday" |
| `studio_update_reel_status` | "Mark day 5 as filmed" |
| `studio_get_ideas` | "What ideas do I have for MINDSET?" |
| `studio_get_opinions` | "Show me fresh opinions" |
| `studio_streak` | "What's my streak?" |

## Sanity check from terminal

```bash
# Should return server info + tool list
curl http://localhost:3000/api/mcp

# Should return JSON-RPC list of tools
curl -X POST http://localhost:3000/api/mcp \
  -H "x-api-key: dev-key-replace-me-32chars-abcdef" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Notes

- Transport: Streamable HTTP (MCP spec 2024-11-05). Single POST endpoint, JSON-RPC 2.0 over HTTP.
- No SSE / server-initiated messages in V1 — sufficient for tool-call workflow.
- Auth via `x-api-key` header. Middleware allows same-origin browser requests through without the key (so the web UI works); external clients must send it.
- The `x-actor` header is logged into `ActivityLog.actor` so you can grep who-did-what across actors (`hermes-ren`, `richie-web`, etc).

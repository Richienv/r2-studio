// MCP Streamable HTTP transport endpoint.
// Implements JSON-RPC 2.0 over POST. Subset of the MCP spec sufficient for
// Claude Desktop / Hermes-style clients: initialize, tools/list, tools/call.
// Auth: middleware enforces x-api-key on all POST /api/* requests except
// same-origin browser fetches.

import { NextRequest, NextResponse } from "next/server";
import { TOOLS, findTool } from "@/lib/mcp-tools";

export const dynamic = "force-dynamic";

const PROTOCOL_VERSION = "2024-11-05";
const SERVER_NAME = "r2-studio";
const SERVER_VERSION = "1.0.0";

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

function rpcError(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown
): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message, data } };
}

function rpcResult(
  id: string | number | null,
  result: unknown
): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

async function dispatch(
  req: JsonRpcRequest,
  actor: string
): Promise<JsonRpcResponse | null> {
  const id = req.id ?? null;

  // Notifications have no id and expect no response.
  const isNotification = req.id === undefined;

  switch (req.method) {
    case "initialize": {
      return rpcResult(id, {
        protocolVersion: PROTOCOL_VERSION,
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        capabilities: {
          tools: { listChanged: false },
        },
      });
    }

    case "notifications/initialized":
    case "initialized": {
      return isNotification ? null : rpcResult(id, {});
    }

    case "ping": {
      return rpcResult(id, {});
    }

    case "tools/list": {
      return rpcResult(id, {
        tools: TOOLS.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      });
    }

    case "tools/call": {
      const name = req.params?.name as string | undefined;
      const args = (req.params?.arguments as Record<string, unknown>) ?? {};
      if (!name) return rpcError(id, -32602, "missing tool name");
      const tool = findTool(name);
      if (!tool) return rpcError(id, -32601, `unknown tool: ${name}`);
      try {
        const result = await tool.execute(args, actor);
        return rpcResult(id, {
          content: [
            {
              type: "text",
              text:
                typeof result === "string"
                  ? result
                  : JSON.stringify(result, null, 2),
            },
          ],
          isError: false,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "tool execution failed";
        return rpcResult(id, {
          content: [{ type: "text", text: `error: ${msg}` }],
          isError: true,
        });
      }
    }

    default: {
      if (isNotification) return null;
      return rpcError(id, -32601, `method not found: ${req.method}`);
    }
  }
}

export async function POST(req: NextRequest) {
  const actor = req.headers.get("x-actor") || "hermes-mcp";

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      rpcError(null, -32700, "parse error"),
      { status: 400 }
    );
  }

  // Batch
  if (Array.isArray(body)) {
    const results = await Promise.all(
      body.map((m) => dispatch(m as JsonRpcRequest, actor))
    );
    const filtered = results.filter((r): r is JsonRpcResponse => r !== null);
    if (filtered.length === 0) return new NextResponse(null, { status: 202 });
    return NextResponse.json(filtered);
  }

  const single = body as JsonRpcRequest;
  if (!single || typeof single !== "object" || single.jsonrpc !== "2.0") {
    return NextResponse.json(
      rpcError(null, -32600, "invalid request"),
      { status: 400 }
    );
  }

  const res = await dispatch(single, actor);
  if (res === null) return new NextResponse(null, { status: 202 });
  return NextResponse.json(res);
}

// GET = server info (lets clients sanity-check the endpoint).
export async function GET() {
  return NextResponse.json({
    name: SERVER_NAME,
    version: SERVER_VERSION,
    protocolVersion: PROTOCOL_VERSION,
    transport: "streamable-http",
    tools: TOOLS.map((t) => t.name),
  });
}

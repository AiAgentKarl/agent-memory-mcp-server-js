# @aiagentkarl/agent-memory-mcp-server

Persistent memory for AI agents. Store, retrieve, and search knowledge across sessions using the [Model Context Protocol](https://modelcontextprotocol.io).

## Features

- **Persistent Storage** -- Key-value pairs stored as JSON files in `~/.agent-memory/`
- **Namespaces** -- Organize memories into separate namespaces (e.g. `project_x`, `user_prefs`)
- **Metadata** -- Attach arbitrary metadata to each memory entry
- **Search** -- Substring search across keys, values, and metadata
- **Access Tracking** -- Automatic access counts and timestamps

## Tools

| Tool | Description |
|------|-------------|
| `store` | Store a key-value pair with optional metadata |
| `retrieve` | Retrieve a stored value by key |
| `search` | Search across memories using substring matching |
| `list_keys` | List all keys in a namespace |
| `delete` | Delete a stored entry |
| `list_namespaces` | List all available namespaces |

## Installation

```bash
npm install -g @aiagentkarl/agent-memory-mcp-server
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agent-memory": {
      "command": "npx",
      "args": ["-y", "@aiagentkarl/agent-memory-mcp-server"]
    }
  }
}
```

## Usage with Claude Code

```bash
claude mcp add agent-memory -- npx -y @aiagentkarl/agent-memory-mcp-server
```

## Storage

Data is stored as JSON files in `~/.agent-memory/`. Each namespace gets its own file:

```
~/.agent-memory/
  default.json
  project_x.json
  user_prefs.json
```

Set `MEMORY_STORAGE_DIR` environment variable to change the storage location.


---

## More MCP Servers by AiAgentKarl

| Category | Servers |
|----------|---------|
| 🔗 Blockchain | [Solana](https://github.com/AiAgentKarl/solana-mcp-server) |
| 🌍 Data | [Weather](https://github.com/AiAgentKarl/weather-mcp-server) · [Germany](https://github.com/AiAgentKarl/germany-mcp-server) · [Agriculture](https://github.com/AiAgentKarl/agriculture-mcp-server) · [Space](https://github.com/AiAgentKarl/space-mcp-server) · [Aviation](https://github.com/AiAgentKarl/aviation-mcp-server) · [EU Companies](https://github.com/AiAgentKarl/eu-company-mcp-server) |
| 🔒 Security | [Cybersecurity](https://github.com/AiAgentKarl/cybersecurity-mcp-server) · [Policy Gateway](https://github.com/AiAgentKarl/agent-policy-gateway-mcp) · [Audit Trail](https://github.com/AiAgentKarl/agent-audit-trail-mcp) |
| 🤖 Agent Infra | [Memory](https://github.com/AiAgentKarl/agent-memory-mcp-server) · [Directory](https://github.com/AiAgentKarl/agent-directory-mcp-server) · [Hub](https://github.com/AiAgentKarl/mcp-appstore-server) · [Reputation](https://github.com/AiAgentKarl/agent-reputation-mcp-server) |
| 🔬 Research | [Academic](https://github.com/AiAgentKarl/crossref-academic-mcp-server) · [LLM Benchmark](https://github.com/AiAgentKarl/llm-benchmark-mcp-server) · [Legal](https://github.com/AiAgentKarl/legal-court-mcp-server) |

[→ Full catalog (40+ servers)](https://github.com/AiAgentKarl)

## License

MIT

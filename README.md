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

## License

MIT

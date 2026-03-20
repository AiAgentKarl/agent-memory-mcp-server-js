#!/usr/bin/env node

/**
 * Agent Memory MCP Server — Persistenter Speicher für AI-Agents.
 *
 * Speichert Wissen als JSON-Dateien in ~/.agent-memory/{namespace}.json.
 * Unterstützt Namespaces, Metadaten und Volltextsuche.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

// --- Speicher-Verzeichnis ---
const STORAGE_DIR = process.env.MEMORY_STORAGE_DIR || join(homedir(), ".agent-memory");

/**
 * Sicherstellen, dass das Speicher-Verzeichnis existiert.
 */
function ensureStorageDir() {
  if (!existsSync(STORAGE_DIR)) {
    mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

/**
 * Pfad zur JSON-Datei eines Namespaces.
 */
function namespacePath(namespace) {
  return join(STORAGE_DIR, `${namespace}.json`);
}

/**
 * Namespace-Datei laden. Gibt leeres Objekt zurück wenn nicht vorhanden.
 */
function loadNamespace(namespace) {
  const filePath = namespacePath(namespace);
  if (!existsSync(filePath)) {
    return {};
  }
  try {
    const data = readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

/**
 * Namespace-Datei speichern.
 */
function saveNamespace(namespace, data) {
  ensureStorageDir();
  const filePath = namespacePath(namespace);
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Alle vorhandenen Namespace-Namen auflisten.
 */
function getAllNamespaces() {
  ensureStorageDir();
  try {
    return readdirSync(STORAGE_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""));
  } catch {
    return [];
  }
}

// --- MCP Server ---

const server = new McpServer({
  name: "Agent Memory Server",
  version: "0.1.0",
});

// Tool: store — Wissen persistent speichern
server.registerTool(
  "store",
  {
    title: "Store Memory",
    description:
      "Store a key-value pair persistently. Survives across sessions. " +
      "Use namespaces to organize memories (e.g. 'project_x', 'user_prefs').",
    inputSchema: {
      namespace: z
        .string()
        .default("default")
        .describe("Namespace for organizing memories (e.g. 'project_x')"),
      key: z
        .string()
        .describe("Unique key for this memory (e.g. 'user_language')"),
      value: z
        .string()
        .describe("The content to store (text, JSON string, etc.)"),
      metadata: z
        .record(z.string(), z.string())
        .optional()
        .describe("Optional metadata key-value pairs"),
    },
  },
  async ({ namespace, key, value, metadata }) => {
    const data = loadNamespace(namespace);
    const now = new Date().toISOString();
    const existing = data[key];

    data[key] = {
      value,
      metadata: metadata || {},
      created_at: existing?.created_at || now,
      updated_at: now,
      access_count: existing?.access_count || 0,
    };

    saveNamespace(namespace, data);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            stored: true,
            namespace,
            key,
            updated_at: now,
          }),
        },
      ],
    };
  }
);

// Tool: retrieve — Gespeichertes Wissen abrufen
server.registerTool(
  "retrieve",
  {
    title: "Retrieve Memory",
    description:
      "Retrieve a stored memory by namespace and key. " +
      "Returns the value, metadata, and timestamps.",
    inputSchema: {
      namespace: z
        .string()
        .default("default")
        .describe("Namespace to look in"),
      key: z.string().describe("Key of the memory to retrieve"),
    },
  },
  async ({ namespace, key }) => {
    const data = loadNamespace(namespace);
    const entry = data[key];

    if (!entry) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ found: false, namespace, key }),
          },
        ],
      };
    }

    // Zugriffszähler erhöhen
    entry.access_count = (entry.access_count || 0) + 1;
    saveNamespace(namespace, data);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            found: true,
            namespace,
            key,
            value: entry.value,
            metadata: entry.metadata,
            created_at: entry.created_at,
            updated_at: entry.updated_at,
            access_count: entry.access_count,
          }),
        },
      ],
    };
  }
);

// Tool: search — Memories durchsuchen (Substring-Matching)
server.registerTool(
  "search",
  {
    title: "Search Memories",
    description:
      "Search across stored memories using substring matching on keys and values. " +
      "Optionally filter by namespace.",
    inputSchema: {
      query: z.string().describe("Search term to find in keys and values"),
      namespace: z
        .string()
        .optional()
        .describe("Optional: search only in this namespace"),
    },
  },
  async ({ query, namespace }) => {
    const queryLower = query.toLowerCase();
    const namespacesToSearch = namespace
      ? [namespace]
      : getAllNamespaces();
    const results = [];

    for (const ns of namespacesToSearch) {
      const data = loadNamespace(ns);
      for (const [key, entry] of Object.entries(data)) {
        const keyMatch = key.toLowerCase().includes(queryLower);
        const valueMatch = entry.value?.toLowerCase().includes(queryLower);
        const metaMatch = entry.metadata
          ? Object.values(entry.metadata).some((v) =>
              v.toLowerCase().includes(queryLower)
            )
          : false;

        if (keyMatch || valueMatch || metaMatch) {
          results.push({
            namespace: ns,
            key,
            value: entry.value,
            metadata: entry.metadata,
            updated_at: entry.updated_at,
          });
        }
      }
    }

    // Nach Aktualisierungsdatum sortieren (neueste zuerst)
    results.sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            query,
            results_count: results.length,
            results,
          }),
        },
      ],
    };
  }
);

// Tool: list_keys — Alle Keys in einem Namespace auflisten
server.registerTool(
  "list_keys",
  {
    title: "List Keys",
    description:
      "List all keys stored in a namespace with their metadata summaries.",
    inputSchema: {
      namespace: z
        .string()
        .default("default")
        .describe("Namespace to list keys from"),
    },
  },
  async ({ namespace }) => {
    const data = loadNamespace(namespace);
    const keys = Object.entries(data).map(([key, entry]) => ({
      key,
      value_preview: entry.value?.substring(0, 100),
      metadata: entry.metadata,
      updated_at: entry.updated_at,
      access_count: entry.access_count || 0,
    }));

    // Nach Aktualisierungsdatum sortieren
    keys.sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            namespace,
            total_keys: keys.length,
            keys,
          }),
        },
      ],
    };
  }
);

// Tool: delete — Einen Eintrag löschen
server.registerTool(
  "delete",
  {
    title: "Delete Memory",
    description: "Delete a stored memory entry by namespace and key.",
    inputSchema: {
      namespace: z
        .string()
        .default("default")
        .describe("Namespace of the entry"),
      key: z.string().describe("Key to delete"),
    },
  },
  async ({ namespace, key }) => {
    const data = loadNamespace(namespace);
    const existed = key in data;
    delete data[key];
    saveNamespace(namespace, data);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            deleted: existed,
            namespace,
            key,
          }),
        },
      ],
    };
  }
);

// Tool: list_namespaces — Alle Namespaces auflisten
server.registerTool(
  "list_namespaces",
  {
    title: "List Namespaces",
    description:
      "List all available namespaces with their entry counts.",
    inputSchema: {},
  },
  async () => {
    const namespaces = getAllNamespaces().map((ns) => {
      const data = loadNamespace(ns);
      return {
        namespace: ns,
        entry_count: Object.keys(data).length,
      };
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            total_namespaces: namespaces.length,
            namespaces,
          }),
        },
      ],
    };
  }
);

// --- Server starten ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Agent Memory MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});

import fs from "node:fs";

function loadEnv(path = ".env") {
  const env = {};
  const text = fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    value = value.replace(/^["']|["']$/g, "");
    env[key] = value;
  }

  return env;
}

async function n8nFetch(url, apiKey, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-N8N-API-KEY": apiKey,
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    const message = body.message || body.raw || response.statusText;
    throw new Error(`${response.status} ${message}`);
  }

  return body;
}

function saveEnvValue(key, value, path = ".env") {
  const text = fs.readFileSync(path, "utf8");
  const escaped = `${key}=${value}`;
  const next = text.match(new RegExp(`^${key}=`, "m"))
    ? text.replace(new RegExp(`^${key}=.*`, "m"), escaped)
    : `${text.trimEnd()}\n${escaped}\n`;
  fs.writeFileSync(path, next);
}

const env = loadEnv();
const baseUrl = env.N8N_BASE_URL?.replace(/\/$/, "");
const apiKey = env.N8N_API_KEY;
const workflowId = env.N8N_WORKFLOW_ID;
const workflowFile = env.N8N_WORKFLOW_FILE || "Workplace Learning Enquiry Form.json";
const webhookUrl = env.N8N_WEBHOOK_URL;

if (!baseUrl) throw new Error("Missing N8N_BASE_URL in .env");
if (!apiKey) throw new Error("Missing N8N_API_KEY in .env");
if (!workflowId) throw new Error("Missing N8N_WORKFLOW_ID in .env");

const workflow = JSON.parse(fs.readFileSync(workflowFile, "utf8"));
const payload = {
  name: workflow.name,
  nodes: workflow.nodes,
  connections: workflow.connections,
  settings: {
    executionOrder: workflow.settings?.executionOrder || "v1"
  },
  staticData: workflow.staticData || null
};

console.log(`Publishing workflow on ${baseUrl}`);

let publishedWorkflowId = workflowId;

try {
  console.log(`Updating workflow ${workflowId}`);
  await n8nFetch(`${baseUrl}/api/v1/workflows/${workflowId}`, apiKey, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
} catch (error) {
  if (!String(error.message).includes("permission to update")) {
    throw error;
  }

  console.log("No permission to update existing workflow; creating a new workflow");
  const created = await n8nFetch(`${baseUrl}/api/v1/workflows`, apiKey, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  publishedWorkflowId = created.id;
  if (!publishedWorkflowId) {
    throw new Error("Created workflow response did not include an id");
  }

  saveEnvValue("N8N_WORKFLOW_ID", publishedWorkflowId);
  console.log(`Created workflow ${publishedWorkflowId}`);
}

console.log("Activating workflow");

await n8nFetch(`${baseUrl}/api/v1/workflows/${publishedWorkflowId}/activate`, apiKey, {
  method: "POST",
  body: "{}"
});

if (webhookUrl) {
  console.log("Testing production webhook");

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Codex Publish Test",
      email: "codex-test@example.com",
      company: "Codex Test Co",
      employeeCount: "51-200",
      interest: "LEA grant-fit check",
      challenge: "Testing the published workplace learning enquiry webhook.",
      source: "publish-n8n-flow.mjs"
    })
  });

  const body = await response.text();
  console.log(`Webhook response: ${response.status} ${body}`);
}

console.log("Done");

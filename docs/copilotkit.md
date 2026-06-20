CopilotKit is the **frontend/application framework** that sits on top of AG-UI.

```text
React App
  └─ CopilotKit UI + hooks
        └─ AG-UI protocol
              └─ Agent backend
                    └─ MCP/tools/enterprise systems
```

## Where it fits

```text
┌─────────────────────────────────────────────┐
│ React / TypeScript App                      │
│                                             │
│ CopilotKit                                  │
│ - CopilotSidebar / chat UI                  │
│ - useCopilotReadable                        │
│ - useCopilotAction                          │
│ - generative UI                             │
│ - human-in-the-loop UX                      │
└──────────────────┬──────────────────────────┘
                   │ AG-UI
                   ▼
┌─────────────────────────────────────────────┐
│ AG-UI / Copilot Runtime / Gateway           │
│ - stream events                             │
│ - route frontend + backend tools            │
│ - manage sessions                           │
│ - connect to agent runtime                  │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│ Agent Runtime                               │
│ LangGraph / PydanticAI / Mastra /           │
│ Microsoft Agent Framework / custom agents   │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│ Tools & Systems                             │
│ MCP, Jira, GitHub, Splunk, ServiceNow, APIs  │
└─────────────────────────────────────────────┘
```

CopilotKit describes itself as the frontend stack for agentic UX: chat, generative UI, shared state, and human-in-the-loop workflows on AG-UI-compatible backends. ([CopilotKit Docs][1])

## The key distinction

**AG-UI is the protocol.**
**CopilotKit is a product/framework that implements the user-facing experience around that protocol.**

So in your architecture:

| Concern                          | Use                                              |
| -------------------------------- | ------------------------------------------------ |
| Protocol between UI and agents   | AG-UI                                            |
| React components for copilot UX  | CopilotKit                                       |
| Expose app state to the agent    | `useCopilotReadable`                             |
| Let agent trigger UI/app actions | `useCopilotAction`                               |
| Stream agent events              | AG-UI runtime/gateway                            |
| Backend orchestration            | LangGraph / VoltAgent / Semantic Kernel / custom |
| Tool integration                 | MCP / internal APIs                              |

CopilotKit supports streaming chat, frontend and backend tool calling, shared state, generative UI, and human-in-the-loop interactions over AG-UI. ([Microsoft Learn][2])

## Practical enterprise pattern

For something like your **Hypercare Dashboard**:

```text
Dashboard UI
  ├─ Normal React components
  ├─ CopilotKit sidebar
  ├─ useCopilotReadable: current filters, selected incident, dashboard state
  └─ useCopilotAction: open incident, change filters, show timeline

AG-UI Gateway
  ├─ auth
  ├─ audit
  ├─ session persistence
  └─ event routing

Agent backend
  ├─ incident agent
  ├─ Splunk agent
  ├─ PowerBI summary agent
  └─ ServiceNow action agent
```

The important design choice: **do not make CopilotKit your enterprise control plane**. Use it as the **agentic UX layer**. Put enterprise controls in your gateway:

```text
CopilotKit = UX layer
AG-UI Gateway = enterprise policy/control layer
Agent Runtime = reasoning/workflow layer
MCP/API Gateway = tool access layer
```

## When to use CopilotKit

Use it when you want:

* embedded AI assistant inside a React app
* shared state between app and agent
* agent-triggered frontend actions
* approval flows
* generative UI
* faster delivery than building AG-UI UI plumbing yourself

Do **not** use it as the place for:

* core authorization
* audit policy
* enterprise workflow rules
* tool credential management
* production change governance

Those belong behind the AG-UI gateway.

In one line:

> CopilotKit is the React/UX acceleration layer for AG-UI-based agent applications.

[1]: https://docs.showcase.copilotkit.ai/?utm_source=chatgpt.com "CopilotKit: the frontend stack for agents"
[2]: https://learn.microsoft.com/en-us/agent-framework/integrations/ag-ui/?utm_source=chatgpt.com "AG-UI Integration with Agent Framework"

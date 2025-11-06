# Example Flows

This directory contains example Node-RED flows demonstrating the use of `node-red-contrib-llmtools`.

## Importing Examples

1. Open Node-RED
2. Click the hamburger menu (top right) → Import
3. Select the example JSON file
4. Click Import

## Available Examples

### 1. basic-tool-listing.json
Demonstrates how to request the list of available tools from the LLM Tools node.

**What it shows:**
- Sending a `list_tools` action
- Receiving the tools schema response
- Pre-configured with two example tools: `check_disk` and `list_files`

### 2. tool-execution.json
Demonstrates executing tools with parameters.

**What it shows:**
- Executing a tool without parameters (`check_disk`)
- Executing a tool with parameters (`list_files`)
- Handling success and error outputs

### 3. approval-workflow.json
Demonstrates the approval workflow for sensitive operations.

**What it shows:**
- Tool requiring approval before execution
- Approval request with command preview
- Approving or rejecting tool execution
- Complete approval workflow cycle

**How to use:**
1. Click "Execute: Sensitive Command" to trigger a tool requiring approval
2. Check the debug panel for the approval request
3. Click either "Approve" or "Reject" to complete the workflow
4. See the final result in the debug panel

## Tool Configuration Examples

### Simple Tool (No Parameters)
```json
{
  "name": "check_disk",
  "description": "Check disk space usage",
  "command": "df -h",
  "executionMode": "local",
  "requireApproval": false,
  "timeout": 30000,
  "parameters": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

### Tool with Parameters
```json
{
  "name": "list_files",
  "description": "List files in a directory",
  "command": "ls -la {{params.path}}",
  "executionMode": "local",
  "requireApproval": false,
  "timeout": 30000,
  "parameters": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "Directory path to list"
      }
    },
    "required": ["path"]
  }
}
```

### Tool with Approval Required
```json
{
  "name": "delete_temp",
  "description": "Delete files from temp directory",
  "command": "rm -rf {{params.path}}",
  "executionMode": "local",
  "requireApproval": true,
  "timeout": 30000,
  "parameters": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "Path to delete"
      }
    },
    "required": ["path"]
  }
}
```

## Message Format Examples

### List Tools Request
```json
{
  "payload": {
    "action": "list_tools"
  }
}
```

### Execute Tool Request
```json
{
  "payload": {
    "action": "execute_tool",
    "tool_name": "list_files",
    "parameters": {
      "path": "/tmp"
    }
  }
}
```

### Approve Tool Request
```json
{
  "payload": {
    "action": "approve_tool",
    "approval_id": "approval_1234567890_abc123",
    "approved": true
  }
}
```

## Integration with LLMs

These examples show the basic mechanics of the node. In a real LLM integration:

1. **Initial Setup:** Send `list_tools` to get available tools
2. **LLM Processing:** The LLM analyzes the tools and decides which to call
3. **Tool Execution:** Send `execute_tool` with the LLM's chosen tool and parameters
4. **Return Results:** Send tool results back to the LLM for further processing

The node is designed to work with any LLM that supports tool/function calling, including:
- OpenAI GPT models (function calling)
- Anthropic Claude (tool use)
- Local LLMs with tool support

You'll need to build the integration layer that translates between your LLM's API format and the node's message format.

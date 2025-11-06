# node-red-contrib-llmTools

A Node-RED node package that provides LLM tool management with shell command execution capabilities. This package allows you to create custom tools that LLMs can discover and execute, bridging AI agents with your local or remote system environments.

## Features

- **Tool Discovery**: LLMs can query available tools and their schemas
- **Local & Remote Execution**: Execute shell commands locally or via SSH on remote servers
- **Approval Workflow**: Optional approval step for sensitive operations
- **Parameter Templating**: Mustache template support for dynamic command construction
- **Flexible Configuration**: Define multiple tools with custom parameters and schemas
- **Error Handling**: Robust error handling with separate success/error outputs
- **Security**: Encrypted credential storage and optional approval workflow

## Installation

### From npm (when published)
```bash
npm install node-red-contrib-llmtools
```

### Local Development
```bash
cd ~/.node-red
npm install /path/to/node-red-contrib-llmTools
```

After installation, restart Node-RED and the nodes will appear in the palette under the "function" category.

## Nodes

### LLM Tools Node

The main node that manages tools and executes commands.

**Inputs:**
- `msg.payload.action` - Action to perform: `list_tools`, `execute_tool`, or `approve_tool`
- `msg.payload.tool_name` - Tool name (for `execute_tool`)
- `msg.payload.parameters` - Tool parameters (for `execute_tool`)
- `msg.payload.approval_id` - Approval ID (for `approve_tool`)
- `msg.payload.approved` - Boolean approval decision (for `approve_tool`)

**Outputs:**
1. **Success** - Successful tool execution results
2. **Error** - Error messages or non-zero exit codes
3. **Approval Required** - Approval requests (when tool requires approval)

### LLM Tools Server Config Node

Configuration node for SSH server credentials.

**Configuration:**
- Hostname/IP address
- Port (default: 22)
- Username
- Authentication: Password or Private Key
- Passphrase (optional, for encrypted keys)

## Usage

### 1. Configure Tools

1. Drag the **llm-tools** node onto your flow
2. Double-click to open the configuration dialog
3. Click "Add Tool" to create a new tool
4. Configure the tool:
   - **Name**: Unique identifier for the tool
   - **Description**: What the tool does (shown to LLM)
   - **Command**: Shell command to execute (supports Mustache templates)
   - **Execution**: Local or Remote (SSH)
   - **Approval**: Whether to require approval before execution
   - **Timeout**: Command timeout in milliseconds
   - **Parameters**: JSON Schema for tool parameters

### 2. Tool Discovery

Send a message with `action: "list_tools"` to get available tools:

```json
{
  "payload": {
    "action": "list_tools"
  }
}
```

**Response:**
```json
{
  "payload": {
    "action": "list_tools",
    "tools": [
      {
        "name": "check_disk",
        "description": "Check disk space usage",
        "parameters": {
          "type": "object",
          "properties": {},
          "required": []
        }
      }
    ]
  }
}
```

### 3. Execute Tools

Send a message with `action: "execute_tool"`:

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

**Success Response:**
```json
{
  "payload": {
    "action": "execute_tool",
    "tool_name": "list_files",
    "parameters": { "path": "/tmp" },
    "result": {
      "stdout": "total 8\ndrwxr-xr-x  5 user  wheel  160 Jan  1 12:00 .\n...",
      "stderr": "",
      "exitCode": 0
    }
  }
}
```

### 4. Approval Workflow

For tools with `requireApproval: true`:

1. Send `execute_tool` request
2. Receive approval request on output 3:
```json
{
  "payload": {
    "action": "approval_required",
    "approval_id": "approval_1234567890_abc123",
    "tool_name": "delete_temp",
    "parameters": { "path": "/tmp/test" },
    "command_preview": "rm -rf /tmp/test"
  }
}
```

3. Send approval decision:
```json
{
  "payload": {
    "action": "approve_tool",
    "approval_id": "approval_1234567890_abc123",
    "approved": true
  }
}
```

## Command Templates

Use Mustache syntax for dynamic commands:

```bash
# Access parameters
ls -la {{params.path}}

# Access message properties
echo "User: {{msg.user}}"

# Combined
grep "{{params.search}}" {{msg.filename}}
```

**Template Context:**
- `{{params.paramName}}` - Tool parameters
- `{{msg.property}}` - Message properties
- Any property from the incoming message

## Tool Definition Examples

### Simple Local Command
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

### Parameterized Command
```json
{
  "name": "search_logs",
  "description": "Search application logs for a pattern",
  "command": "grep '{{params.pattern}}' /var/log/app.log | tail -n {{params.lines}}",
  "executionMode": "local",
  "requireApproval": false,
  "timeout": 30000,
  "parameters": {
    "type": "object",
    "properties": {
      "pattern": {
        "type": "string",
        "description": "Search pattern"
      },
      "lines": {
        "type": "number",
        "description": "Number of lines to return"
      }
    },
    "required": ["pattern", "lines"]
  }
}
```

### Remote SSH Command
```json
{
  "name": "restart_service",
  "description": "Restart a service on remote server",
  "command": "sudo systemctl restart {{params.service}}",
  "executionMode": "remote",
  "server": "server-config-id",
  "requireApproval": true,
  "timeout": 60000,
  "parameters": {
    "type": "object",
    "properties": {
      "service": {
        "type": "string",
        "description": "Service name to restart"
      }
    },
    "required": ["service"]
  }
}
```

## LLM Integration

This node is designed to work with any LLM that supports tool/function calling:

### OpenAI GPT (Function Calling)
```javascript
const tools = [/* result from list_tools */];
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: messages,
  tools: tools,
  tool_choice: "auto"
});
```

### Anthropic Claude (Tool Use)
```javascript
const tools = [/* result from list_tools */];
const response = await anthropic.messages.create({
  model: "claude-3-sonnet-20240229",
  messages: messages,
  tools: tools
});
```

### Generic LLM Integration Pattern
1. Call `list_tools` to get available tools
2. Send tools schema to LLM along with user prompt
3. LLM decides which tool to call and with what parameters
4. Send `execute_tool` with LLM's chosen tool and parameters
5. Return results to LLM for further processing

## Examples

See the [examples](examples/) directory for complete Node-RED flow examples:

- **basic-tool-listing.json** - Tool discovery example
- **tool-execution.json** - Executing tools with parameters
- **approval-workflow.json** - Complete approval workflow

Import these examples into Node-RED to see working demonstrations.

## Security Considerations

**Important**: This node executes shell commands. Follow these security best practices:

1. **Use Approval Workflow**: Enable `requireApproval` for:
   - Destructive operations (delete, modify, restart)
   - System administration commands
   - Commands that access sensitive data

2. **Validate Inputs**: The node performs basic parameter validation, but you should:
   - Carefully design parameter schemas
   - Consider what commands an LLM might construct
   - Test thoroughly before production use

3. **Remote Access**: When using SSH:
   - Use SSH keys instead of passwords when possible
   - Limit SSH user permissions
   - Use dedicated service accounts
   - Monitor remote command execution

4. **Command Construction**:
   - Be cautious with template variables
   - Avoid exposing unrestricted file system access
   - Consider using whitelists for sensitive parameters

5. **Network Security**:
   - Run Node-RED in a secure environment
   - Use firewalls to restrict SSH access
   - Encrypt traffic when possible

## Development Guidelines

This package follows Node-RED best practices:

- Dual outputs for success/error handling
- Message preservation with spread operator
- Async handling with send/done pattern
- TypedInput support for configuration
- Mustache template support
- Proper status indicators
- Configuration nodes for credentials

## Troubleshooting

### Tools not appearing in palette
- Restart Node-RED after installation
- Check Node-RED logs for errors
- Verify package.json is valid

### SSH connection fails
- Verify hostname, port, and credentials
- Check network connectivity
- Ensure SSH server is running
- Check SSH key format (use OpenSSH format)

### Command timeout
- Increase timeout value in tool configuration
- Check if command completes manually
- Review command output for errors

### Template rendering fails
- Verify Mustache syntax
- Check parameter names match schema
- Review message structure

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please ensure:
- Code follows Node-RED development guidelines
- All features are documented
- Examples are provided for new functionality

## Author

calrock27

## Repository

https://github.com/calrock27/node-red-contrib-llmTools

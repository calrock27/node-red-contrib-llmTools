# TODO - Future Development Plans

## Project Vision

This package aims to provide a suite of Node-RED nodes that make it easy to expose various types of tools to LLMs in a structured, consistent manner.

## Completed Nodes

### ✅ Shell Tool Node
A node for executing shell commands (local or remote via SSH) as LLM tools.

**Features:**
- Tool discovery (list_tools)
- Local command execution
- Remote SSH command execution
- Approval workflow
- Parameter templating with Mustache
- JSON Schema parameter definitions

---

## Planned Nodes

### 1. Custom Flow Tool Node (High Priority)

**Purpose:** Allow users to wire their own Node-RED flows as LLM tools

**Key Features:**
- User wires custom logic/flow as the tool implementation
- Consistent approval checks (reusable approval logic)
- Multiple output ports:
  - Success output
  - Error output
  - Approval required output
  - Status/progress updates
- Report tool status back to LLM
- Tool discovery integration (registers with LLM)
- Parameter passing to custom flow
- Result formatting back to LLM

**Use Cases:**
- Database queries as tools
- API integrations as tools
- Complex business logic as tools
- Multi-step workflows as tools
- Any custom Node-RED flow as a tool

**Design Considerations:**
- How to define tool schema/parameters in the node config
- How to pass parameters into the custom flow
- Standard message format for results
- Error handling conventions
- Progress/status reporting back to LLM during long-running operations

---

### 2. HTTP Tool Node (Medium Priority)

**Purpose:** Make HTTP/REST API calls as LLM tools

**Key Features:**
- Configure HTTP endpoints as tools
- Support for GET, POST, PUT, DELETE, etc.
- Header and authentication management
- Request body templating
- Response parsing and formatting
- Retry logic
- Timeout configuration

**Use Cases:**
- Weather API queries
- Database REST APIs
- Third-party service integrations
- Webhook triggers

---

### 3. Database Tool Node (Medium Priority)

**Purpose:** Execute database queries as LLM tools

**Key Features:**
- Support for multiple database types (PostgreSQL, MySQL, SQLite, MongoDB)
- Parameterized queries (SQL injection prevention)
- Result set formatting
- Connection pooling
- Query timeout
- Read-only mode option

**Use Cases:**
- Data retrieval
- Report generation
- Data analysis queries

---

### 4. File System Tool Node (Low Priority)

**Purpose:** File operations as LLM tools

**Key Features:**
- Read files
- Write files (with approval)
- List directories
- Search file contents
- File metadata
- Path restrictions/sandboxing

**Use Cases:**
- Reading configuration files
- Log file analysis
- Document processing

---

## Architecture Improvements

### Tool Registry System
Create a centralized tool registry that all tool nodes register with:
- Automatic tool discovery across all node types
- Unified tool listing endpoint
- Consistent tool execution interface
- Tool categorization and tagging
- Tool version management

### Approval Workflow Subflow
Extract approval logic into a reusable subflow:
- Standard approval UI
- Approval timeout configuration
- Approval audit logging
- Multiple approval strategies (single approver, multi-approval, etc.)

### LLM Integration Helper Nodes
Create helper nodes for common LLM integrations:
- OpenAI function calling formatter
- Anthropic tool use formatter
- Generic tool schema converter
- Result formatting nodes

---

## Configuration Node Enhancements

### LLM Config Node
Create a configuration node for LLM connections:
- Store API keys securely
- LLM provider selection (OpenAI, Anthropic, etc.)
- Model selection
- Common parameters (temperature, max tokens, etc.)
- Rate limiting configuration

---

## Documentation Improvements

- [ ] Video tutorials for each node type
- [ ] More example flows
- [ ] Integration guides for popular LLMs
- [ ] Best practices guide
- [ ] Security hardening guide
- [ ] Performance optimization guide

---

## Testing

- [ ] Unit tests for utility modules
- [ ] Integration tests for each node
- [ ] Example flow validation
- [ ] Security testing (command injection, etc.)
- [ ] Performance benchmarks

---

## Package Management

- [ ] Publish to npm
- [ ] Set up CI/CD pipeline
- [ ] Automated testing on PR
- [ ] Version tagging strategy
- [ ] Changelog automation

---

## Community

- [ ] Contributing guidelines
- [ ] Issue templates
- [ ] Pull request templates
- [ ] Code of conduct
- [ ] Discussion forum or Discord

---

## Notes

- All nodes should follow the same design patterns established by Shell Tool
- Maintain consistency in approval workflows across all nodes
- Always use dual/triple outputs (success, error, approval)
- Support runtime parameter overrides via msg properties
- Follow Node-RED development best practices
- Security first - especially for nodes that execute code or access sensitive data

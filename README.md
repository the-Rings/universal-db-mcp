<h1 align="center">Universal DB MCP</h1>
<p align="center">
  <strong>用自然语言连接 AI 与你的数据库</strong>
</p>

<p align="center">
  一个实现了模型上下文协议（MCP）和 HTTP API 的通用数据库连接器，让 AI 助手能够使用自然语言查询和分析你的数据库。
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/universal-db-mcp"><img src="https://img.shields.io/npm/v/universal-db-mcp.svg?style=flat-square&color=blue" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/universal-db-mcp"><img src="https://img.shields.io/npm/dm/universal-db-mcp.svg?style=flat-square&color=green" alt="npm downloads"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen?style=flat-square" alt="Node.js Version"></a>
  <a href="https://github.com/Anarkh-Lee/universal-db-mcp/stargazers"><img src="https://img.shields.io/github/stars/Anarkh-Lee/universal-db-mcp?style=flat-square" alt="GitHub Stars"></a>
</p>

<p align="center">
  <a href="./README.md">中文</a>

---

## ✨ 特性

- **支持 17 种数据库** - MySQL、PostgreSQL、Redis(Cluster)、Oracle、SQL Server、MongoDB、SQLite，Hive(Preto)以及 10 种国产数据库
- **标准协议兼容** - 支持 MCP stdio、MCP SSE、MCP Streamable HTTP 和 REST API
- **灵活架构** - 2 种启动模式（stdio/http），4 种接入方式：MCP stdio、MCP SSE、MCP Streamable HTTP、REST API
- **安全第一** - 默认只读模式，防止意外的数据修改
- **智能缓存** - Schema 缓存支持可配置的 TTL，性能极速
- **Schema 增强** - 表注释、隐式关系推断，提升 Text2SQL 准确性
- **多 Schema 支持** - 自动发现所有用户 Schema（PostgreSQL、SQL Server、Oracle、达梦等）
- **数据脱敏** - 自动保护敏感数据（手机号、邮箱、身份证、银行卡等）
- **连接稳定性** - 连接池、TCP Keep-Alive、断线自动重试，保障长时间会话稳定运行

## 🚀 快速开始

### 安装

```bash
npm install -g universal-db-mcp
```

### MCP 模式（Claude Desktop）

将以下配置添加到 Claude Desktop 配置文件：

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "my-database": {
      "command": "npx",
      "args": [
        "universal-db-mcp",
        "--type", "mysql",
        "--host", "localhost",
        "--port", "3306",
        "--user", "root",
        "--password", "your_password",
        "--database", "your_database"
      ]
    }
  }
}
```

重启 Claude Desktop，然后开始提问：

- *"帮我查看 users 表的结构"*
- *"统计最近 7 天的订单数量"*
- *"找出销量最高的 5 个产品"*

### HTTP API 模式

```bash
# 设置环境变量
export MODE=http
export HTTP_PORT=3000
export API_KEYS=your-secret-key

# 启动服务
npx universal-db-mcp
```

```bash
# 测试 API
curl http://localhost:3000/api/health
```

### MCP SSE 模式（Dify 和远程访问）

在 HTTP 模式下运行时，服务器还会通过 SSE（Server-Sent Events）和 Streamable HTTP 暴露 MCP 协议端点。这使得 Dify 等平台可以直接使用 MCP 协议连接。

**SSE 端点（传统方式）：**
```
GET http://localhost:3000/sse?type=mysql&host=localhost&port=3306&user=root&password=xxx&database=mydb
```

**Streamable HTTP 端点（MCP 2025 规范，推荐）：**
```
POST http://localhost:3000/mcp
请求头：
  X-DB-Type: mysql
  X-DB-Host: localhost
  X-DB-Port: 3306
  X-DB-User: root
  X-DB-Password: your_password
  X-DB-Database: your_database
请求体：MCP JSON-RPC 请求
```

| 端点 | 方法 | 说明 |
|------|------|------|
| `/sse` | GET | 建立 SSE 连接（传统方式） |
| `/sse/message` | POST | 向 SSE 会话发送消息 |
| `/mcp` | POST | Streamable HTTP 端点（推荐） |
| `/mcp` | GET | Streamable HTTP 的 SSE 流 |
| `/mcp` | DELETE | 关闭会话 |

## 📊 支持的数据库

| 数据库 | 类型参数 | 默认端口 | 分类 |
|--------|----------|----------|------|
| MySQL | `mysql` | 3306 | 开源 |
| PostgreSQL | `postgres` | 5432 | 开源 |
| Redis | `redis` | 6379 | NoSQL |
| Oracle | `oracle` | 1521 | 商业 |
| SQL Server | `sqlserver` | 1433 | 商业 |
| MongoDB | `mongodb` | 27017 | NoSQL |
| SQLite | `sqlite` | - | 嵌入式 |
| 达梦 | `dm` | 5236 | 国产 |
| 人大金仓 | `kingbase` | 54321 | 国产 |
| 华为 GaussDB | `gaussdb` | 5432 | 国产 |
| 蚂蚁 OceanBase | `oceanbase` | 2881 | 国产 |
| TiDB | `tidb` | 4000 | 分布式 |
| ClickHouse | `clickhouse` | 8123 | OLAP |
| 阿里云 PolarDB | `polardb` | 3306 | 云数据库 |
| 海量 Vastbase | `vastbase` | 5432 | 国产 |
| 瀚高 HighGo | `highgo` | 5866 | 国产 |
| 中兴 GoldenDB | `goldendb` | 3306 | 国产 |

## 🏗️ 架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Universal DB MCP                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  启动模式：                                                               │
│  ┌────────────────────────────┬────────────────────────────────────┐    │
│  │ stdio 模式                 │ http 模式                          │    │
│  │ (npm run start:mcp)        │ (npm run start:http)               │    │
│  └─────────────┬──────────────┴───────────────┬────────────────────┘    │
│                │                              │                          │
│                ▼                              ▼                          │
│  ┌─────────────────────────┐    ┌───────────────────────────────────┐   │
│  │      MCP 协议           │    │           HTTP 服务器             │   │
│  │    (stdio 传输)         │    │                                   │   │
│  │                         │    │  ┌─────────────────────────────┐  │   │
│  │  工具：                 │    │  │       MCP 协议              │  │   │
│  │  • execute_query        │    │  │  (SSE / Streamable HTTP)    │  │   │
│  │  • get_schema           │    │  │                             │  │   │
│  │  • get_table_info       │    │  │  工具：（与 stdio 相同）    │  │   │
│  │  • clear_cache          │    │  │  • execute_query            │  │   │
│  │  • get_enum_values      │    │  │  • get_schema               │  │   │
│  │  • get_sample_data      │    │  │  • get_table_info           │  │   │
│  │  • connect_database     │    │  │  • clear_cache              │  │   │
│  │  • disconnect_database  │    │  │  • get_enum_values          │  │   │
│  │  • get_connection_status│    │  │  • get_sample_data          │  │   │
│  │                         │    │  │  • connect_database         │  │   │
│  │  适用：Claude Desktop,  │    │  │  • disconnect_database      │  │   │
│  │        Cursor 等        │    │  │  • get_connection_status    │  │   │
│  └─────────────┬───────────┘    │  │                             │  │   │
│                │                │  │  适用：Dify、远程访问       │  │   │
│                │                │  └──────────────┬──────────────┘  │   │
│                │                │                 │                 │   │
│                │                │  ┌──────────────┴──────────────┐  │   │
│                │                │  │        REST API             │  │   │
│                │                │  │                             │  │   │
│                │                │  │  端点：                     │  │   │
│                │                │  │  • /api/connect             │  │   │
│                │                │  │  • /api/query               │  │   │
│                │                │  │  • /api/schema              │  │   │
│                │                │  │  • ...（10+ 端点）          │  │   │
│                │                │  │                             │  │   │
│                │                │  │  适用：Coze、n8n、自定义    │  │   │
│                │                │  └──────────────┬──────────────┘  │   │
│                │                └─────────────────┼─────────────────┘   │
│                │                                  │                     │
│                └──────────────────┬───────────────┘                     │
│                                   ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                       核心业务逻辑层                               │  │
│  │  • 查询执行          • Schema 缓存                               │  │
│  │  • 安全校验          • 连接管理                                  │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     ▼                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      数据库适配器层                                │  │
│  │  MySQL │ PostgreSQL │ Redis │ Oracle │ MongoDB │ SQLite │ ...    │  │
│  │          （连接池 + TCP Keep-Alive + 断线自动重试）               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🔒 安全

默认情况下，Universal DB MCP 运行在**只读模式**，会阻止所有写操作（INSERT、UPDATE、DELETE、DROP 等）。

### 权限模式

支持细粒度权限控制，可根据需求灵活配置：

| 模式 | 允许的操作 | 说明 |
|------|-----------|------|
| `safe`（默认） | SELECT | 只读，最安全 |
| `readwrite` | SELECT, INSERT, UPDATE | 读写但不能删除 |
| `full` | 所有操作 | 完全控制（危险！） |
| `custom` | 自定义组合 | 通过 `--permissions` 指定 |

**权限类型：**
- `read` - SELECT 查询（始终包含）
- `insert` - INSERT, REPLACE
- `update` - UPDATE
- `delete` - DELETE, TRUNCATE
- `ddl` - CREATE, ALTER, DROP, RENAME

**使用示例：**

```bash
# 只读模式（默认）
npx universal-db-mcp --type mysql ...

# 读写但不能删除
npx universal-db-mcp --type mysql --permission-mode readwrite ...

# 自定义：只允许读和插入
npx universal-db-mcp --type mysql --permissions read,insert ...

# 完全控制（等价于原来的 --danger-allow-write）
npx universal-db-mcp --type mysql --permission-mode full ...
```

**不同传输方式的权限配置：**

> ⚠️ 不同传输方式的参数命名风格不同，请注意区分！

| 传输方式 | 参数位置 | 权限模式参数 | 自定义权限参数 |
|---------|---------|-------------|---------------|
| STDIO (Claude Desktop) | 命令行 | `--permission-mode` | `--permissions` |
| SSE (Dify 等) | URL Query | `permissionMode` | `permissions` |
| Streamable HTTP | HTTP Header | `X-DB-Permission-Mode` | `X-DB-Permissions` |
| REST API | JSON Body | `permissionMode` | `permissions` |

**最佳实践：**
- 生产环境永远不要启用写入模式
- 使用专用的只读数据库账号
- 通过 VPN 或跳板机连接
- 定期审计查询日志

## 🔌 支持的平台

Universal DB MCP 可与任何支持 MCP 协议或 REST API 的平台配合使用。比如，Cursor，CodeBuddy，Claude Code，Dify等主流平台工具。

> **提示**：任何 MCP 兼容客户端都可以通过 stdio（本地）或 SSE/Streamable HTTP（远程）连接。任何 HTTP 客户端都可以使用 REST API。

## 📚 文档

### 快速开始
- [安装指南](./docs/getting-started/installation.md)
- [快速开始](./docs/getting-started/quick-start.md)
- [配置说明](./docs/getting-started/configuration.md)
- [使用示例](./docs/getting-started/examples.md)

### 部署
- [部署概览](./docs/deployment/README.md)
- [本地部署](./docs/deployment/local.md)
- [Docker 部署](./docs/deployment/docker.md)
- [云服务部署](./docs/deployment/cloud/)

### 数据库指南
- [数据库支持概览](./docs/databases/README.md)
- [MySQL](./docs/databases/mysql.md)
- [PostgreSQL](./docs/databases/postgresql.md)
- [更多数据库...](./docs/databases/)

### HTTP API
- [API 参考](./docs/http-api/API_REFERENCE.md)
- [部署指南](./docs/http-api/DEPLOYMENT.md)

### 进阶
- [安全指南](./docs/guides/security.md)
- [多租户指南](./docs/guides/multi-tenant.md)
- [架构说明](./docs/development/architecture.md)
- [故障排查](./docs/operations/troubleshooting.md)

## 📄 许可证

本项目采用 [MIT 许可证](./LICENSE)。

## 📝 更新日志

详见 [CHANGELOG.md](./CHANGELOG.md) 了解详细的版本历史。


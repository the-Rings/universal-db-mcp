# Deployment Guide

This guide covers various deployment options for Universal Database MCP Server in HTTP API mode.

## Table of Contents

- [Local Deployment](#local-deployment)
- [Docker Deployment](#docker-deployment)
- [Production Considerations](#production-considerations)

## Local Deployment

### Prerequisites

- Node.js >= 20.0.0
- npm or yarn
- Database instance (MySQL, PostgreSQL, etc.)

### Option 1: Direct Node.js

#### 1. Install

```bash
# Global installation
npm install -g universal-db-mcp

# Or local installation
npm install universal-db-mcp
```

#### 2. Configure

Create `.env` file:

```bash
MODE=http
HTTP_PORT=3000
HTTP_HOST=0.0.0.0
API_KEYS=your-secret-key-1,your-secret-key-2
CORS_ORIGINS=*
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=1m
LOG_LEVEL=info
```

#### 3. Start

```bash
# If installed globally
npm run start:http

# If installed locally
npx universal-db-mcp
```

#### 4. Verify

```bash
curl http://localhost:3000/api/health
```

### Option 2: PM2 (Production)

PM2 is a production process manager for Node.js applications.

#### 1. Install PM2

```bash
npm install -g pm2
```

#### 2. Create PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'universal-db-mcp',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      MODE: 'http',
      HTTP_PORT: 3000,
      HTTP_HOST: '0.0.0.0',
      API_KEYS: 'your-secret-key-1,your-secret-key-2',
      CORS_ORIGINS: '*',
      RATE_LIMIT_MAX: 100,
      RATE_LIMIT_WINDOW: '1m',
      LOG_LEVEL: 'info'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    autorestart: true,
    watch: false
  }]
};
```

#### 3. Start with PM2

```bash
# Build first
npm run build

# Start
pm2 start ecosystem.config.js

# View logs
pm2 logs universal-db-mcp

# Monitor
pm2 monit

# Restart
pm2 restart universal-db-mcp

# Stop
pm2 stop universal-db-mcp

# Delete
pm2 delete universal-db-mcp
```

#### 4. Auto-start on System Boot

```bash
# Generate startup script
pm2 startup

# Save current process list
pm2 save
```

### Option 3: systemd (Linux)

Create `/etc/systemd/system/universal-db-mcp.service`:

```ini
[Unit]
Description=Universal Database MCP Server
After=network.target

[Service]
Type=simple
User=nodejs
WorkingDirectory=/opt/universal-db-mcp
Environment="NODE_ENV=production"
Environment="MODE=http"
Environment="HTTP_PORT=3000"
Environment="API_KEYS=your-secret-key"
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=universal-db-mcp

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable universal-db-mcp
sudo systemctl start universal-db-mcp
sudo systemctl status universal-db-mcp
```

## Docker Deployment

### Prerequisites

- Docker >= 20.10
- Docker Compose >= 2.0 (optional)

### Option 1: Docker Run

#### 1. Build Image

```bash
cd /path/to/universal-db-mcp
docker build -t universal-db-mcp:latest -f docker/Dockerfile .
```

#### 2. Run Container

```bash
docker run -d \
  --name universal-db-mcp \
  -p 3000:3000 \
  -e MODE=http \
  -e HTTP_PORT=3000 \
  -e API_KEYS=your-secret-key \
  -e CORS_ORIGINS=* \
  -e RATE_LIMIT_MAX=100 \
  -e LOG_LEVEL=info \
  --restart unless-stopped \
  universal-db-mcp:latest
```

#### 3. View Logs

```bash
docker logs -f universal-db-mcp
```

#### 4. Stop/Remove

```bash
docker stop universal-db-mcp
docker rm universal-db-mcp
```

### Option 2: Docker Compose

#### 1. Create docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - MODE=http
      - HTTP_PORT=3000
      - HTTP_HOST=0.0.0.0
      - API_KEYS=${API_KEYS:-default-key-change-me}
      - CORS_ORIGINS=${CORS_ORIGINS:-*}
      - RATE_LIMIT_MAX=${RATE_LIMIT_MAX:-100}
      - LOG_LEVEL=${LOG_LEVEL:-info}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

#### 2. Create .env File

```bash
API_KEYS=your-secret-key-1,your-secret-key-2
CORS_ORIGINS=*
RATE_LIMIT_MAX=100
LOG_LEVEL=info
```

#### 3. Start

```bash
docker-compose up -d
```

#### 4. View Logs

```bash
docker-compose logs -f
```

#### 5. Stop

```bash
docker-compose down
```

### Docker with Database

Example with MySQL:

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - MODE=http
      - HTTP_PORT=3000
      - API_KEYS=your-secret-key
    depends_on:
      - mysql
    networks:
      - app-network

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: testdb
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mysql-data:
```

Connect to MySQL from API:

```bash
curl -X POST http://localhost:3000/api/connect \
  -H "X-API-Key: your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "mysql",
    "host": "mysql",
    "port": 3306,
    "user": "root",
    "password": "rootpassword",
    "database": "testdb"
  }'
```

## Production Considerations

### Security

#### 1. HTTPS/TLS

Use reverse proxy (nginx, Caddy) for HTTPS:

**nginx example**:

```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 2. API Keys

Generate strong API keys:

```bash
# Generate random key
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### 3. CORS

Restrict CORS origins in production:

```bash
CORS_ORIGINS=https://app.example.com,https://admin.example.com
```

#### 4. Rate Limiting

Adjust rate limits based on your needs:

```bash
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=1h
```

### Monitoring

#### 1. Health Checks

Configure health check endpoint:

```bash
curl http://localhost:3000/api/health
```

#### 2. Logging

Use structured logging:

```bash
LOG_LEVEL=info
LOG_PRETTY=false  # JSON format for log aggregation
```

#### 3. Metrics

Monitor key metrics:
- Request rate
- Response time
- Error rate
- Active sessions
- Database connection pool

### Performance

#### 1. Clustering

Use PM2 cluster mode:

```javascript
{
  instances: 'max',  // Use all CPU cores
  exec_mode: 'cluster'
}
```

#### 2. Caching

Implement caching for schema queries:

```javascript
// Cache schema for 5 minutes
const schemaCache = new Map();
```

#### 3. Connection Pooling

Configure database connection pools:

```javascript
// MySQL example
{
  connectionLimit: 10,
  queueLimit: 0
}
```

### Backup & Recovery

#### 1. Database Backups

Regular database backups:

```bash
# MySQL
mysqldump -u root -p mydb > backup.sql

# PostgreSQL
pg_dump mydb > backup.sql
```

#### 2. Configuration Backups

Backup environment variables and configs.

#### 3. Disaster Recovery

Document recovery procedures:
1. Restore database from backup
2. Redeploy application
3. Restore environment variables
4. Verify health checks

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### Permission Denied

```bash
# Use port > 1024 or run with sudo
HTTP_PORT=8080
```

#### Database Connection Failed

Check:
- Database is running
- Credentials are correct
- Network connectivity
- Firewall rules

#### High Memory Usage

- Reduce session timeout
- Implement connection pooling
- Monitor for memory leaks

### Logs

View logs based on deployment method:

```bash
# PM2
pm2 logs universal-db-mcp

# Docker
docker logs -f universal-db-mcp

# systemd
journalctl -u universal-db-mcp -f

# Railway
railway logs

# Render
# View in dashboard

# Fly.io
fly logs
```

## Support

For deployment issues:
- GitHub Issues: https://github.com/Anarkh-Lee/universal-db-mcp/issues
- Documentation: https://github.com/Anarkh-Lee/universal-db-mcp#readme

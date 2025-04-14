# Docker部署指南

## 先决条件
- 安装Docker: https://docs.docker.com/get-docker/
- 安装Docker Compose: https://docs.docker.com/compose/install/

## 部署步骤

1. 克隆代码仓库
```bash
git clone <仓库URL>
cd NotesApplication
```

2. 构建并启动容器
```bash
docker-compose up -d
```

3. 访问应用
- 前端: http://localhost/
- 后端API: http://localhost:5000/

4. 查看日志
```bash
# 查看所有服务的日志
docker-compose logs

# 查看特定服务的日志
docker-compose logs frontend
docker-compose logs backend
```

5. 停止服务
```bash
docker-compose down
```

## 配置文件说明

### Dockerfile (后端)
位于项目根目录，用于构建Python Flask后端服务。该配置：
- 使用Python 3.12轻量级镜像
- 安装项目依赖
- 暴露5000端口用于API服务

### frontend/Dockerfile (前端)
用于构建React前端应用：
- 使用Node.js进行构建
- 将构建结果部署到Nginx服务器
- 暴露80端口提供Web界面

### frontend/nginx.conf
配置Nginx服务器：
- 处理前端单页应用的路由
- 将API请求代理到后端服务

### docker-compose.yml
协调整个应用的容器编排：
- 定义前端和后端服务
- 配置网络通信
- 设置数据持久化

## 生产环境部署注意事项

1. **环境变量**：在生产环境中，建议通过环境变量文件(.env)配置敏感信息

2. **CORS设置**：调整后端CORS设置，限制只允许特定域名访问：
```python
CORS(app, resources={
    r"/*": {
        "origins": ["https://yourdomain.com"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
    }
})
```

3. **数据备份**：定期备份notes.db文件：
```bash
# 备份数据库
docker-compose exec backend cp /app/notes.db /app/notes.db.backup
docker cp <container_id>:/app/notes.db.backup ./backups/notes.db.$(date +%Y%m%d)
```

4. **HTTPS配置**：在生产环境中，应该配置HTTPS。可以通过修改nginx配置并添加SSL证书：
```
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # 其余配置...
}
```

## 常见问题排查

1. **前端无法连接后端**：
   - 检查nginx配置中的proxy_pass设置
   - 确保backend服务名称与docker-compose.yml中定义的一致

2. **数据库连接问题**：
   - 检查卷挂载配置
   - 确保notes.db文件权限正确

3. **容器启动失败**：
   - 检查日志：`docker-compose logs`
   - 检查端口占用：`netstat -tuln`

4. **性能优化**：
   - 为后端服务设置合理的容器资源限制
   - 配置nginx缓存以提高前端性能
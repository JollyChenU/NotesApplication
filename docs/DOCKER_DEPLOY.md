# Docker部署指南

## 先决条件
- 安装Docker: https://docs.docker.com/get-docker/
- 安装Docker Compose: https://docs.docker.com/compose/install/

## 部署步骤

1. 克隆代码仓库
```bash
git clone https://github.com/JolluChen/NotesApplication
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

## Ubuntu环境中的Docker部署

### 1. 准备Ubuntu环境

#### 安装Docker
```bash
# 更新包索引
sudo apt update

# 安装必要的依赖
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# 添加Docker官方GPG密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

# 添加Docker APT仓库
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# 再次更新包索引
sudo apt update

# 安装Docker CE
sudo apt install -y docker-ce

# 将当前用户添加到docker用户组(这样可以无需sudo运行docker命令)
sudo usermod -aG docker ${USER}

# 应用用户组更改(或者可以选择重启系统)
newgrp docker
```

#### 安装Docker Compose
```bash
# 安装Docker Compose
sudo apt install -y docker-compose

# 检查安装版本
docker-compose --version
```

### 2. 部署应用

#### 获取代码
```bash
# 克隆代码仓库
git clone https://github.com/JolluChen/NotesApplication
cd NotesApplication
```

#### 创建.env文件(可选)
```bash
# 为生产环境创建配置
cat > .env << EOL
FLASK_ENV=production
SECRET_KEY=your-secure-secret-key
# 其他环境变量
EOL
```

#### 构建并启动应用
```bash
# 构建并在后台启动所有容器
docker-compose up -d --build

# 查看容器状态
docker-compose ps
```

#### 访问应用
如果您在云服务器(如AWS EC2)上部署:
1. 确保已开放端口80(前端)和5000(后端API，可选)
2. 使用服务器的公共IP地址访问：http://<服务器IP地址>

### 3. 维护和管理

#### 查看日志
```bash
# 查看所有容器的日志
docker-compose logs

# 实时查看日志
docker-compose logs -f

# 查看特定服务的最近50行日志
docker-compose logs --tail=50 backend
```

#### 重新启动服务
```bash
# 重启服务
docker-compose restart

# 重启特定服务
docker-compose restart backend
```

#### 停止和删除容器
```bash
# 停止所有容器
docker-compose stop

# 停止并删除容器(保留数据卷)
docker-compose down

# 停止并删除容器和数据卷(小心使用!)
docker-compose down -v
```

#### 更新应用
```bash
# 拉取最新代码
git pull

# 重新构建并启动容器
docker-compose up -d --build
```

### 4. 数据管理

#### 数据库备份
```bash
# 创建备份目录
mkdir -p backups

# 备份SQLite数据库
docker-compose exec backend sh -c "cat /app/notes.db" > ./backups/notes.db.$(date +%Y%m%d)

# 或者使用cp命令
docker cp $(docker-compose ps -q backend):/app/notes.db ./backups/notes.db.$(date +%Y%m%d)
```

#### 数据库恢复
```bash
# 确保容器已停止
docker-compose stop backend

# 复制备份文件到容器
docker cp ./backups/notes.db.20250414 $(docker-compose ps -q backend):/app/notes.db

# 重启服务
docker-compose start backend
```
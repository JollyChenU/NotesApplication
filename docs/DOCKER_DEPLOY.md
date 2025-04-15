# Docker部署指南

## 先决条件
- 安装Docker: https://docs.docker.com/get-docker/
- 安装Docker Compose: https://docs.docker.com/compose/install/

## 项目Docker文件结构

项目包含以下Docker相关文件：

1. 根目录下的`Dockerfile`：用于构建后端服务
```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
```

2. `frontend/Dockerfile`：用于构建前端服务
3. `docker-compose.yml`：定义和配置服务
```yaml
version: '3'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    volumes:
      - ./notes.db:/app/notes.db
    environment:
      - FLASK_ENV=production
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

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

## 高级配置

### 环境变量配置

可以通过创建`.env`文件来配置环境变量：

```bash
# 示例.env文件内容
FLASK_ENV=production
SECRET_KEY=your-secure-secret-key
```

### 持久化数据

数据库文件`notes.db`已通过卷挂载方式进行了持久化：

```yaml
volumes:
  - ./notes.db:/app/notes.db
```

### 自定义端口

如需修改端口映射，可以编辑`docker-compose.yml`文件中的`ports`部分：

```yaml
ports:
  - "8080:80"  # 将前端服务映射到8080端口
```

## Ubuntu环境中的Docker部署

### 1. 环境准备

#### 安装Docker和Docker Compose
```bash
# 更新系统包
sudo apt update
sudo apt upgrade -y

# 安装Docker
sudo apt install -y docker.io

# 启动Docker并设置开机自启
sudo systemctl start docker
sudo systemctl enable docker

# 安装Docker Compose
sudo apt install -y docker-compose

# 将当前用户添加到docker组（可选，避免每次使用sudo）
sudo usermod -aG docker $USER
# 重新登录以应用更改
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
- 如果服务器有公网IP，可以通过`http://<server-ip>/`访问前端
- API可通过`http://<server-ip>:5000/`访问

### 3. 维护操作

#### 查看日志
```bash
# 查看所有容器日志
docker-compose logs

# 查看最近的日志并持续监控
docker-compose logs -f --tail=100
```

#### 更新应用
```bash
# 拉取最新代码
git pull

# 重新构建并启动容器
docker-compose down
docker-compose up -d --build
```

#### 备份数据
```bash
# 复制SQLite数据库文件
cp notes.db notes.db.backup.$(date +%Y%m%d)
```

## 常见问题与解决方案

1. **无法连接到前端**
   - 检查端口映射是否正确
   - 检查服务器防火墙设置，确保端口80已开放

2. **API连接失败**
   - 确认backend容器正常运行
   - 检查前端环境变量中的API地址配置
   - 验证端口5000是否可访问

3. **数据未持久化**
   - 确认volume挂载配置正确
   - 检查容器内外的权限设置

4. **容器无法启动**
   - 检查日志以获取详细错误信息：`docker-compose logs`
   - 验证系统资源是否充足
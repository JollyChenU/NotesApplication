# Notes应用 - Ubuntu部署指南

## 环境准备

### 1. 更新系统包
```bash
sudo apt update
sudo apt upgrade -y
```

### 2. 安装Python环境
```bash
sudo apt install python3 python3-pip python3-venv -y
```

### 3. 创建并激活Python虚拟环境
```bash
# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate
```

### 4. 安装Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y
```

## 项目部署

### 1. 克隆项目（如果使用Git）或上传项目文件
```bash
# 如果使用Git
git clone https://github.com/JolluChen/NotesApplication
cd NotesApplication
```

### 2. 安装后端依赖
```bash
# 确保虚拟环境已激活（命令提示符前应显示(venv)）
pip3 install -r requirements.txt
```

### 3. 安装前端依赖
```bash
cd frontend
npm install
```

### 4. 构建前端项目
```bash
npm run build
```

### 5. 启动服务
#### 启动后端服务
```bash
# 在项目根目录下
nohup python3 app.py > app.log 2>&1 &
```

#### 启动前端开发服务器（开发环境）
```bash
# 在frontend目录下
npm run dev
```

### 6. 进程管理

#### 查看进程状态
```bash
# 查看所有Python进程
ps aux | grep python3

# 查看特定进程（使用应用日志中的进程ID）
ps -p <进程ID>
```

#### 停止服务
```bash
# 使用进程ID停止服务
kill <进程ID>

# 如果服务没有正常停止，可以强制终止
kill -9 <进程ID>
```

提示：可以通过查看app.log文件来获取应用的运行状态：
```bash
tail -f app.log
```

#### 启动前端开发服务器（开发环境）
```bash
# 在frontend目录下
npm run dev
```

## 配置EC2安全组

1. 在EC2控制台中找到实例的安全组设置
2. 添加入站规则：
   - 类型：自定义TCP
   - 端口范围：5000（后端API服务）
   - 来源：0.0.0.0/0（或限制特定IP范围）
   
   - 类型：自定义TCP
   - 端口范围：4173（前端开发服务器，使用npm run dev时）
   - 来源：0.0.0.0/0（或限制特定IP范围）

## 访问应用

- 后端API：`http://<EC2公网IP>:5000`
- 前端应用：`http://<EC2公网IP>:4173`

## 注意事项

1. 确保EC2实例有足够的存储空间和内存
2. 建议使用进程管理工具（如PM2）来管理Node.js应用
3. 在生产环境中，建议：
   - 使用Nginx作为反向代理
   - 配置SSL证书实现HTTPS
   - 使用域名而不是直接使用IP地址
   - 限制安全组入站规则的IP范围
   - 使用环境变量管理敏感配置
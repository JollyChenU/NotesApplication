"""
@author Jolly
@date 2025-04-01
@description 主应用入口
@version 1.1.0
@license GPL-3.0
"""

from flask import Flask, jsonify
from flask_cors import CORS
from extensions import db, migrate  # 从extensions导入db和migrate
from routes import api
from config import config
from routes.files import files_bp
from routes.notes import notes_bp
from routes.folders import folders_bp
from routes.health import health_bp

def create_app(config_name='default'):
    app = Flask(__name__)
    
    # 加载配置
    app.config.from_object(config[config_name])
    
    # 改进CORS配置，确保前端可以访问
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:5173", "http://127.0.0.1:5173", "*"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
        }
    })
    
    # 初始化扩展
    db.init_app(app)
    migrate.init_app(app, db)  # 使用导入的migrate
    
    # 注册蓝图
    app.register_blueprint(api)
    app.register_blueprint(files_bp, url_prefix='/api')
    app.register_blueprint(notes_bp, url_prefix='/api')
    app.register_blueprint(folders_bp, url_prefix='/api')  # 注册文件夹路由
    app.register_blueprint(health_bp, url_prefix='/api')  # 注册健康检查路由
    
    # 创建数据库表
    with app.app_context():
        db.create_all()
    
    @app.route('/')
    def index():
        """主页，用于检查服务是否正常运行"""
        return jsonify({
            "status": "ok", 
            "message": "Notes Application API is running",
            "version": "1.1.0"
        })
    
    return app

if __name__ == '__main__':
    app = create_app('development')
    app.run(host='0.0.0.0', debug=True, port=5000)
"""
NotesApplication 应用程序包
包含API、模型、服务等模块
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import logging
import sys
from app.extensions import db, migrate
from app.api import api
from app.api.files import files_bp
from app.api.notes import notes_bp
from app.api.folders import folders_bp
from app.api.health import health_bp
from app.config import config

# 设置更详细的日志记录
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('app_debug.log')
    ]
)
logger = logging.getLogger(__name__)

def create_app(config_name='default'):
    """创建并配置Flask应用"""
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
    migrate.init_app(app, db)
    
    # 创建请求前钩子，记录请求详情
    @app.before_request
    def log_request_info():
        logger.debug('【请求】%s %s', request.method, request.path)
        if request.is_json:
            logger.debug('【请求数据】%s', request.get_json())

    # 创建请求后钩子，记录响应详情
    @app.after_request
    def log_response_info(response):
        logger.debug('【响应】状态码: %s', response.status_code)
        # 只记录小型JSON响应，避免日志过大
        if response.content_type == 'application/json' and len(response.get_data()) < 1024:
            try:
                logger.debug('【响应数据】%s', response.get_json())
            except:
                pass
        return response
    
    # 注册蓝图
    app.register_blueprint(api)
    app.register_blueprint(files_bp, url_prefix='/api')
    app.register_blueprint(notes_bp, url_prefix='/api')
    app.register_blueprint(folders_bp, url_prefix='/api')
    app.register_blueprint(health_bp, url_prefix='/api')
    
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
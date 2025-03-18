from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from models import db
from routes import api
from config import config

def create_app(config_name='default'):
    app = Flask(__name__)
    
    # 加载配置
    app.config.from_object(config[config_name])
    
    # 初始化扩展
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:5173", "*"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type"]
        }
    })
    db.init_app(app)
    migrate = Migrate(app, db)
    
    # 注册蓝图
    app.register_blueprint(api)
    
    # 创建数据库表
    with app.app_context():
        db.create_all()
    
    return app

if __name__ == '__main__':
    app = create_app('development')
    app.run(host='0.0.0.0', debug=True, port=5000)
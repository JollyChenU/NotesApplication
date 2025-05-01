"""
@author Jolly
@date 2025-04-01
@description 主应用入口
@version 1.1.0
@license Apache-2.0
"""

from app import create_app

app = create_app('development')

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)
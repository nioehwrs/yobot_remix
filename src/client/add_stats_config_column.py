import os
from playhouse.sqlite_ext import SqliteExtDatabase
from ybplugins.ybdata import _db

data_path = os.path.join(os.path.dirname(__file__), 'yobot_data')
db_path = os.path.join(data_path, 'yobotdata_new.db')

_db.init(db_path)
_db.connect()

_db.execute_sql("ALTER TABLE clan_group ADD COLUMN stats_config TEXT DEFAULT NULL")
print('✅ stats_config 字段添加成功')

_db.close()

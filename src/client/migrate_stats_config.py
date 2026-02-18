import sqlite3

db_path = 'yobotdata_new.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 列出所有表
cursor.execute('SELECT name FROM sqlite_master WHERE type="table"')
tables = cursor.fetchall()
print('=== 数据库中的表 ===')
for table in tables:
    print(table[0])

# 检查 clan_group 表结构
print('\n=== 检查 clan_group 表 ===')
cursor.execute('PRAGMA table_info(clan_group)')
columns = cursor.fetchall()
for col in columns:
    print(f'{col[1]} ({col[2]})')

# 检查是否有 stats_config 列
has_stats_config = any(col[1] == 'stats_config' for col in columns)
print(f'\n是否有 stats_config 列: {has_stats_config}')

if not has_stats_config:
    print('\n准备添加 stats_config 列...')
    try:
        cursor.execute('ALTER TABLE clan_group ADD COLUMN stats_config TEXT')
        print('✅ 成功添加 stats_config 列')
    except Exception as e:
        print(f'❌ 添加列时出错: {e}')

conn.commit()
conn.close()
print('\n数据库操作完成')

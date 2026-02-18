# -*- coding: utf-8 -*-
import re

file_path = r"d:\yobot-remix\yobot_remix\src\client\public\static\clan\arrange.js"

with open(file_path, 'rb') as f:
    content = f.read()

content = content.replace(b'\xe9\x8f\x83\xef\xbf\xbd', b'\xe5\x91\xa8\xe7\x9b\xae')
content = content.replace(b'\xe9\x8f\x83\xe6\x9b\xbf\xe6\xb6\x85', b'\xe5\x8f\x96\xe6\xb6\x85')

with open(file_path, 'wb') as f:
    f.write(content)

print("Encoding fixes applied!")

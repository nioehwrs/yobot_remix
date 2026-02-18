# -*- coding: utf-8 -*-
import re

file_path = r"d:\yobot-remix\yobot_remix\src\client\public\static\clan\arrange.js"

with open(file_path, 'rb') as f:
    content = f.read()

replacements = {
    b'\xe9\x8f\x83': b'\xe5\x91\xa8\xe7\x9b\xae',
    b'\xe5\x8a\xa0\xe8\xbd\xbdboss\xe6\x95\xb0\xe6\x8d\xae\xe5\xa4\xb1\xe8\xb4\xa5': b'\xe5\x8a\xa0\xe8\xbd\xbdboss\xe6\x95\xb0\xe6\x8d\xae\xe5\xa4\xb1\xe8\xb4\xa5',
    b'\xe5\xbc\x80\xe5\xa7\x8b\xe5\x8a\xa0\xe8\xbd\xbd\xe5\x88\x80\xe5\x9e\x8b\xe6\x95\xb0\xe6\x8d\xae': b'\xe5\xbc\x80\xe5\xa7\x8b\xe5\x8a\xa0\xe8\xbd\xbd\xe5\x88\x80\xe5\x9e\x8b\xe6\x95\xb0\xe6\x8d\xae',
    b'\xe5\x88\x80\xe5\x9e\x8b\xe6\x95\xb0\xe6\x8d\xae': b'\xe5\x88\x80\xe5\x9e\x8b\xe6\x95\xb0\xe6\x8d\xae',
    b'\xe5\x8a\xa0\xe8\xbd\xbd\xe9\x94\x99\xe8\xaf\xaf': b'\xe5\x8a\xa0\xe8\xbd\xbd\xe9\x94\x99\xe8\xaf\xaf',
}

count = 0
for old_bytes, new_bytes in replacements.items():
    if old_bytes in content:
        content = content.replace(old_bytes, new_bytes)
        print(f"Replaced corrupted characters")
        count += 1

if count == 0:
    print("No corrupted characters found with exact matching, trying regex...")

    patterns = {
        b'\xe9\x8f\x83[?|\xef\xbf\xbd]': b'\xe5\x91\xa8\xe7\x9b\xae',
    }

    for pattern, replacement in patterns.items():
        new_content, sub_count = re.subn(pattern, replacement, content)
        if sub_count > 0:
            content = new_content
            print(f"Replaced {sub_count} occurrences using regex")
            count += sub_count

with open(file_path, 'wb') as f:
    f.write(content)

print(f"Total replacements: {count}")
print("Done!")

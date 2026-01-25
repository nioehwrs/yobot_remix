import math
import re
from typing import Dict, Union


class MergeBlade:
    Passive = True
    Active = False
    Request = False

    def __init__(self, glo_setting: dict, *args, **kwargs):
        self.setting = glo_setting

    @staticmethod
    def match(cmd: str) -> int:
        if cmd.startswith("合刀") or cmd.startswith("cal"):
            return 1
        return 0

    @staticmethod
    def parse_damage(damage_str: str) -> int:
        """解析伤害数值，支持纯数值或带w（万）的格式"""
        if not damage_str:
            return 0
        damage_str = damage_str.strip().lower()
        if 'w' in damage_str:
            try:
                return int(float(damage_str.replace('w', '')) * 10000)
            except ValueError:
                return 0
        else:
            damage = int(damage_str)
            if damage < 999999:
                return damage * 10000
            return damage

    def calculate_compensation(self, current_hp: int, first_damage: int, second_damage: int) -> int:
        """计算补偿时间，单位：秒"""
        if second_damage == 0:
            return 0
        remaining_hp = current_hp - first_damage
        if remaining_hp < 0:
            remaining_hp = 0
        compensation = 110 - (remaining_hp / second_damage) * 90
        compensation = math.ceil(compensation)
        if compensation < 0:
            compensation = 0
        elif compensation > 90:
            compensation = 90
        return compensation

    def format_damage(self, damage: int) -> str:
        """格式化伤害数值显示"""
        if damage >= 10000:
            return f"{damage // 10000}w"
        return str(damage)

    def execute(self, match_num: int, msg: Dict) -> Union[str, None]:
        if match_num != 1:
            return None

        cmd = msg.get("raw_message", "").strip()

        match_pattern = re.match(
            r'^(?:合刀|cal)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)$',
            cmd
        )

        if not match_pattern:
            return "格式错误，请使用：合刀 [当前血量] [伤害1] [伤害2]\n例如：合刀 2000w 1800w 1500w"

        try:
            current_hp_str = match_pattern.group(1)
            damage1_str = match_pattern.group(2)
            damage2_str = match_pattern.group(3)

            current_hp = self.parse_damage(current_hp_str)
            damage1 = self.parse_damage(damage1_str)
            damage2 = self.parse_damage(damage2_str)

            if current_hp <= 0:
                return "当前血量必须大于0"

            if damage1 <= 0 or damage2 <= 0:
                return "伤害值必须大于0"

            comp1 = self.calculate_compensation(current_hp, damage1, damage2)
            comp2 = self.calculate_compensation(current_hp, damage2, damage1)

            format_damage1 = self.format_damage(damage1)
            format_damage2 = self.format_damage(damage2)

            response_lines = [
                f"boss血量={self.format_damage(current_hp)}",
                f"对boss伤害={format_damage1} | {format_damage2}",
                f"若[{damage1}]先出，[{damage2}]后出，补偿{comp1}s",
                f"若[{damage2}]先出，[{damage1}]后出，补偿{comp2}s",
            ]

            return "\n".join(response_lines)

        except Exception as e:
            return f"计算错误：{str(e)}"

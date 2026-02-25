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
        if first_damage + second_damage < current_hp:
            return -1
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

    def calculate_full_compensation_damage(self, current_hp: int) -> str:
        """计算满补所需伤害（1-6刀）"""
        lines = [f"HP={current_hp}", "刀数 / 满补所需伤害"]

        for x in range(1, 7):
            denominator = x - 1 + 21 / 90
            full_compensation_damage = math.floor(current_hp / denominator) + 1
            lines.append(f"{x}刀      {full_compensation_damage}")

        return "\n".join(lines)

    def calculate_one_damage_compensation(self, current_hp: int, damage1: int) -> str:
        """计算单伤害的合刀满补所需伤害"""
        second_damage_if_first = math.floor((current_hp - damage1) / (21 / 90)) + 1
        first_damage_if_second = math.floor(current_hp - damage1 * (21 / 90)) + 1

        first_note = "（高于boss血量）才能满补" if second_damage_if_first > current_hp else "可满补"
        second_note = "可满补" if first_damage_if_second <= current_hp else "才能满补"

        response_lines = [
            f"boss血量={current_hp}",
            f"对boss伤害={damage1}",
            f"若[{damage1}]先出，后出刀需{second_damage_if_first}伤害{first_note}",
            f"若[{damage1}]后出，先出刀需{first_damage_if_second}伤害{second_note}",
        ]

        return "\n".join(response_lines)

    def execute(self, match_num: int, msg: Dict) -> Union[str, None]:
        if match_num != 1:
            return None

        cmd = msg.get("raw_message", "").strip()

        two_damage_pattern = re.match(
            r'^(?:合刀|cal)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)$',
            cmd
        )

        if two_damage_pattern:
            try:
                current_hp_str = two_damage_pattern.group(1)
                damage1_str = two_damage_pattern.group(2)
                damage2_str = two_damage_pattern.group(3)

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

                if comp1 < 0 or comp2 < 0:
                    remaining_hp = current_hp - damage1 - damage2
                    response_lines = [
                        f"boss血量={self.format_damage(current_hp)}",
                        f"对boss伤害={format_damage1} | {format_damage2}",
                        f"剩余{remaining_hp}血",
                    ]
                else:
                    response_lines = [
                        f"boss血量={self.format_damage(current_hp)}",
                        f"对boss伤害={format_damage1} | {format_damage2}",
                        f"若[{damage1}]先出，[{damage2}]后出，补偿{comp1}s",
                        f"若[{damage2}]先出，[{damage1}]后出，补偿{comp2}s",
                    ]

                return "\n".join(response_lines)

            except Exception as e:
                return f"计算错误：{str(e)}"

        one_damage_pattern = re.match(
            r'^(?:合刀|cal)\s+(\d+\.?\d*)\s+(\d+\.?\d*)$',
            cmd
        )

        if one_damage_pattern:
            try:
                current_hp_str = one_damage_pattern.group(1)
                damage1_str = one_damage_pattern.group(2)

                current_hp = self.parse_damage(current_hp_str)
                damage1 = self.parse_damage(damage1_str)

                if current_hp <= 0:
                    return "当前HP必须大于0"

                if damage1 <= 0:
                    return "伤害值必须大于0"

                return self.calculate_one_damage_compensation(current_hp, damage1)

            except Exception as e:
                return f"计算错误：{str(e)}"

        single_hp_pattern = re.match(
            r'^(?:合刀|cal)\s+(\d+\.?\d*)$',
            cmd
        )

        if single_hp_pattern:
            try:
                current_hp_str = single_hp_pattern.group(1)
                current_hp = self.parse_damage(current_hp_str)

                if current_hp <= 0:
                    return "当前HP必须大于0"

                return self.calculate_full_compensation_damage(current_hp)

            except Exception as e:
                return f"计算错误：{str(e)}"

        return "格式错误，请使用：\n合刀 [当前血量] [伤害1] [伤害2] - 计算补偿时间\n合刀 [当前血量] [伤害1] - 计算单伤害合刀\n合刀 [当前血量] - 计算满补所需伤害\n例如：合刀 2000w 1800w 1500w\n例如：合刀 176120000"

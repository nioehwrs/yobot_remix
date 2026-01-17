#!/usr/bin/bash
# yobotd.sh  后台守护壳（支持.YOBOT_RESTART自重启）
cd "$(dirname "$0")"          # 保证在 client 目录里
echo $$ > yobotd.pid          # 壳本身的 PID，想记 main 的 PID 见下

while true; do
    # 真正跑 yobot 的后台进程
    nohup python3 main.py -g >>yobot.log 2>&1 &
    MAIN_PID=$!
    echo $MAIN_PID > yobot.pid
    wait $MAIN_PID            # 等它退出
    if [ ! -f .YOBOT_RESTART ]; then
        break                 # 正常退出，不再重启
    fi
    rm -f .YOBOT_RESTART
    echo "[$(date)] 检测到 .YOBOT_RESTART，准备重启..." >>yobot.log
done
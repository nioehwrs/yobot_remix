#!/usr/bin/bash
kill $(cat yobot.pid)   # 先停 main
kill $(cat yobotd.pid)  # 再停壳（如有）
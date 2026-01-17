
echo $$ > yobotg.pid
loop=true
while $loop
do
    loop=false
    python3 main.py -g
    if [ -f .YOBOT_RESTART ]
    then
        loop=true
        rm .YOBOT_RESTART
    fi
done

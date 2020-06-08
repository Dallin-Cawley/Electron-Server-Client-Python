#!/bin/sh

if pgrep -f "python3 server">/dev/null; then
    PID=$(pgrep -f "python3 server")
    kill $PID
    fuser -k 10000/tcp
fi

cd ..
git pull origin master
cd python_scripts
python3 server.py
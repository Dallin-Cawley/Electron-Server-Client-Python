#!/bin/sh
echo "Retrieving Update from Repository"

while :
do
if pgrep -f "python3 server" >/dev/null; then
    echo "Shutting down server"
    fuser -k 10000/tcp
else
    break
fi

done

cd ..
git pull origin master
cd python_scripts

fuser -k 8001/tcp
python3 server.py
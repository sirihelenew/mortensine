#!/bin/bash
while ! ping -c 1 -W 1 8.8.8.8; do
    echo "Waiting for 8.8.8.8 - network interface might be down..."
    sleep 1
done
git pull
if [ -z "$VIRTUAL_ENV" ]
then
    source myvenv/bin/activate
fi
pip install -r requirements.txt
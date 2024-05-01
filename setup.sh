#!/bin/bash
git pull
if [ -z "$VIRTUAL_ENV" ]
then
    source myvenv/bin/activate
fi
pip install -r requirements.txt
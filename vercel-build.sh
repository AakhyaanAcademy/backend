#!/bin/bash

if [[ $(git branch --show-current) -eq "prod" || $(git branch --show-current) -eq "mcq" ]]; then
	exit 1
else
	exit 0
fi

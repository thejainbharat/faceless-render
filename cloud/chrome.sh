#!/bin/bash
# Chrome for GitHub's Linux machines. It only ever opens our own project files from 127.0.0.1.
exec /usr/bin/google-chrome --no-sandbox --disable-dev-shm-usage "$@"

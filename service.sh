#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_SCRIPT="$APP_DIR/app.py"
PID_FILE="$APP_DIR/.service.pid"
LOG_FILE="$APP_DIR/.service.log"

usage() {
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
}

get_pid() {
    if [ -f "$PID_FILE" ]; then
        cat "$PID_FILE"
    fi
}

is_running() {
    local pid
    pid=$(get_pid)
    [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null
}

do_start() {
    if is_running; then
        echo "Service is already running (PID $(get_pid))"
        return 0
    fi

    if [ ! -f "$APP_SCRIPT" ]; then
        echo "Error: $APP_SCRIPT not found"
        exit 1
    fi

    echo "Starting service..."
    nohup python3 "$APP_SCRIPT" >> "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"

    sleep 1
    if is_running; then
        echo "Service started (PID $(get_pid))"
        echo "Log file: $LOG_FILE"
    else
        echo "Error: Service failed to start. Check $LOG_FILE"
        rm -f "$PID_FILE"
        exit 1
    fi
}

do_stop() {
    if ! is_running; then
        echo "Service is not running"
        rm -f "$PID_FILE"
        return 0
    fi

    local pid
    pid=$(get_pid)
    echo "Stopping service (PID $pid)..."
    kill "$pid"

    local timeout=10
    while [ $timeout -gt 0 ] && kill -0 "$pid" 2>/dev/null; do
        sleep 1
        timeout=$((timeout - 1))
    done

    if kill -0 "$pid" 2>/dev/null; then
        echo "Graceful shutdown timed out, forcing..."
        kill -9 "$pid" 2>/dev/null || true
    fi

    rm -f "$PID_FILE"
    echo "Service stopped"
}

do_status() {
    if is_running; then
        echo "Service is running (PID $(get_pid))"
    else
        echo "Service is not running"
        rm -f "$PID_FILE"
    fi
}

if [ $# -ne 1 ]; then
    usage
fi

case "$1" in
    start)   do_start   ;;
    stop)    do_stop    ;;
    restart) do_stop; do_start ;;
    status)  do_status  ;;
    *)       usage      ;;
esac

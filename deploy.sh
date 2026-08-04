#!/bin/bash
set -e

OCF_USER="beetleinabox"
OCF_HOST="apphost.ocf.berkeley.edu"
REMOTE_DIR="/home/b/be/beetleinabox/myapp/src"
# This script now lives inside the app repo, so its own directory IS the app dir.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOCAL_DIR="$SCRIPT_DIR"

echo "Deploying Beetle in a Box to OCF..."

# Sync source files (skip build artifacts, uploads, secrets)
echo "Syncing files..."
rsync -az --progress \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='uploads' \
    --exclude='.env*' \
    --exclude='.DS_Store' \
    --exclude='.git' \
    --exclude='tests' \
    "$LOCAL_DIR/" \
    "$OCF_USER@$OCF_HOST:$REMOTE_DIR/"

# SSH in, build, and restart
echo "Building and restarting on OCF..."
ssh "$OCF_USER@$OCF_HOST" 'bash -s' << 'ENDSSH'
set -e

cd ~/myapp/src

# Load nvm + Node.js (Bun doesn't work on OCF's old glibc)
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"

echo "--> Installing dependencies..."
npm install

echo "--> Generating Prisma client..."
npx prisma generate

echo "--> Building Next.js app..."
npx next build

echo "--> Restarting service..."
systemctl --user restart myapp

echo "--> Status:"
systemctl --user status myapp --no-pager
ENDSSH

echo "Deploy complete! Visit https://beetleinabox.studentorg.berkeley.edu"

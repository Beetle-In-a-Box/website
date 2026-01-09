#!/bin/bash

# Get Railway's public database URL
PUBLIC_DB_URL=$(railway variables --kv | grep DATABASE_URL_PUBLIC | cut -d'=' -f2)

# Fallback: try to get regular DATABASE_URL and convert internal to public
if [ -z "$PUBLIC_DB_URL" ]; then
    echo "Getting Railway database URL..."
    # You'll need to set this manually or get it from Railway dashboard
    echo "Please provide the public Railway database URL:"
    read PUBLIC_DB_URL
fi

# Run the clear script with the public URL
DATABASE_URL="$PUBLIC_DB_URL" bun run db:clear

#!/bin/bash
# Quick script to get your app URL in Codespaces

PORT=5173

if [ -n "$CODESPACE_NAME" ]; then
  echo "🚀 Your app is running at:"
  echo "https://${CODESPACE_NAME}-${PORT}.app.github.dev/"
else
  echo "Local development:"
  echo "http://localhost:${PORT}/"
fi

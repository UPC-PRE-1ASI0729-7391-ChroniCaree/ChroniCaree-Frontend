#!/bin/bash
npx json-server --watch server/db.json --routes server/routes.json --port ${PORT:-3000}
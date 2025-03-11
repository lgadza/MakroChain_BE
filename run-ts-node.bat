@echo off
set NODE_OPTIONS=--experimental-specifier-resolution=node --loader ts-node/esm
ts-node --esm %*

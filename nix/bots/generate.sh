#!/usr/bin/env sh

node2nix \
     --input ../../packages/bots/package.json \
     --output ./node-packages-generated.nix \
     --composition ./node-packages.nix \
     --node-env ../node-env.nix
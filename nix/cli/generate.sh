#!/usr/bin/env sh

node2nix \
     --input ../../packages/cli/package.json \
     --output ./node-packages-generated.nix \
     --composition ./node-packages.nix \
     --node-env ../node-env.nix
#!/usr/bin/env sh

node2nix \
     --input ./package-without-bots.json \
     --output ./node-packages-generated.nix \
     --composition ./node-packages.nix \
     --node-env ../node-env.nix
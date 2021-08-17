{
  description = "";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-unstable";
    nixpkgsOld.url = "nixpkgs/nixos-unstable";
  };

  outputs = { nixpkgs, ... }@inp: 
    let 
      lib = nixpkgs.lib;
      supportedSystems = [ "x86_64-linux" ];
    in
    lib.foldl' lib.recursiveUpdate {} (lib.forEach supportedSystems (system: 
      let 
        pkgs = nixpkgs.legacyPackages."${system}";
      in
      {
        # packages."${system}".sonar-bots = import 
        devShell."${system}" = pkgs.mkShell {
          buildInputs = [ pkgs.nodePackages.node2nix ];
        };

        packages."${system}" = {

          # The two main packages we want to build are `server` and `cli`

          cli = (pkgs.callPackage ./nix/cli/node-packages.nix {}).package;

          # My idea here is:
          #  - remove bots from packaage.json (otherwise node2nix crashes)
          #  - run node2nix on the modified package.json
          #  - TODO: manually build the bots package and add it back via override
          server = (pkgs.callPackage ./nix/server/node-packages.nix {}).package;

          # bots is a dependency of server but is missing from npm repo.
          # we need to build it ourselves
          bots = (pkgs.callPackage ./nix/bots/node-packages.nix {}).package;

          # sonar/server -> sonar/core -> sonar/plugin-search -> sonar-tantivy -> tantivy (rust)

          sonar-tantivy = pkgs.rustPlatform.buildRustPackage rec {
            pname = "sonar-tantivy";
            version = "master";
            src = pkgs.fetchFromGitHub {
              owner = "ngi-nix";
              repo = pname;
              rev = "0a1a730898e4e41fb797b08e2dccff3f20bbd55b";
              sha256 = "sha256-s6whnf8ymsoxyTKq1RED4Be0/nT9lIqj5JWsRkKKMps=";
            };
            cargoSha256 = "sha256-Jk7QC95WzEIQgBBuoD6QJwkzDASIwHoP8szBEfNBoFk=";
          };
        };

      }
    ));
}
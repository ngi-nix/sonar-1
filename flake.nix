{
  description = "";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-unstable";
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
          # probably we don't need to build tantivy itself.
          # tantivy seems to be a library, not a program (this derivaiton results in no output)
          # we just need to build sonar-tantivy which requires the source of the tantivy lib
          # TODO: remove this derivation and instead build sonar-tantivy
          tantivy = pkgs.rustPlatform.buildRustPackage rec {
            pname = "tantivy";
            version = "main";
            src = pkgs.fetchFromGitHub {
              owner = "ngi-nix";
              repo = pname;
              rev = "63924b59c604086e688bf3b4072e24fe0b130959";
              sha256 = "sha256-5OpeSBAIB3afjJ/rnK3Cf+LBtTfb4emQESMA1kwL7Fo=";
            };
            cargoSha256 = "sha256-xqwZ8Wcyb5+VQe5bYTb0JM0gP3uBwNo3nFdyLa4CpMA=";
          };
        };

      }
    ));
}
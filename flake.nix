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
          #  - remove bots from package.json (otherwise node2nix crashes)
          #  - run node2nix on the modified package.json
          #  - TODO: manually build the bots package and add it back via override
          server = 
            let

              # bots is a dependency of server but is missing from npm repo.
              # we need to build it ourselves
              bots = (pkgs.callPackage ./nix/bots/node-packages.nix {}).package;

              # extension for the install.js to use rust binaries built via nix
              sonarTantivyFakeBuild = pkgs.writeText "fake-install.js" ''
                function buildRelease (opts, cb) {
                  const { binaries, dest } = opts
                  cb = once(cb)
                  const srcPath = p.join('${sonar-tantivy-rust}/bin')
                  copyFiles(binaries, srcPath, dest, cb)
                }
              '';

              sonar-tantivy-rust =
                let 
                  srcOriginal = pkgs.fetchFromGitHub {
                    owner = "arso-project";
                    repo = "sonar-tantivy";
                    rev = "v0.2.14";
                    sha256 = "sha256-NdvoF46TQYxfbViGCOpGFDxrIL/6ChkPAK9Xs9yyoIU=";
                  };
                  src = pkgs.runCommand "sonar-tantivy-patched" {} ''
                    cp -r ${srcOriginal} $out
                    chmod +w $out
                    cp ${./nix/sonar-tantivy/Cargo.lock} $out/Cargo.lock
                  '';
                in
                pkgs.rustPlatform.buildRustPackage rec {
                  pname = "sonar-tantivy";
                  version = "master";
                  inherit src;
                  cargoSha256 = "sha256-BbdLzxOG71DVVW8D5RF90XBlsfTYOsldkqF58Nb3HUM=";
                };
            in
          
            (pkgs.callPackage ./nix/server {}).package.override (old: {

              src = "${./packages/server}";
              
              dependencies = lib.forEach old.dependencies (source:
                if source.name == "_at_arso-project_slash_sonar-tantivy" then
                  source // {
                    # TODO: build tarball with modified install.js
                    src = pkgs.runCommand "sonar-tantivy-patched-installer.tar" {} ''
                      mkdir unpacked
                      tar -xf ${source.src} -C unpacked
                      cat ${sonarTantivyFakeBuild} >> ./unpacked/package/scripts/install.js
                      cd unpacked
                      tar -cf $out ./.
                    '';
                  }
                else
                  source
              );
              
              buildInputs = old.buildInputs ++ (with pkgs; [
                nodePackages.node-gyp-build
                # TODO: this doesn't seem to work it still tries to fetch bots
                bots
              ]);
          });

        };

      }
    ));
}
{
  description = "";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-unstable";
  };

  outputs = { nixpkgs, ... }: 
    let 
      lib = nixpkgs.lib;
      supportedSystems = [ "x86_64-linux" ];
      overlay = final: prev: sonarPackages final;
      sonarTantivySrc = pkgs:  pkgs.fetchFromGitHub {
          owner = "arso-project";
          repo = "sonar-tantivy";
          rev = "v0.2.14";
          sha256 = "sha256-NdvoF46TQYxfbViGCOpGFDxrIL/6ChkPAK9Xs9yyoIU=";
        };
      sonarPackages = pkgs: {
        # The two main packages we want to build are `server` and `cli`

        sonar-cli = (pkgs.callPackage ./nix/cli {}).package.override (old: {
          postInstall = ''
            mkdir -p $out/bin
            ln -s $out/lib/node_modules/@arsonar/cli/cli.js $out/bin/cli
          '';
        });

        sonar-server = 
          let

            # patch for install.js to use rust binaries built via nix
            sonarTantivyFakeBuild = pkgs.writeText "fake-install.js" ''
              function buildRelease (opts, cb) {
                const { binaries, dest } = opts
                cb = once(cb)
                const srcPath = p.join('${sonar-tantivy-rust}/bin')
                copyFiles(binaries, srcPath, dest, cb)
              }
            '';

            # the rust part of the sonar-tantivy package
            sonar-tantivy-rust =
              let 
                src = pkgs.runCommand "sonar-tantivy-patched" {} ''
                  cp -r ${sonarTantivySrc pkgs} $out
                  chmod +w $out
                  cp ${./nix/sonar-tantivy/Cargo.lock} $out/Cargo.lock
                '';
              in
              pkgs.rustPlatform.buildRustPackage {
                pname = "sonar-tantivy";
                version = "master";
                inherit src;
                cargoSha256 = "sha256-YWra20ZPotzbGn+H7CywE7jXLa5pmVCkP7jQzwpuJYc=";
              };
          in

          (pkgs.callPackage ./nix/server {}).package.override (old: {

            # use the source of server with modified package.json
            src = pkgs.runCommand "sonar-server-src" {} ''
              cp -r ${./packages/server} $out
              chmod +w $out/package.json
              cp ${./nix/server/package.json} $out/package.json
            '';

            # replace sonar-tantivy source with patched source
            dependencies = lib.forEach old.dependencies (source:
              if source.name == "_at_arso-project_slash_sonar-tantivy" then
                source // {
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
            ]);
        });
      };
    in
    rec {

      nixosModules.sonar = import ./nix/module.nix;

      nixosModule = nixosModules.sonar;

    } //
    lib.foldl' lib.recursiveUpdate {} (lib.forEach supportedSystems (system: 
      let 
        pkgs = import nixpkgs { inherit system; overlays = [ overlay ]; };
      in
      rec {

        devShell."${system}" = pkgs.mkShell {
          buildInputs = [ pkgs.nodePackages.node2nix ];
        };

        packages."${system}" = sonarPackages pkgs;

        # This app helps updating the autogenerated nix code
        apps."${system}".update-nix = {
          type = "app";
          program = builtins.toString (pkgs.writeScript "update-nix" ''
            export PATH="${pkgs.lib.makeBinPath (with pkgs; [
              bash
              cargo
              coreutils
              git
              nodePackages.node2nix
              yq
            ])}"

            # # update nix code for cli
            # pushd ./nix/cli
            # node2nix --input ../../packages/cli/package.json
            # popd

            # update nix code for server
            pushd ./nix/server
            # yq '.dependencies."@arsonar/bots" = "file:../../packages/bots" | .dependencies."@arsonar/ui" = "file:../../packages/ui"' \
            yq '.dependencies."@arsonar/bots" = "file:../../packages/bots"' \
              ../../packages/server/package.json \
              > package.json
            node2nix --input ./package.json
            popd

            # # generate cargo lock for sonar-tantivy
            # pushd ./nix/sonar-tantivy
            # cp ${sonarTantivySrc pkgs}/Cargo.toml ./Cargo.toml
            # tomlq '.dependencies.serde_json.version = "=1.0.56"| .dependencies.serde.version = "=1.0.118"' Cargo.toml --toml-output > Cargo.toml.new
            # mv -f Cargo.toml.new Cargo.toml
            # cargo generate-lockfile
            # popd
          '');
        };

      }
    ));
}
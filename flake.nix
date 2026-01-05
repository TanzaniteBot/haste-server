{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    systems.url = "github:nix-systems/default";
  };

  outputs =
    {
      nixpkgs,
      systems,
      ...
    }:
    let
      inherit (nixpkgs) lib legacyPackages;
      allSystems = import systems;
      eachPkgs = f: lib.genAttrs allSystems (s: f (legacyPackages.${s}));
    in
    {
      devShells = eachPkgs (pkgs: {
        default = pkgs.mkShell {
          buildInputs = with pkgs; [
            redis
          ];
          RUST_SRC_PATH = pkgs.rustPlatform.rustLibSrc;
        };
      });
    };
}

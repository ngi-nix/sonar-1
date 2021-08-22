{ pkgs, ... }:
{
  systemd.services.sonar = {
    description = "A p2p content database and search engine";
    ExecStart = "${pkgs.sonar-server}/bin/sonar start";
  };
}

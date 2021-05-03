#!/usr/bin/env bash
apt-get update
apt-get dist-upgrade -y
apt-get install -y wget git
wget https://github.com/cli/cli/releases/download/v1.1.0/gh_1.1.0_linux_amd64.deb
dpkg -i gh_1.1.0_linux_amd64.deb
rm gh_1.1.0_linux_amd64.deb
git config --global user.email "72741684+ldso2020-t4g2@users.noreply.github.com"
git config --global user.name "LDSO 2020/2021 T4G2 Bot"
gh config set prompt disabled

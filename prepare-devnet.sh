#!/usr/bin/env bash

# Prepare a "devnet" directory holding credentials, a dummy topology and
# "up-to-date" genesis files. If the directory exists, it is wiped out.
set -e

BASEDIR=$(realpath $(dirname $(realpath $0)))
echo "BASEDIR" $BASEDIR
TARGETDIR="devnet"
KUPODBDIR="kupo-db"
DBSYNCDATADIR="db-sync-data"
POSTGRESDIR="postgres"
BASEINFODIR="baseinfo"

SUDO=""
if sudo --version > /dev/null 2>&1; then
  SUDO="sudo"
fi

[ -d "$TARGETDIR" ] && { echo "Cleaning up directory $TARGETDIR" ; ${SUDO} rm -r $TARGETDIR ; }
[ -d "$KUPODBDIR" ] && { echo "Cleaning up directory $KUPODBDIR" ; ${SUDO} rm -r $KUPODBDIR ; }
[ -d "$DBSYNCDATADIR" ] && { echo "Cleaning up directory $DBSYNCDATADIR" ; ${SUDO} rm -r $DBSYNCDATADIR ; }
[ -d "$POSTGRESDIR" ] && { echo "Cleaning up directory $POSTGRESDIR" ; ${SUDO} rm -r $POSTGRESDIR ; }
[ -d "$BASEINFODIR" ] && { echo "Cleaning up directory $BASEINFODIR" ; ${SUDO} rm -r $BASEINFODIR ; }

cp -af "$BASEDIR/config/devnet/" "$TARGETDIR"
cp -af "$BASEDIR/config/credentials" "$TARGETDIR"
cp -af "$BASEDIR/config/protocol-parameters.json" "$TARGETDIR"
echo '{"Producers": []}' > "$TARGETDIR/topology.json"
sed -i.bak "s/\"startTime\": [0-9]*/\"startTime\": $(date +%s)/" "$TARGETDIR/genesis-byron.json" && \
sed -i.bak "s/\"systemStart\": \".*\"/\"systemStart\": \"$(date -u +%FT%TZ)\"/" "$TARGETDIR/genesis-shelley.json"

find $TARGETDIR -type f -exec chmod 0400 {} \;
mkdir "$TARGETDIR/ipc"
echo "Prepared devnet, you can start the cluster now"


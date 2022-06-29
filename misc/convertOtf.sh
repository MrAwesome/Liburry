#!/usr/bin/env bash

# yay -S eot-utilities sfnt2woff woff2
#
# git clone https://github.com/umanwizard/libeot.git
# # Follow installation instructions and add to PATH

set -e

SOURCE=$1
DESTINATION=$2
FILENAME=$(basename "${SOURCE%.otf}")

# we omit mime check since we use this script only locally and assume it's otf
if [[ ${SOURCE: -4} != ".otf" ]]; then
  echo "usage: convertOtf input.otf /path/to/output/"
  exit 1
fi

# check the destination is a folder
if [[ ! -d "$DESTINATION" ]]; then
  echo "usage: convertOtf input.otf /path/to/output/"
  exit 1
fi

ALLCOMMANDS=(
  mkeot
  eot2ttf
  sfnt2woff
  woff2_compress
)

# iterate the ALLCOMMANDS list to check for each required command
# skip as soon as a command is not found
for CMD in "${ALLCOMMANDS[@]}"
do
   :
   if [[ ! -f $(command -v "$CMD") ]];then
        echo "Cannot convert ($CMD). The following packages are required: eot-utils eot2ttf woff-tools woff2"
        exit 1
    fi
done

EOT_PATH="$DESTINATION/$FILENAME.eot"
echo "[OTF ---> EOT]: (over-)write to $EOT_PATH"
mkeot ${SOURCE} > ${EOT_PATH}

TTF_PATH="$DESTINATION/$FILENAME.ttf"
echo "[EOT ---> TTF]: (over-)write to $TTF_PATH"
eot2ttf ${EOT_PATH} ${TTF_PATH}

WOFF_PATH="$DESTINATION/$FILENAME.woff"
echo "[OTF --> WOFF]: (over-)write to $WOFF_PATH"
sfnt2woff ${SOURCE} > ${WOFF_PATH}

WOFF2_PATH="$DESTINATION/$FILENAME.woff2"
echo "[TTF -> WOFF2]: (over-)write to $WOFF2_PATH"
woff2_compress ${TTF_PATH} > ${WOFF2_PATH}

exit 0

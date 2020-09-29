#!/bin/bash
# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -e
set -u

#
# Reads from the supplied file and exports
# variables to the environment
# --------------------------------------------
function export_envs(){
  local envFile=${1:-'.env'}

  while IFS='=' read -r key temp || [ -n "$key" ]; do
    local isComment='^[[:space:]]*#'
    local isBlank='^[[:space:]]*$'
    [[ $key =~ $isComment ]] && continue
    [[ $key =~ $isBlank ]] && continue
    value=$(eval echo "$temp")
    eval export "$key='$value'";
  done < "${envFile}"
}

#
# Read values from ini (or .env)
#
# $1	= (string) Parameter to be retrieved from INI file
# $2	= (string) INI file to parse.
#
# @return (string) Retrieved value from INI
# --------------------------------------------
function ini_read(){
  local param=${1}
  local ini_file=${2:-$ini_file}
  local value=""
  local e_param=$(echo $param | sed 's/[^[:alnum:]_-]/\\&/g' )


  if [ ! -f "$ini_file" ]; then
    return
  fi

  value=$( cat "$ini_file" | sed -n "s/^$e_param[[:space:]]*=[[:space:]]*\(.*\)/\1/gp" )
  echo $value
}



#
# Write values to an ini (or .env) file. If they already
# exist, lets update them.
#
# $1	= (string) Parameter to write to the INI file
# $2	= (string) Value Parameter should be set to
# $3	= (string) INI file to write
# $4	= (boolean) [true] Write value if it doesn't exist
# --------------------------------------------
ini_write(){
  local param=${1}
  local new_value=${2}
  local ini_file=${3:-'.env'}
  local auto_write=${4:-true}

  local curr_value=""

  if [ ! -f "$ini_file" ] && [ "$auto_write" == true ]; then
      touch "$ini_file"
  fi

  local e_param=$(echo $param | sed 's/[^[:alnum:]_-]/\\&/g' )
  local e_new_value=$(echo $new_value | sed 's/[^[:alnum:]_-]/\\&/g' )

  curr_value=`ini_read "$param" "$ini_file"`

  # Put a new line at the end of the file
  # if one doesn't exist.
  # sed -i '' -e '$a\' "$ini_file"

  # Check to see if this is an existing value, or if its a new one.
  # Add at the end if its new, replace if it exits.
  if [ $auto_write ] && [ -z "$curr_value" ]; then
    echo "$param=$new_value" >> "$ini_file"
  else
    #sed -i '' -e "s/^\($e_param\)\([[:space:]]*\)=\([[:space:]]\)*\(.*\)/\1=$e_new_value/g" "$ini_file"
    sed -e "s/^\($e_param\)\([[:space:]]*\)=\([[:space:]]\)*\(.*\)/\1=$e_new_value/g" "$ini_file" > tmp && mv tmp "$ini_file"
  fi
}


#
# Get the current script dir
# --------------------------------------------
declare PROJECT_DIR=$(cd "$(dirname $0)/../"; pwd -P)

#
# See if there's a NODE_ENV variable set
# --------------------------------------------
declare NODE_ENV=${NODE_ENV:-''}

#
# Process .env file
# --------------------------------------------
[ -f "${PROJECT_DIR}/.env" ] && \
  export_envs "${PROJECT_DIR}/.env"

#
# Process target .env file
# --------------------------------------------
if [ -n "${NODE_ENV}" ]; then
  [ "${NODE_ENV}" = 'development' ] && \
    NODE_ENV='dev'

  [ "${NODE_ENV}" = 'production' ] && \
    NODE_ENV='prod'

  [ -f "${PROJECT_DIR}/.env.${NODE_ENV}" ] && \
    export_envs "${PROJECT_DIR}/.env.${NODE_ENV}"
fi

declare VERSION_HASH=`git rev-parse --short HEAD`
declare VERSION_NUMBER=${VERSION:-'1.0.0-dev'}

#
# Write firebase .env file
# (only put envars here that the firebase function needs)
# --------------------------------------------

cat > "${PROJECT_DIR}/functions/.env" <<EOL
GOOGLE_HOSTING_URL=${GOOGLE_HOSTING_URL}
VERSION=${VERSION_HASH}
EOL

#
# Write the SPA .env file
# (only put envars here that the spa site needs)
# --------------------------------------------
if [ -f "${PROJECT_DIR}/.env" ]; then
  ini_write \
    "VUE_APP_VERSION" \
    "'${VERSION_NUMBER} (${VERSION_HASH})'" \
    "${PROJECT_DIR}/.env"
else
  cat > "${PROJECT_DIR}/.env" <<EOL
VUE_APP_VERSION='${VERSION_NUMBER} (${VERSION_HASH})'
EOL
fi


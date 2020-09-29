/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module.exports = ( globalOpts = {} ) => {
  const chalk = require( 'chalk' );
  const moment = require( 'moment' );

  const globalPrefix = globalOpts.prefix;
  const globalColor = globalOpts.color;

  const output = ( opts ) => {
    const { prefix, type, args } = opts;
    const ts = moment().format( 'HH:mm:ss' );

    let color = 'gray';
    let logPrefix = prefix || globalPrefix || ts;

    switch ( type ) {
      case 'Info': color='blue'; break;
      case 'Debug': color='magenta'; break;
      case 'Warning': color='yellow'; break;
      case 'Error': color='red'; break;
    }

    // If its set, override with globalColor
    color = globalColor || color;

    if ( type !== 'Log' ) {
      logPrefix = chalk`[{gray ${logPrefix}}] {${color} ${type}:}`;
    } else {
      logPrefix = chalk`[{gray ${logPrefix}}]`;
    }
    console.log( logPrefix, ...args );
  };

  const parseArgs = ( type, ...args ) => {
    const obj = { type };
    let loggerOpts = false;

    if ( typeof args[ 0 ] === 'object' ) {
      const logOpts = args[ 0 ];

      [ 'prefix', 'fnName' ].map( ( prop ) => {
        if ( logOpts[ prop ] ) {
          obj[ prop ] = logOpts

          loggerOpts = true;
        }
      });

      // Only delete the first argument if this object
      // had settings for the logger.
      if ( loggerOpts ) args.unshift();
    }

    obj.args = args;

    return obj;
  };

  return {
    log: ( ...args ) =>
      output( parseArgs( 'Log', ...args ) ),
    info: ( ...args ) =>
      output( parseArgs( 'Info', ...args ) ),
    warning: ( ...args ) =>
      output( parseArgs( 'Warning', ...args ) ),
    debug: ( ...args ) =>
      output( parseArgs( 'Debug', ...args ) ),
    error: ( ...args ) =>
      output( parseArgs( 'Error', ...args ) ),
  };
};
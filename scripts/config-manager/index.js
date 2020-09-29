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

let envFile = '';

switch (process.env.NODE_ENV) {
  case 'development':
  case 'dev':
    envFile='.env.dev';
    break;
  case 'production':
  case 'prod':
    envFile='.env.prod';
    break;
  default:
    envFile='.env';
}

console.log(`Environment File: ${envFile}`);
require('dotenv').config({path: `${__dirname}/../../${envFile}`});

const {src, series, parallel, dest} = require('gulp');
const {exec} = require( 'child_process' );
const clean = require('gulp-clean');
const modifyFile = require('gulp-modify-file');
const jsYaml = require('js-yaml');
const yamlOptions = {noArrayIndent: true, lineWidth: 120};
const SRC_CONFIG_DIR = '../../sdk';
const DIST_DIR = '../../dist';
const DIST_CONFIG_DIR = '../../dist/sdk';

const answers = require('./data/answers.json');

/**
 * @return {Promise} Return a pipe promise
 */
const cleanTask = () =>
  src( `${DIST_DIR}/*` ).pipe(clean({force: true}));


/**
 * @return {Promise} Return a pipe promise
 */
const copyConfigsTask = () =>
  src([
    `${SRC_CONFIG_DIR}/**`,
    `!${SRC_CONFIG_DIR}/assets`,
  ]).pipe(dest(DIST_CONFIG_DIR));


/**
 * @return {Promise} Return a pipe promise
 */
const injectGlobalSettingsTask = () =>
  src(`${SRC_CONFIG_DIR}/settings/settings.yaml`)
      .pipe(modifyFile((content) => {
        const data = jsYaml.safeLoad(content);
        data.projectId = process.env.GOOGLE_PROJECT_ID;

        return jsYaml.dump(data, yamlOptions);
      }))
      .pipe(dest(`${SRC_CONFIG_DIR}/settings`));


/**
 * @return {Promise} Return a pipe promise
 */
const injectWehookSettingTask = () =>
  src(`${SRC_CONFIG_DIR}/webhooks/AssistantStudioFulfillment.yaml`)
      .pipe(modifyFile((content) => {
        const data = jsYaml.safeLoad(content);
        data.httpsEndpoint.baseUrl = process.env.GOOGLE_EXTERNAL_ENDPOINT;

        return jsYaml.dump(data, yamlOptions);
      }))
      .pipe(dest(`${SRC_CONFIG_DIR}/webhooks`));


/**
 * @return {Promise} Return a pipe promise
 */
const injectLocalSettingsTask = () =>
  src(`${SRC_CONFIG_DIR}/settings/en/settings.yaml`)
      .pipe(modifyFile((content) => {
        const {localizedSettings} = jsYaml.safeLoad(content);

        return jsYaml.dump({
          localizedSettings: {
            ...localizedSettings,
            displayName: process.env.GOOGLE_PROJECT_NAME,
            pronunciation: process.env.GOOGLE_PROJECT_INVOCATION,
            sampleInvocations: [
              `Talk to ${process.env.GOOGLE_PROJECT_INVOCATION}`,
            ],
          },
        }, yamlOptions);
      }))
      .pipe(dest(`${SRC_CONFIG_DIR}/settings/en`));

/**
 * @return {Promise} Return a pipe promise
 */
const updateAnswersTask = () =>
  src(`${SRC_CONFIG_DIR}/custom/types/game_answers.yaml`)
      .pipe(modifyFile((content) => {
        // const { entities } = jsYaml.safeLoad(content);

        const answerKeys = Object.keys(answers);
        const entities = {};
        answerKeys.map((key) => entities[key] = {});

        return jsYaml.dump({
          synonym: {entities},
        }, yamlOptions);
      }))
      .pipe(dest(`${SRC_CONFIG_DIR}/custom/types`));

/**
 * @return {Promise} Return a pipe promise
 */
const updateLocalAnswersTask = () =>
  src(`${SRC_CONFIG_DIR}/custom/types/en/game_answers.yaml`)
      .pipe(modifyFile(() => {
        return jsYaml.dump({
          synonym: {entities: answers},
        }, yamlOptions);
      }))
      .pipe(dest(`${SRC_CONFIG_DIR}/custom/types/en`));

/**
 *
 */
const updateLocalConfig = async () => {
  const cmd = [
    `"${__dirname}/bin/gactions"`,
    'pull',
    '-f',
    `--project-id '${process.env.GOOGLE_PROJECT_ID}'`,
    '--clean',
  ];

  const gactionProc = await exec(
      `${cmd.join(' ')}`,
      {cwd: `${__dirname}/../../sdk`},
  );

  gactionProc.stdout.on( 'data', ( data ) =>
    console.info( `${data.toString().replace( '\n', '')}` ),
  );

  gactionProc.stderr.on( 'data', ( data ) =>
    console.error( `stderr: ${data.toString().replace( '\n', '')}` ),
  );

  return gactionProc;
};

/**
 * @return {Promise} Return a pipe promise
 */
const deployConfig = () => {
  const gactionProc = exec(
      `"${__dirname}/bin/gactions" push -v`,
      {cwd: `${__dirname}/${SRC_CONFIG_DIR}`},
  );

  gactionProc.stdout.on( 'data', ( data ) =>
    console.info( `${data.toString().replace( '\n', '')}` ),
  );

  gactionProc.stderr.on( 'data', ( data ) =>
    console.error( `stderr: ${data.toString().replace( '\n', '')}` ),
  );

  return gactionProc;
};


exports['config:generate'] = series(
    cleanTask,
    updateAnswersTask,
    updateLocalAnswersTask,
    copyConfigsTask,
    parallel(
        injectWehookSettingTask,
        injectGlobalSettingsTask,
        injectLocalSettingsTask,
    ),
);

exports['config:deploy'] = series(
    cleanTask,
    updateAnswersTask,
    updateLocalAnswersTask,
    copyConfigsTask,
    parallel(
        injectWehookSettingTask,
        injectGlobalSettingsTask,
        injectLocalSettingsTask,
    ),
    deployConfig,
);
exports['config:update_local'] = updateLocalConfig;

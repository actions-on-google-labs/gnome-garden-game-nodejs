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

/* eslint-disable */
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
    envFile='.env'
}

console.log(`Environment File: ${envFile}`);
require('dotenv').config({ path: `${__dirname}/../../${envFile}` });


const { GoogleSpreadsheet } = require('google-spreadsheet');
const fs = require('fs');
const logger = require('../utils/logger')();
const axios = require('axios');
const cheerio = require('cheerio');

const {
  addOrAppendData,
  parseQuestionRow,
  sanitizeStr,
  writeJSONFile,
} = require('./helpers');

// Allow *.key files for require, so we can load the key directly.
require.extensions['.key'] = function (module, filename) {
  module.exports = fs.readFileSync(filename, 'utf8');
};

const client_email = process.env.GOOGLE_CLIENT_EMAIL;
const sheet_id = process.env.GOOGLE_SHEET_ID;
const private_key_file = require(`${__dirname}/../../.private.key`);
const private_key = private_key_file ||
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

const GAMEDATA_OUTPUT = `${__dirname}/../../src/assets/data/gameData.json`;
const GAMEDATA_OUTPUT2 = `${__dirname}/../../functions/data/conv.json`;
const ANSWERS_OUTPUT = `${__dirname}/../config-manager/data/answers.json`;

/**
 * Set up parameters for the sheet of intents
 */
const INTENT_SHEET = {
  id: 271227632,
  rows: { min: 4, max: 250 },
  cols: { min: 0, max: 7 },
};

/**
 * Set up parameters for the sheet of questions
 */
const QUESTIONS_SHEET = {
  id: 1790996608,
  rows: { min: 4, max: 250 },
  cols: { min: 0, max: 12 },
}

/**
 * List of assets as defined by the team
 */
const ASSET_SHEET = {
  id: 945601945,
  rows: { min: 1, max: 50 },
  cols: { min: 0, max: 3 },
}

/**
 * List of pre-defined synonyms from team
 */
const SYNONYM_SHEET = {
  id: 420139954,
  rows: { min: 1, max: 250 },
  cols: { min: 0, max: 2 },
}

/**
 * Parse the Intent Sheet and format the data
 * in a usable way for us.
 */
const getIntentData = async (doc) => {
  const { id, rows, cols } = INTENT_SHEET;

  const sheet = await doc.sheetsById[id];
  await sheet.loadCells({
    startRowIndex: rows.min, endRowIndex: rows.max,
    startColumnIndex: cols.min, endColumnIndex: cols.max,
  });

  let data = {};

  for ( let r = rows.min; r < rows.max; r++ ) {

    // If there's no data map, skip it
    if (!sheet.getCell(r,1).value)
      continue;

    // Get the object Path.
    const path = sanitizeStr(sheet.getCell(r, 1).value);
    const tts = sanitizeStr(sheet.getCell(r, 2).value);
    const tos = sanitizeStr(sheet.getCell(r, 3).value);
    const suggestion = sanitizeStr(sheet.getCell(r, 4).value);

    // Check to see if there's a TTS & TOS, if so - add a suffix
    if (tts && tos) {
      data = addOrAppendData(data, `${path}_tts`, tts);
      data = addOrAppendData(data, `${path}_tos`, tos);

    // Check if we're a part of the scene group (requires tts suffix)
    } else if (tts && path.match(/scenes\./)) {
      data = addOrAppendData(data, `${path}_tts`, tts);

    // Otherwise leave the path as-is
    } else if (tts) {
      data = addOrAppendData(data, `${path}`, tts);
    }

    // Add the suggestions array
    if ( sheet.getCell(r, 4).value ) {
      data = addOrAppendData(data,
        `${path}_suggestion`,
        suggestion.split(',')
          .map(item => item.trim())
      );
    }
  }

  // Grab our newly retrieved data
  const { gnome_responses, scenes } = data;

  // Return everything, with the overides in tact.
  return {
    gnome_responses: {
      ...gnome_responses,
      ...require('./overrides').gnome_responses,
    },
    scenes: {
      ...scenes,
      ...require('./overrides').scenes,
    },
  };
};

/**
 * Parse the Question Sheet and format the data
 * in a usable way for us.
 */
const getQuestionData = async (doc) => {
  const { id, rows, cols } = QUESTIONS_SHEET;

  // Load the asset data for us to use
  // on each question.
  const assetData = await getAssetData(doc);

  const sheet = await doc.sheetsById[id];
  await sheet.loadCells({
    startRowIndex: rows.min, endRowIndex: rows.max,
    startColumnIndex: cols.min, endColumnIndex: cols.max,
  });

  let data = {};

  for ( let r = rows.min; r < rows.max; r++ ) {
    const rowData = [];

    for ( let c = cols.min; c < cols.max; c++ ) {
      rowData.push(sheet.getCell(r, c).value);
    }


    const q = parseQuestionRow(rowData, assetData);

    if (!q) continue;

    if (!data[q.question_type]) {
      data[q.question_type] = [];
    }

    data[q.question_type].push(q);
  }

  return data;
}

/**
 * Retrieve the Asset Spreadsheet for our Use
 */
const getAssetData = async (doc) => {
  const { id, rows, cols } = ASSET_SHEET;

  const sheet = await doc.sheetsById[id];
  await sheet.loadCells({
    startRowIndex: rows.min, endRowIndex: rows.max,
    startColumnIndex: cols.min, endColumnIndex: cols.max,
  });

  let data = {};

  for ( let r = rows.min; r < rows.max; r++ ) {
    const id_str = sanitizeStr( sheet.getCell(r, 0).value);
    const label = sanitizeStr( sheet.getCell(r, 1).value);
    const label_plural = sanitizeStr( sheet.getCell(r, 2).value);

    data[id_str] = { label, label_plural };
  }

  return data;
}

/**
 *
 */
const getAnswers = (data) => {
  const answers = [];

  Object.keys(data).forEach(type => {
    data[type].forEach(question => {
      answers.push(...Object.keys(question.answer));
    });
  });

  return answers;
};

const getSynonymData = async (doc) => {
  const { id, rows, cols } = SYNONYM_SHEET;

  const sheet = await doc.sheetsById[id];
  await sheet.loadCells({
    startRowIndex: rows.min, endRowIndex: rows.max,
    startColumnIndex: cols.min, endColumnIndex: cols.max,
  });

  let data = {};

  for ( let r = rows.min; r < rows.max; r++ ) {
    const answer = sanitizeStr( sheet.getCell(r, 0).value);
    const synonyms = sanitizeStr( sheet.getCell(r, 1).value);

    if (!answer) continue;

    const synonymsArr = synonyms
      ? synonyms
        .split(',')
        .map(word => word.trim().toLowerCase())
        .filter(word => word !== '')
      : [];

    data[answer] = {
      synonyms: [ ...new Set([ answer, ...synonymsArr.sort() ]) ],
    };
  }

  const dataOrdered = {};
  const answers = Object.keys(data);

  Object.keys(data).sort()
    .forEach(key => dataOrdered[key] = data[key]);

  for (const key in dataOrdered) {
    dataOrdered[key].synonyms = dataOrdered[key]
      .synonyms.filter(val => !answers.includes(val));

    dataOrdered[key].synonyms = [ key, ...dataOrdered[key].synonyms];
  }
  return dataOrdered;
};

/**
 *
 */
const generateSynonyms = async (data) => {
  return Promise.all(data.map(async answer => {
    try {
      const synonyms = [];
      const resp = await axios.get(`https://www.thesaurus.com/browse/${encodeURI(answer)}`);

      if ( resp.status === 200 ){
        const $ = cheerio.load(resp.data);
        const wordList = $('[class*="WordGridLayoutBox"]').first();

        wordList.children().each((index, el) => $(el).find('a').text()
          ? synonyms.push($(el).find('a').text()) : null
        );

        return { [answer]: [answer, ...synonyms] };
      }
    } catch (e) {
      return { [answer]: [ answer ]};
    }
  }));
};


(async () => {
  const doc = new GoogleSpreadsheet(sheet_id);
  logger.info('Authenticating with Google');
  await doc.useServiceAccountAuth({ client_email, private_key });
  logger.info(`Loading the spreadsheet: ${process.env.GOOGLE_SHEET_ID}`);
  await doc.loadInfo();

  logger.info(`Spreadsheet Loaded: ${doc.title}`);

  logger.info('Start  :: Parse Intent Data');
  const sheetIntentData = await getIntentData(doc);
  logger.info('Finish :: Parse Intent Data');

  logger.info('Start  :: Parse Question Data');
  const questionData = await getQuestionData(doc);
  logger.info('Finish :: Parse Question Data');

  // const answers = getAnswers(questionData);
  // const answerData = await generateSynonyms(answers);
  const answerData = await getSynonymData(doc);

  const data = {
    ...sheetIntentData,
    questions: questionData,
  };

  logger.info(
    `Writing output to file: ${GAMEDATA_OUTPUT.replace(`${__dirname}/`, '')}`
  );
  writeJSONFile(GAMEDATA_OUTPUT, data, true);

  logger.info(
    `Writing output to file: ${GAMEDATA_OUTPUT2.replace(`${__dirname}/`, '')}`
  );
  writeJSONFile(GAMEDATA_OUTPUT2, data, true);

  logger.info(
    `Writing output to file: ${ANSWERS_OUTPUT.replace(`${__dirname}/`, '')}`
  );
  writeJSONFile(ANSWERS_OUTPUT, answerData, true);
})();
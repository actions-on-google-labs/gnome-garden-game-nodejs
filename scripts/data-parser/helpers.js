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

const objectd = require('object-dot');
const path = require('path');
const fs = require('fs');


/**
 * Removes whitespace and trailing newline characters
 *
 * @param {string} str String to sanitize
 *
 * @returns {string} Newly formatted string
 */
exports.sanitizeStr = (str) =>
  str ? str.trim().replace(/\\n$/, '') : str;



/**
 * Use dot.notation to reference a variable in
 * an object. If that variable exists already, turn
 * it into an array and append the new value
 *
 * @param {object} object
 *        Object ot inject data into
 * @param {string} path
 *        Dot Notation location of where to save the val
 * @param {string|array} val
 *        Value to save (only string & arr tested)
 *
 * @returns {object}
 *          New instance of object sent with val added
 */
exports.addOrAppendData = (object, path, val) => {
  const curr = objectd.get({ object, path });

  // Check if we have a current value and it's already an array
  if ( curr && Array.isArray(curr)) {
    return objectd.set(object, path, [...curr, val]);

  // If we do have a curr value, but not an array
  // turn it into one, and append the new value.
  } else if (curr) {
    return objectd.set(object, path, [curr, val]);

  // Special exception: `question_nomatch` types are forced
  // to be an array - so turn it into one on first value
  } else if (path.match(/question_nomatch_\d+/)) {
    return objectd.set(object, path, [val]);
  }

  // If all else doesn't check out, lets just return the value
  // set at the specified path.
  return objectd.set(object, path, val);
}

/**
 * Formats a row from a google spreadsheet into an object that can
 * be used in gamedata.
 *
 * @param {array} rowData
 *        Spreadsheet containing the data we need
 * @param {object} assets
 *        Mapped array to get a friendly label of the asset
 *
 * @returns {object|false}
 *          Object containing parsed data. False, if it fails
 */
exports.parseQuestionRow = (rowData, assets = {}) => {
  const [
    question_tts,
    question_tos,
    answer1_answer,
    answer1_response_tts,
    answer1_response_tos,
    answer1_asset_id,
    answer1_asset_type,
    answer2_answer,
    answer2_response_tts,
    answer2_response_tos,
    answer2_asset_id,
    answer2_asset_type,
  ] = rowData;

  // Don't return an object if we don't have the
  // answers required to build it.
  if (!answer1_answer || !answer2_answer)
  return false;

  const answer1 = answer1_answer.toLowerCase();
  const answer2 = answer2_answer.toLowerCase();

  return {
    question_tts,
    question_tos,
    question_type: answer1_asset_type.toLowerCase(),
    answer: {
      [answer1]: {
        response_tts: answer1_response_tts || '',
        response_tos: answer1_response_tos || '',
        update: {
          asset_id: answer1_asset_id.toLowerCase(),
          asset_type: answer1_asset_type.toLowerCase(),
          asset_label: assets[answer1_asset_id]
            ? assets[answer1_asset_id].label_plural
            : '',
        }
      },
      [answer2]: {
        response_tts: answer2_response_tts || '',
        response_tos: answer2_response_tos || '',
        update: {
          asset_id: answer2_asset_id.toLowerCase(),
          asset_type: answer2_asset_type.toLowerCase(),
          asset_label: assets[answer2_asset_id]
            ? assets[answer2_asset_id].label_plural
            : ''
        }
      }
    }
  };
}

/**
 * Writes data out to a target file. This will also create
 * the directory structure if it doesn't exist.
 *
 * @param {string} target
 *        Location where the file should be written
 *
 * @param {object} data
 *        File (data) contents
 *
 * @param {boolean} formatted=false
 *        Format the final JSON doc
 *
 * @returns {boolean}
 *          Whether the file was successfull written or not.
 */
exports.writeJSONFile = (target, data, formatted=false) => {
  const dir = path.dirname(target);
  const file = path.basename(target);

  fs.existsSync(dir) || fs.mkdirSync(dir, {recursive: true});

  fs.writeFileSync(
    `${dir}/${file}`,
    JSON.stringify(data, { encoding: "utf8" }, formatted ? 2 : null)
  );

  return true;
}
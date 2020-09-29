/**
 * Copyright 2020 Google Inc. All Rights Reserved.
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

'use strict';

const template1 = require('../data/templates/garden01-grid.json');
const template2 = require('../data/templates/garden02-grid.json');
const template3 = require('../data/templates/garden03-grid.json');
const template4 = require('../data/templates/garden04-grid.json');
const template5 = require('../data/templates/garden05-grid.json');
const template6 = require('../data/templates/garden06-grid.json');
const template7 = require('../data/templates/garden07-grid.json');
const template8 = require('../data/templates/garden08-grid.json');

/**
 * Class to help handling user Garden Template
 */
module.exports = class GridData {
  /**
   * Contructor. Add all posibles templates
   */
  constructor() {
    this.templates = [
      template1,
      template2,
      template3,
      template4,
      template5,
      template6,
      template7,
      template8,
    ];
  }

  /**
   * Get user garden template by Id
   * @param {index} index current user garden index
   * @return {obj} garden template by index
   */
  getData(index) {
    const i = index - 1;
    if (typeof this.templates[i] === 'undefined') {
      return this.templates[0];
    } else {
      return this.templates[i];
    }
  }

  /**
   * Class to handle GNOME
   * @return {int} templates array length
   */
  getlength() {
    return this.templates.length;
  }
};

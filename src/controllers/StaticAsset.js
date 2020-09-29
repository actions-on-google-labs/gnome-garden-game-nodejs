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

/**
 * Class to handle StaticAsset
 */
class StaticAsset {
  /**
   * Create new Static Asset: constructor
   * @param  {obj} data Asset data.
   * @param  {String} type Asset type.
   */
  constructor(data, type) {
    this.id = data.id;
    this.size = data.size;
    this.positionArray = data.items;
    this.type = type;
    this.assetName = '';
    this.timestamp = -1;
    this.visible = false;
    this.stateUpdated = false;
    this.randomDelay = false; // This property is used on story
  }

  /**
   * Add new Asset.
   * @param {obj} data Asset data.
   * @param {Boolean} randomDelay Enable random delay when asset appears.
   */
  addAsset(data, randomDelay=false) {
    this.assetName = data.assetId;
    this.randomDelay = randomDelay;
    this.stateUpdated = (this.timestamp!==data.timestamp && !this.randomDelay);
    this.timestamp = data.timestamp;
    this.visible = true;
  }

  /**
   * Remove current Asset.
   */
  removeAsset() {
    this.assetName = '';
    this.stateUpdated = (this.timestamp > 0 && !this.randomDelay);
    this.randomDelay = false;
    this.timestamp = -1;
    this.visible = false;
  }
}

export default StaticAsset;

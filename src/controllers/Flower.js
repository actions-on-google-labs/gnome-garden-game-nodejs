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

import {
  LIFE_CYCLE_LENGTH,
  WEED_INTERVAL,
  UPDATE_INTERVAL,
} from '../constants.js';

/**
 * Class to handle Flower
 * @property {Function} setup Define main properties
 */
class Flower {
  /**
   * Create new Flower: constructor
   * @param  {obj} data Flower data.
   * @param  {String} type Asset type.
   */
  constructor(data, type) {
    this.id = data.id;
    this.size = data.size;
    this.positionArray = data.items;
    this.type = type;
    this.assetName = '';
    this.timestamp = -1;

    this.lifeStateArray = ['unknown', 'live', 'weed'];
    this.lifeState = this.lifeStateArray[0];
    this.lifeCycleLength = LIFE_CYCLE_LENGTH;
    this.weedInterval = WEED_INTERVAL;
    this.updateInterval = UPDATE_INTERVAL;
    this.sizeSteps = 3;
    this.updateLoop = 0;
    this.weedEnabled = false;
    this.treeSize = 1.1;
    this.removeIdPos = data.id_pos;
    this.removeable = data.removeable;
    this.removeId = 0;
    this.stateUpdated = false;
    this.flowerWeeded = false;
    this.customTimestamp = false;
  }

  /**
   * Add new Flower.
   * @param  {obj} data Flower data.
   * @param  {boolean} customTimestamp Boolean to overrite timestamp.
   */
  addFlower(data, customTimestamp=false) {
    this.assetName = data.assetId;
    this.customTimestamp = customTimestamp;
    if (!this.customTimestamp) {
      this.stateUpdated = this.timestamp !== data.timestamp;
      if (this.timestamp > 0 && this.stateUpdated) this.flowerWeeded = true;
      this.timestamp = data.timestamp;
    } else {
      const randomSeconds = (Math.floor(Math.random() * 10) + 2) * 1000;
      this.timestamp = getRoundedDate(5, Date.now() + randomSeconds);
    }

    this.removeId = (data.removeId) ? data.removeId : 0;
    // Reset life state and cicle to make sure data is not mixed.
    this.lifeState = this.lifeStateArray[0];
  }

  /**
   * Remove current Flower.
   */
  removeFlower() {
    this.assetName = '';
    this.customTimestamp = false;
    this.stateUpdated = this.timestamp > 0;
    this.timestamp = -1;
    this.flowerWeeded = false;
    this.removeId = 0;
    this.lifeState = this.lifeStateArray[0];
  }

  /**
   * Enable weed lyfecycle for flowers. This should be false for trees.
   */
  enableWeedCycle() {
    this.weedEnabled = true;
  }

  /**
   * Update life cycle based on current timestamp
   * @param  {num} date Current timestamp
   */
  updateLifeCycle(date) {
    if (this.timestamp <= 0) return;
    // Update diference every `updateInterval` seconds.
    this.updateLoop = Math.floor(
        (date - this.timestamp) / ( 1000 * this.updateInterval)) + 1;
    // Update life state
    this.lifeState = (this.updateLoop <= this.lifeCycleLength) ?
        this.lifeStateArray[1] : this.lifeStateArray[2];
  }

  /**
   * Update life cycle based on current timestamp
   * @return {obj} progress obj
   */
  getFlowerProgress() {
    const arr = [];
    switch (this.lifeState) {
      case 'live':
        this.positionArray.forEach((pos, index)=>{
          const itemSize = this.getItemSize(index);
          const item = {
            assetName: this.assetName,
            size: (this.weedEnabled) ? itemSize : itemSize * this.treeSize,
            visible: (itemSize > 0) ? true : false,
          };
          arr.push(item);
        });
        break;
      case 'weed':
        this.positionArray.forEach(()=>{
          const item = {
            assetName: this.assetName,
            size: (this.weedEnabled) ? this.size : this.size * this.treeSize,
            visible: true,
          };
          arr.push(item);
        });
        break;
    }
    return arr;
  }

  /**
   * Return current state
   * @return {int} return current weeds in patch
   */
  getFlowerState() {
    if (this.lifeState === this.lifeStateArray[0]) {
      return -1; // flower disabled
    } else if (this.lifeState === this.lifeStateArray[1] || !this.weedEnabled) {
      return 0; // flower living
    } else {
      // flower in weed mode
      let dif = (this.updateLoop - this.lifeCycleLength) / this.weedInterval;
      // Clamp weeds to max number of flowers spots
      dif = clamp(dif, 0, this.positionArray.length);
      return Math.ceil(dif); // round number up!
    }
  }

  /**
   * Return flower size based on time progress
   * @param {int} index flower index
   * @return {string} item size
   */
  getItemSize(index) {
    const progress = ((this.flowerWeeded || index === 0) &&
        !this.customTimestamp) ? this.sizeSteps :
        clamp(this.updateLoop - index, 0, this.sizeSteps);
    return (progress / this.sizeSteps) * this.size;
  }
}

/**
   * Return a number between min and max range
   * @param {int} num number to clamp
   * @param {int} min min number in range
   * @param {int} max max number in range
   * @return {int} number
   */
function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
}

/**
 * Return current date rounded by 'X' seconds.
 * @param {int} seconds, value to round in seconds.
 * @param {Date} d, current date.
 * @return {Date} return rounded date.
 */
function getRoundedDate(seconds, d=Date.now()) {
  const ms = 1000 * seconds; // convert seconds to ms;
  return Math.floor(d / ms) * ms;
}

export default Flower;

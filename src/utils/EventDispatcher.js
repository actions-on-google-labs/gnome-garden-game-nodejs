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
 * Class definition to handle globall events
 */
class EventDispatcher {
  /**
   * Init Class with empty list of listeners
   */
  constructor() {
    this.listeners = {};
  }

  /**
   * Dispatch event
   * @param {string} type Recive event type.
   * @param {object} parameters parameters.
   */
  dispatchEvent(type, ...parameters) {
    const listeners = this.listeners[type];

    if (!listeners) {
      return;
    }

    for (let i = 0; i < listeners.length; ++i) {
      listeners[i](...parameters);
    }
  }

  /**
   * Add listener
   * @param {string} type Recive event type.
   * @param {function} callback callback.
   */
  addEventListener(type, callback) {
    let listeners = this.listeners[type];

    if (!listeners) {
      listeners = [];
      this.listeners[type] = listeners;
    }

    if (listeners.indexOf(callback) !== -1) {
      return;
    }

    listeners.push(callback);
  }

  /**
   * Remove listener
   * @param {string} type Recive event type.
   * @param {function} callback callback.
   */
  removeEventListener(type, callback) {
    const listeners = this.listeners[type];

    if (!listeners) {
      return;
    }

    const i = listeners.indexOf(callback);

    if (i !== -1) {
      listeners.splice(i, 1);
    }
  }

  /**
   * Clean up listeners
   */
  dispose() {
    this.listeners = {};
  }
}

export default EventDispatcher;

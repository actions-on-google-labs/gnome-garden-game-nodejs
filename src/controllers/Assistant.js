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

// Assistant JS
import * as Const from '../constants';
import EventDispatcher from '../utils/EventDispatcher';

/**
 * Connect google assistant to canvas
 */
class Assistant extends EventDispatcher {
  /**
   * Setup commands to call from the google assistant
   */
  constructor() {
    super();
    this.currentScene = Const.SCENE_DEFAULT,
    this.ttsRunning = false;
    this.timeoutInstance = null;
    this.commands = {
      PRELOAD: (data) => {
        this.updateView(Const.STATE_SPLASH, data, false);
      },
      WELCOME: (data) => {
        this.updateView(Const.STATE_SPLASH, data);
      },
      STORY: (data) => {
        this.updateView(Const.STATE_STORY, data);
      },
      ON_BOARDING: (data) => {
        this.updateView(Const.STATE_ON_BOARDING, data);
      },
      GAME: (data) => {
        this.updateView(Const.STATE_GAME, data);
      },
      UPDATE_GARDEN: (data) => {
        this.updateView(Const.STATE_UPDATE_GARDEN, data);
      },
      REMOVE: (data) => {
        this.updateView(Const.STATE_REMOVE, data);
      },
      GAME_OVER: (data) => {
        this.updateView(Const.STATE_GAME_OVER, data);
      },
      RESET_GAME: (data) => {
        this.updateView(Const.STATE_RESET_GAME, data);
      },
      SETTINGS: (data) => {
        this.updateView(Const.STATE_SETTINGS, data);
      },
      INSTRUCTIONS: (data) => {
        this.updateView(Const.STATE_INSTRUCTIONS, data);
      },
      DEFAULT: (data) => {
      },
    };
  }

  /**
   * Update Store values with new data, based on GA comands.
   * @param {String} state New view State
   * @param {obj} data New data
   * @param {Boolean} gamePreloaded Game is loaded and ready to play
   */
  updateView(state, data, gamePreloaded=true) {
    this.dispatchEvent(Const.EVENT_UPDATE_VIEW, {
      state: state,
      gamePreloaded: gamePreloaded,
      userData: data.params,
      userGarden: data.userGarden,
      gardenData: data.gardenData,
      text_ui: data.text_ui,
      suggestions: data.suggestions,
    });
  }

  /**
   * Called by the Interactive Canvas web app once web app has loaded
   * to register callbacks.
   */
  setCallbacks() {
    const that = this;
    const callbacks = {
      onTtsMark(markName) {
        if (markName === 'START') {
          this.ttsRunning = true;
        } else if (this.ttsRunning && markName === 'END' &&
          (that.currentScene === Const.SCENE_WELCOME ||
          that.currentScene === Const.SCENE_UPDATE_GARDEN ||
          that.currentScene === Const.SCENE_STORY ||
          that.currentScene === Const.SCENE_ON_BOARDING)) {
          const delay = (that.currentScene === Const.SCENE_UPDATE_GARDEN) ?
              100 : 2500;
          const query = (that.currentScene === Const.SCENE_UPDATE_GARDEN) ?
              Const.QUERY_CANVAS_DONE : Const.QUERY_NEXT;
          // pass to next Scene
          this.ttsRunning = false;
          that.timeoutInstance = window.setTimeout(()=>{
            that.sendTextQuery(query);
          }, delay);
        }
      },
      onUpdate(data) {
        window.clearTimeout(that.timeoutInstance);
        this.ttsRunning = false;
        // data object is received as an array []
        const nextState = data[0].state ?
            data[0].state.toUpperCase() : Const.SCENE_DEFAULT;
        that.commands[nextState](data[0]);
        that.currentScene = nextState;
      },
    };
    window.interactiveCanvas.ready(callbacks);
  }

  /**
   * Send Text Query to google Assistant
   * @param {string} string, Message to send to GA.
   * @param {Boolean} forceUpdate, Param to try multiples times the query
   */
  sendTextQuery(string, forceUpdate) {
    if (this.running) return;
    this.running = true;
    window.interactiveCanvas.sendTextQuery(string)
        .then((res) => {
          this.running = false;
          if (res.toUpperCase() === 'SUCCESS') {
            console.log(`Request in flight: ${res}`);
          } else {
            console.log(`Request in flight: ${res}`);
            if (forceUpdate) {
              setTimeout(() => {
                this.sendTextQuery(string, forceUpdate);
              }, 200);
            }
          }
        });
  }
}

export const assistant = new Assistant();

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

import Vue from 'vue';
import Vuex from 'vuex';

import {STATE_RESET_GAME} from '../constants';

import * as StoryTemplate from '../assets/data/storyTemplate.json';
import * as StoryData from '../assets/data/storyData.json';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    gardenDataReady: false,
    gamePreloaded: false,
    gardenData: {},
    gardenDataBackup: {},
    suggestionChips: [],
    textUi: '',
    currentView: {
      state: '',
      gameData: {},
    },
    userData: {
      userGarden: {
        gnomePos: -1,
        data: [],
      },
      userGardenBackup: {
        gnomePos: -1,
        data: [],
      },
    },
    settings: {
      sound: {
        enabled: 1,
        volume: 1.0,
      },
    },
    windowSize: {
      width: 0,
      height: 0,
    },
    _scopedFunction: null,
  },
  mutations: {
    updateCurrentView(state, viewData) {
      state.gamePreloaded = viewData.gamePreloaded;
      state.currentView.state = viewData.state;
      state.userData.userGarden = viewData.userGarden;
      state.userData.userGardenBackup = viewData.userGarden;
      state.suggestionChips = viewData.suggestions || [];
      state.textUi = viewData.text_ui || '';

      if (viewData.gardenData &&
        (!state.gardenDataReady ||
        viewData.state === STATE_RESET_GAME)
      ) {
        state.gardenDataReady = true;
        state.gardenData = state.gardenDataBackup = viewData.gardenData;
      }

      if (viewData.userData.soundState != null) {
        state.settings.sound.enabled = viewData.userData.soundState;
      }
    },
    setWindowSize(state, winSize) {
      state.windowSize = winSize;
    },
    setScopedFunction(state, callback) {
      state._scopedFunction = callback;
    },
    toggleStoryView(state, boolean) {
      if (boolean) {
        // New scene Story
        state.gardenData = StoryTemplate.default;
        state.userData.userGarden = StoryData.default;
      } else {
        // Old scene Story
        state.gardenData = state.gardenDataBackup;
        state.userData.userGarden = state.userData.userGardenBackup;
      }
    },
  },
  actions: {
    initLayout({commit, dispatch}) {
      commit('setScopedFunction', ()=>{
        dispatch('_setWindowSize');
      });
      dispatch('startWatching');
    },
    startWatching({state}) {
      window.addEventListener('resize', state._scopedFunction);
      state._scopedFunction();
    },
    stopWatching({state}) {
      window.removeEventListener('resize', state._scopedFunction);
    },
    _setWindowSize({commit}) {
      const windowSize = {
        'width': window.innerWidth,
        'height': window.innerHeight,
      };
      commit('setWindowSize', windowSize);
    },
  },
});

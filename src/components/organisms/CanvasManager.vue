<!--
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
 -->
<template>
  <div
    class="canvas-manager"
  >
    <transition-group
      name="component-fade"
      mode="out-in"
      appear
    >
      <Preloader
        v-if="preloaderEnabled"
        key="preloader"
      />
      <SplashScreen
        v-if="splashEnabled"
        key="splash"
        :suggestion-chips="suggestionChips"
        :game-ready="gameReady"
        :game-preloaded="gamePreloaded"
        @CanvasResponse="sendQueryToAssistant"
        @updateGarden="updategardenWithDelay(0)"
      />
      <MenuOverlay
        v-show="menuOverlayOpen"
        key="menu"
        @CanvasResponse="sendQueryToAssistant"
      />
      <ScreenTextUi
        v-show="textUiVisible"
        key="text-ui"
        :text="textUi"
        :suggestion-chips="suggestionChips"
        @SuggestionClick="sendQueryToAssistant"
      />
      <UIButton
        v-show="settingsButtonEnabled"
        key="settings-btn"
        class="settings-btn small"
        text="settings"
        img="./assets/images/icons/settings.svg"
        @ButtonClick="emitResponse"
      />
    </transition-group>
    <GameScreen
      :class="{'blur' : menuOverlayOpen}"
      class="main-scene"
      @LoaderDone="handleGameReady"
      @CanvasResponse="sendQueryToAssistant"
      @enableTextUi="toggleTextUi"
    />
  </div>
</template>

<script>
import {mapState} from 'vuex';

import * as Const from '../../constants';
import ScreenTextUi from './ScreenTextUi';
import UIButton from '../atoms/UIButton';
import Preloader from '../molecules/Preloader';
import MenuOverlay from '../molecules/MenuOverlay';
import SplashScreen from '../screens/SplashScreen';
import GameScreen from '../screens/GameScreen';
import {soundManager} from '../../controllers/SoundManager';

import soundsprite from '../../assets/data/soundsprite.json';

export default {
  name: 'CanvasManager',
  components: {
    GameScreen,
    Preloader,
    SplashScreen,
    MenuOverlay,
    ScreenTextUi,
    UIButton,
  },
  data() {
    return {
      gameReady: false,
      options: soundsprite,
      menuOpen: false,
      textUiEnabled: false,
    };
  },
  computed: {
    ...mapState({
      currentView: (state) => state.currentView,
      gamePreloaded: (state) => state.gamePreloaded,
      textUi: (state) => state.textUi,
      suggestionChips: (state) => state.suggestionChips,
    }),
    preloaderEnabled() {
      return this.currentView.state === Const.STATE_SPLASH &&
          this.gamePreloaded !== true;
    },
    splashEnabled() {
      return this.currentView.state === Const.STATE_SPLASH &&
          this.gameReady;
    },
    menuOverlayOpen() {
      return this.currentView.state === Const.STATE_SETTINGS ||
          this.currentView.state === Const.STATE_INSTRUCTIONS;
    },
    textUiVisible() {
      return !this.splashEnabled &&
          !this.menuOverlayOpen &&
          this.currentView.state !== '' &&
          this.textUiEnabled;
    },
    settingsButtonEnabled() {
      return !this.splashEnabled &&
          !this.menuOverlayOpen &&
          this.currentView.state !== '' &&
          this.currentView.state !== Const.STATE_STORY;
    },
  },
  watch: {
    menuOverlayOpen(value) {
      if (!this.menuOpen) {
        soundManager.playSFX(Const.SOUND_TOGGLE_MENU);
      }
      this.menuOpen = value;
    },
    splashEnabled(value) {
      if (value) this.updategardenWithDelay(0, true);
    },
  },
  mounted() {
    soundManager.setup(this.options);
  },
  methods: {
    updategardenWithDelay(delay = 2500, forceQuery = false) {
      setTimeout(() => {
        this.$emit(
            'CanvasResponse',
            {msg: Const.QUERY_CANVAS_DONE},
            forceQuery,
        );
      }, delay);
    },
    sendQueryToAssistant(msg, forceQuery = false) {
      this.$emit('CanvasResponse', msg, forceQuery);
    },
    handleGameReady() {
      this.gameReady = true;
      if (this.currentView.state === Const.STATE_RESET_GAME) {
        this.updategardenWithDelay();
      }
    },
    toggleTextUi(boolean) {
      this.textUiEnabled = boolean;
    },
    emitResponse(string) {
      this.sendQueryToAssistant({msg: string});
    },
  },
};
</script>

<style scoped lang="scss">
  .canvas-manager {
    width: 100%;
    height: 100%;
    .main-scene {
      width: 100%;
      height: 100%;
      transition: filter $transition-duration $transition-ease;
      &.blur {
        filter: blur(10px);
      }
    }
    .settings-btn{
      position: absolute;
      top: 0;
      right: 0;
      margin: 30px;
      z-index: z('settings-btn');
    }
  }
</style>

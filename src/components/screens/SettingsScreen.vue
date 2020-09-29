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
  <div class="settings-scene">
    <UIButton
      class="close-btn small"
      text="resume"
      :img="svgUrl+'cross.svg'"
      @ButtonClick="emitResponse"
    />
    <div class="ui-container">
      <UIButton
        v-for="(button, key) in uiButtonsArray"
        :key="key"
        :text="button"
        @ButtonClick="emitResponse"
      />
      <div class="audio-buttons">
        <UIButton
          v-if="settings.sound.enabled === 1"
          class="btn-on"
          text="garden audio off"
          :img="svgUrl+'music_on.svg'"
          @ButtonClick="emitResponse"
        />
        <UIButton
          v-else
          class="btn-off"
          text="garden audio on"
          :img="svgUrl+'music_off.svg'"
          @ButtonClick="emitResponse"
        />
      </div>
    </div>
  </div>
</template>

<script>
import {mapState} from 'vuex';

import UIButton from '../atoms/UIButton';

export default {
  name: 'SettingsScene',
  components: {
    UIButton,
  },
  data() {
    return {
      uiButtonsArray: [
        'resume',
        'instructions',
        'new garden',
      ],
      svgUrl: './assets/images/icons/',
    };
  },
  computed: {
    ...mapState({
      settings: (state) => state.settings,
    }),
  },
  methods: {
    emitResponse(string) {
      this.$emit('emitResponse', string);
    },
  },
};
</script>

<style lang="scss" scoped>
  .settings-scene {
    .ui-container {
      position: absolute;
      @include centerXY();
      .ui-button{
        margin-left: auto;
        margin-right: auto;
      }
      .audio-buttons{
        display: block;
        width: fit-content;
        margin: 20px auto;
        .ui-button{
          display: inline-block;
          margin: 0 10px;
          &.btn-off{
            pointer-events: auto;
            background-color: $color-black;
            &.disabled {
              background-color: $color-white;
            }
          }
          &.btn-on {
            background-color: $color-white;
            &.disabled {
              background-color: $color-black;
            }
          }
        }
      }
    }
    .close-btn{
      position: absolute;
      top: 0;
      right: 0;
      margin: 30px;
    }
  }
</style>

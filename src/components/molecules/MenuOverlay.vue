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
  <div class="menu-overlay">
    <transition
      name="component-fade"
      mode="out-in"
      appear
    >
      <component
        :is="menuState"
        @emitResponse="emitCanvasResponse"
      />
    </transition>
  </div>
</template>

<script>
import {mapState} from 'vuex';

import {STATE_SETTINGS, STATE_INSTRUCTIONS} from '../../constants';
import Settings from '../screens/SettingsScreen';
import Instructions from '../screens/InstructionsScreen';

export default {
  name: 'MenuOverlay',
  components: {
    Settings,
    Instructions,
  },
  computed: {
    ...mapState({
      currentView: (state) => state.currentView,
    }),
    menuState() {
      if (
        this.currentView.state === STATE_SETTINGS ||
        this.currentView.state === STATE_INSTRUCTIONS
      ) {
        return this.currentView.state;
      } else {
        return '';
      }
    },
  },
  methods: {
    emitCanvasResponse(string) {
      this.$emit('CanvasResponse', {msg: string});
    },
  },
};
</script>

<style lang="scss" scoped>
  .menu-overlay {
    background-color: rgba($color: $color-darkgreen, $alpha: 0.3);
    box-shadow: inset 0 0 20px 10px $color-darkgreen;
    @include fullScreen();
    z-index: z('menu-overlay');
  }
</style>

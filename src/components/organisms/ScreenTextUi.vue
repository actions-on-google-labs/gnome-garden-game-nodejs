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
  <div class="screen-text-ui">
    <transition
      name="slide-fade"
      mode="out-in"
    >
      <p
        :key="text"
        class="t-suggestion"
      >
        {{ text }}
      </p>
    </transition>
    <transition
      name="slide-fade"
      mode="out-in"
      appear
    >
      <div
        :key="`key-${customKey}`"
        class="chips-wrapper"
      >
        <SuggestionChip
          v-for="(chip, key) in suggestionChips"
          :key="key"
          :text="chip"
          @SuggestionClick="HandleSuggestionClick"
        />
      </div>
    </transition>
    <div class="background-gradient" />
  </div>
</template>

<script>
import SuggestionChip from '../atoms/SuggestionChip';

export default {
  name: 'ScreenTextUi',
  components: {
    SuggestionChip,
  },
  props: {
    text: {
      type: String,
      default: '',
    },
    suggestionChips: {
      type: Array,
      default: ()=>[],
    },
  },
  data() {
    return {
      disable: false,
      customKey: 1,
    };
  },
  watch: {
    suggestionChips(arr) {
      this.customKey++;
    },
  },
  methods: {
    HandleSuggestionClick(msg) {
      this.$emit('SuggestionClick', msg);
    },
  },
};
</script>

<style lang="scss" scoped>
  .screen-text-ui {
    position: absolute;
    z-index: 1;
    bottom: 0;
    width: 100%;
    padding: 60px 8% 10px;
    color: $color-white;
    text-align: center;
    p {
      padding-bottom: 10px;
    }
    .background-gradient {
      position: absolute;
      bottom: 0;
      left: 0;
      z-index: -1;
      width: 100%;
      height: 180px;
      background-image: -webkit-gradient(linear, left top,
        left bottom, from(rgba($color-green, 0)),
        to(rgba($color-green, 0.9)));
    }
  }
</style>

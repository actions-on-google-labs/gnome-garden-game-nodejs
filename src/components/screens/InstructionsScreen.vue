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
  <div class="instructions-scene">
    <UIButton
      class="return-btn small"
      text="settings"
      img="./assets/images/icons/arrow.svg"
      @ButtonClick="emitResponse"
    />
    <div class="ui-container t-ui-settings">
      <ul>
        <li
          v-for="(item, key) in copyList"
          :key="key"
        >
          <span>{{ item.key }}</span> {{ item.copy }}
        </li>
      </ul>
    </div>
    <UIButton
      class="resume-btn"
      text="resume"
      @ButtonClick="emitResponse"
    />
  </div>
</template>

<script>
import UIButton from '../atoms/UIButton';

export default {
  name: 'InstructionsScene',
  components: {
    UIButton,
  },
  data() {
    return {
      copyList: [
        {key: 'Skip', copy: 'to skip to the next question'},
        {key: 'New Garden', copy: 'to start a new garden'},
        {key: 'Remove', copy: 'to get rid of an item in the garden'},
        {key: 'Weed the Garden', copy: 'to get rid of weeds'},
        {key: 'Menu', copy: 'to see the menu'},
        {key: 'Exit', copy: 'to exit the game anytime'},
      ],
    };
  },
  methods: {
    emitResponse(string) {
      this.$emit('emitResponse', string);
    },
  },
};
</script>

<style lang="scss" scoped>
  .instructions-scene {
    .ui-container {
      position: absolute;
      @include centerXY();
      color: $color-white;
      white-space: nowrap;
      li{
        span{
          display: inline-block;
          padding:10px 20px;
          margin: 10px;
          border-radius: 10px;
          border: 2px solid $color-white;
          font-weight: 700;
        }
      }
    }
    .return-btn{
      position: absolute;
      top: 0;
      left: 0;
      margin: 30px;
    }
    .resume-btn{
      position: absolute;
      bottom: 0;
      right: 0;
      margin: 30px;
    }
  }
</style>

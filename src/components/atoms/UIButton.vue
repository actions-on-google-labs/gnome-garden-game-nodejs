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
  <button
    class="ui-button t-ui-button secondary-button"
    :class="{'icon':img, disabled}"
    @click="click"
  >
    <img
      v-if="img"
      :src="img"
      :alt="text"
    >
    <span v-else>{{ text }}</span>
  </button>
</template>

<script>

export default {
  name: 'UIButton',
  props: {
    text: {
      type: String,
      default: '',
      required: true,
    },
    img: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      clickTimeOut: null,
      disabledDelay: 3000,
      disabled: false,
    };
  },
  onDestroy() {
    if (this.clickTimeOut) {
      clearTimeout(this.clickTimeOut);
    }
  },
  methods: {
    click() {
      this.$emit('ButtonClick', this.text);
      this.disabled = true;
      this.clickTimeOut = setTimeout(() => {
        this.disabled = false;
      }, this.disabledDelay);
    },
  },
};
</script>

<style lang="scss" scoped>
.ui-button {
  &.icon {
    padding: 0;
    border-radius: 10px;
    width: 70px;
    height: 70px;
    &.small {
      width: 50px;
      height: 50px;
    }
  }
  img{
    vertical-align: middle;
    display: table-cell;
    margin: 0 auto;
  }

  transition: color $transition-duration $transition-ease,
      background-color $transition-duration $transition-ease;

  &.disabled {
    pointer-events: none;
    color: $color-white;
    background-color: $color-black;
  }
}
</style>

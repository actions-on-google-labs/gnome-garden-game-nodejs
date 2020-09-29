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
  <div class="preloader">
    <div class="loader-wrapper">
      <div class="loader" />
    </div>
  </div>
</template>

<script>

export default {
  name: 'Preloader',
};
</script>

<style lang="scss" scoped>
  .preloader {
    background-color: $color-white;
    @include fullScreen();
    z-index: z('preloader');
    .loader-wrapper {
      position: absolute;
      @include centerXY();
    }
    .loader {
      border: 2px solid $color-white;
      border-top: 2px solid $color-darkgreen;
      border-bottom: 2px solid $color-darkgreen;
      border-radius: 50%;
      width: 120px;
      height: 120px;
      animation: spin 2s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  }
</style>

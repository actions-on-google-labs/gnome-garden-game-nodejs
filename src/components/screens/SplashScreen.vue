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
  <div class="splash">
    <div class="ui-container">
      <div class="video-wrapper">
        <video
          ref="videoPlayer"
          :poster="posterSrc"
          muted
          preload="auto"
        >
          <source
            :src="videoSrc"
            type="video/mp4"
          >
        </video>
      </div>
      <transition
        name="slide-fade"
        mode="out-in"
        appear
      >
        <div
          v-show="gamePreloaded"
          class="button-wrapper"
        >
          <SuggestionChip
            v-for="(chip, key) in suggestionChips"
            :key="key"
            :text="chip"
            @SuggestionClick="emitCanvasResponse"
          />
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import SuggestionChip from '../atoms/SuggestionChip';

export default {
  name: 'Splash',
  components: {
    SuggestionChip,
  },
  props: {
    suggestionChips: {
      type: Array,
      default: ()=>[],
    },
    gamePreloaded: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      posterSrc: '/assets/images/gg_background.jpg',
      videoSrc: '/assets/videos/Splash_GG_full.mp4',
      isPlaying: false,
      videoLoopStart: 3.75,
    };
  },
  watch: {
    gamePreloaded() {
      this.videoReady();
    },
  },
  mounted() {
    this.addListeners();
  },
  beforeDestroy() {
    this.removeListeners();
  },
  methods: {
    emitCanvasResponse(msg) {
      this.$emit('CanvasResponse', msg);
    },
    addListeners() {
      this.$refs.videoPlayer.addEventListener(
          'canplaythrough',
          this.videoReady,
      );
      this.$refs.videoPlayer.addEventListener(
          'timeupdate',
          this.videoUpdate,
      );
    },
    removeListeners() {
      this.$refs.videoPlayer.removeEventListener(
          'canplaythrough',
          this.videoReady,
      );
      this.$refs.videoPlayer.removeEventListener(
          'timeupdate',
          this.videoUpdate,
      );
    },
    videoReady() {
      if (!this.isPlaying && this.gamePreloaded) {
        this.isPlaying = true;
        setTimeout(() => {
          this.$refs.videoPlayer.play();
        }, 1000);
      }
    },
    videoUpdate() {
      const video = this.$refs.videoPlayer;
      if (video.currentTime >= video.duration * 0.99) {
        video.pause();
        video.currentTime = this.videoLoopStart;
        video.play();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
  .splash {
    background-color: $color-white;
    @include fullScreen();
    z-index: z('splash');
    .ui-container {
      .video-wrapper{
        height: 101vh;
        width: 101vw;
        position: relative;
        img {
          position: absolute;
          @include centerXY();
          width: auto;
          height: 100%;
          will-change: opacity;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        video {
          position: absolute;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
      .button-wrapper{
        position: absolute;
        bottom: 0;
        padding-bottom: 10px;
        width: 100%;
        display: block;
        text-align: center;
      }
    }
  }
</style>

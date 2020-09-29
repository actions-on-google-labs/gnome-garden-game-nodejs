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
  <div id="app">
    <DebugUi
      v-if="development"
      :canvas-msg="devCanvasResponse"
    />
    <CanvasManager @CanvasResponse="sendQueryToAssistant" />
  </div>
</template>

<script>
import {mapMutations, mapActions} from 'vuex';

import {EVENT_UPDATE_VIEW} from './constants';
import {assistant} from './controllers/Assistant';
import DebugUi from './components/organisms/DebugUi';
import CanvasManager from './components/organisms/CanvasManager';

const INTERACTIVE_CANVAS_SRC = 'https://www.gstatic.com/assistant/interactivecanvas/api/interactive_canvas.min.js';

export default {
  name: 'App',
  components: {
    DebugUi,
    CanvasManager,
  },
  data() {
    return {
      interactiveCanvasUrl: INTERACTIVE_CANVAS_SRC,
      devCanvasResponse: '',
    };
  },
  computed: {
    development() {
      return process.env.NODE_ENV === 'development';
    },
  },
  created() {
    this.initLayout();
  },
  mounted() {
    this.loadInteractiveCanvas();
    assistant.addEventListener(EVENT_UPDATE_VIEW, this.updateCurrentView);
  },
  methods: {
    sendQueryToAssistant({msg}, forceUpdate=false) {
      if (!this.development) {
        assistant.sendTextQuery(msg, forceUpdate);
      } else {
        this.devCanvasResponse = msg;
      }
    },
    loadInteractiveCanvas() {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.onload = () => {
          assistant.setCallbacks();
        };
        script.async = true;
        script.src = this.interactiveCanvasUrl;
        document.head.appendChild(script);
      });
    },
    ...mapMutations({
      updateCurrentView: 'updateCurrentView',
    }),
    ...mapActions({
      initLayout: 'initLayout',
    }),
  },
};
</script>

<style lang="scss">
#app {
  position: relative;
  width: 100%;
  height: 100%;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>

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
  <div class="game-scene">
    <canvas
      ref="GameCanvas"
      :class="{'visible' : canvasVisible}"
    />
  </div>
</template>

<script>
/* eslint-disable */
import * as PIXI from 'pixi.js';
window.PIXI = PIXI;
require('pixi-layers');
require('pixi-projection');
/* eslint-enable */

import {mapState, mapMutations} from 'vuex';
import {gsap} from 'gsap';
import {PixiPlugin} from 'gsap/PixiPlugin';

import * as Const from '../../constants';
import Gnome from '../../controllers/Gnome';
import Flower from '../../controllers/Flower';
import StaticAsset from '../../controllers/StaticAsset';
import {preloadFonts} from '../../utils/PreloadFonts';
import {soundManager} from '../../controllers/SoundManager';
import {removeUiManager} from '../../controllers/RemoveUiManager';

const SPRITE_PATH = '/assets/images/pixi/sprites';

export default {
  name: 'GameScene',
  data() {
    return {
      appInitialized: false,
      canvasBgColor: 0x103322,
      canvasVisible: false,
      ceilSize: 10,
      ceilSizeNormalice: 0,
      flowersList: [],
      flowerMaxScale: 0.25,
      forceUpdate: false,
      isometryScaleY: 0.5,
      gardenAssets: null,
      gsapSpeed: 0.85,
      pathAssets: null,
      planeSize: 1000,
      removeUiReady: false,
      resetGardenDelay: 1500,
      setupSceneDone: false,
      sizeMultiplier: 1.5,
      staticAssetsList: [],
      time: 0,
      updateEnabled: true,
      updateInterval: 1,
      userGardenInit: false,
    };
  },
  computed: {
    ...mapState({
      gameState: (state) => state.currentView.state,
      windowSize: (state) => state.windowSize,
      userGarden: (state) => state.userData.userGarden,
      gardenData: (state) => state.gardenData,
      soundState: (state) => state.settings.sound.enabled,
    }),
  },
  watch: {
    canvasVisible(boolean) {
      this.$emit('enableTextUi', boolean);
    },
    enableUpdate(value) {
      this.enableTicker(value);
    },
    gameState(newState, oldState) {
      this.handleGameState(newState, oldState);
    },
    gardenData(obj) {
      if (this.setupSceneDone) {
        const timeout = (this.userGardenInit) ? this.resetGardenDelay : 0;
        setTimeout(() => {
          this.setupUserGarden();
        }, timeout);
      }
    },
    setupSceneDone(boolean) {
      if (this.gardenData.flowers) {
        this.setupUserGarden();
      }
    },
    soundState(value) {
      this.updateBackgroundMusic(value);
    },
    userGarden(value) {
      this.updateGardenItems(value, 500);
    },
    windowSize(size) {
      this.resizeGameView(size);
    },
  },
  mounted() {
    this.initPixi();
  },
  methods: {

    initPixi() {
      gsap.registerPlugin(PixiPlugin);

      // Init PIXI App.
      this.app = new PIXI.Application({
        width: window.innerWidth,
        height: window.innerHeight,
        view: this.$refs.GameCanvas,
        backgroundColor: this.canvasBgColor,
        autoStart: false,
      });
      // Stop app ticker. GSAP ticker will be used.
      this.app.ticker.stop();
      this.app.stage = new PIXI.display.Stage();
      this.app.stage.sortableChildren = true;

      // create a new loader
      this.loader = PIXI.Loader.shared;
      this.loader.reset();
      this.loader.add('back', '/assets/images/gg_background.jpg');
      this.loader.add(`${SPRITE_PATH}/flowers.json`);
      this.loader.add(`${SPRITE_PATH}/features.json`);
      this.loader.add(`${SPRITE_PATH}/gnomeAnimations.json`);

      preloadFonts.preload();

      // begin load
      this.loader.load(()=>{
        this.$nextTick(()=>{
          this.setupSprites();
          this.setupScene();
        });
      });
    },

    initAppRenderer(boolean) {
      // Start App & run update
      this.appInitialized = boolean;
      this.app.start();
      this.enableTicker(boolean);
      this.canvasVisible = true;
      this.updateBackgroundMusic(boolean);
    },

    initSpriteProjection(parent, position, size,
        anchor, parentGroup, texture = PIXI.Texture.EMPTY) {
      const sprite = new PIXI.projection.Sprite2d(texture);
      sprite.anchor.set(anchor.x, anchor.y);
      sprite.proj.affine = PIXI.projection.AFFINE.AXIS_X;
      sprite.scale.set(0);
      sprite.rotation = -this.isometryPlane.rotation;
      sprite.parentGroup = parentGroup;
      parent.addChild(sprite);
      sprite.position.set(
          this.planeSize * (position.x + (this.ceilSizeNormalice * size/2)),
          this.planeSize * (position.y + (this.ceilSizeNormalice * size/2)));
      sprite.visible = false;
    },

    initRemoveUI() {
      this.removeUiReady = true;
      removeUiManager.setup(
          this.app,
          this.isometryPlane,
          this.flowersList,
          this.planeSize,
          this.ceilSize);
    },

    setupSprites() {
      this.flowerSheet = this.loader.resources[
          `${SPRITE_PATH}/flowers.json`].spritesheet;
      this.featureSheet = this.loader.resources[
          `${SPRITE_PATH}/features.json`].spritesheet;
      this.gnomeSheet = this.loader.resources[
          `${SPRITE_PATH}/gnomeAnimations.json`].spritesheet;
    },

    setupScene() {
      // create a new background sprite
      this.background = PIXI.Sprite.from(this.loader.resources.back.texture);
      this.background.width = this.app.view.width;
      this.background.height = this.app.view.height;
      this.app.stage.addChild(this.background);

      // Create ISO Scaling container
      this.isoScalingContainer = new PIXI.Container();
      // isometry can be achieved by setting scaleY 0.5 or tan(30 degrees)
      this.isoScalingContainer.scale.y = this.isometryScaleY;
      this.isoScalingContainer.position.set(
          this.app.view.width / 2, this.app.view.height / 2);
      this.app.stage.addChild(this.isoScalingContainer);

      // Create ISO Plane & Rotate
      this.isometryPlane = new PIXI.Graphics();
      this.isometryPlane.rotation = Math.PI / 4;
      this.isoScalingContainer.addChild(this.isometryPlane);

      this.resizeGameView(this.windowSize);
      this.setupSceneDone = true;
    },

    setupUserGarden() {
      if (this.userGardenInit) {
        this.flowersContainer.removeChildren();
        this.weedsContainer.removeChildren();
        this.featureContainer.removeChildren();
        this.removeUiReady = false;
        removeUiManager.reset();
        this.flowersList = [];
        this.staticAssetsList = [];
      } else {
        this.userGardenInit = true;
        this.gardenAssets = this.createDisplayGroup(1);
        this.pathAssets = this.createDisplayGroup(0);

        this.flowersContainer = new PIXI.Container();
        this.isometryPlane.addChild(this.flowersContainer);

        this.weedsContainer = new PIXI.Container();
        this.isometryPlane.addChild(this.weedsContainer);

        this.featureContainer = new PIXI.Container();
        this.isometryPlane.addChild(this.featureContainer);

        // Add Gnome to Scene
        this.gnome = new Gnome({
          parentContainer: this.isometryPlane,
          parentGroup: this.gardenAssets,
          planeSize: this.planeSize,
          spritesheet: this.gnomeSheet,
        });
      }

      // INIT ALL INSTANCES AND SPRITES at the beginning.
      for (const type in this.gardenData) {
        if (Object.prototype.hasOwnProperty.call(this.gardenData, type)) {
          let TypeController;
          let TypeList;
          let TypeContainer;
          let anchor;
          let addWeedClone;
          let parentGroup;

          if (type === Const.ASSET_TYPE_FLOWER ||
              type === Const.ASSET_TYPE_BACKGROUND
          ) {
            TypeController = Flower;
            TypeList = this.flowersList;
            TypeContainer = this.flowersContainer;
            addWeedClone = (type === Const.ASSET_TYPE_FLOWER);
            anchor = {x: 0.5, y: 0.87};
            parentGroup = this.gardenAssets;
          } else {
            TypeController = StaticAsset;
            TypeList = this.staticAssetsList;
            TypeContainer = this.featureContainer;
            addWeedClone = false;
            anchor = (type === Const.ASSET_TYPE_SEAT) ?
                {x: 0.5, y: 0.82} : {x: 0.5, y: 0.85};
            parentGroup = (type !== Const.ASSET_TYPE_PATH) ?
                this.gardenAssets : this.pathAssets;
          }
          this.gardenData[type].forEach((spot)=>{
            const instance = new TypeController(spot, type);
            TypeList.push(instance);
            spot.items.forEach((position)=>{
              this.initSpriteProjection(TypeContainer, position,
                  spot.size, anchor, parentGroup);
              if (addWeedClone) {
                // Weed lifeCycle will only apply to flowers.
                instance.enableWeedCycle();
                const weedIndex = Math.floor(Math.random() * 3) + 1;
                this.initSpriteProjection(this.weedsContainer,
                    position, spot.size, anchor, parentGroup,
                    this.flowerSheet.textures[`weed_${weedIndex}`]);
              }
            });
          });
        }
      }

      this.$nextTick(()=>{
        this.updateGardenItems(this.userGarden, 0);
        // EMIT SETUP DONE!
        this.$emit('LoaderDone');
      });
    },

    update(delta) {
      // Update every ${this.updateInterval} seconds.
      const lastUpdate = delta - this.time;
      if (this.updateEnabled &&
        (this.forceUpdate || lastUpdate >= this.updateInterval)) {
        this.time = delta;
        this.updateAndRenderFlowers();
        if (this.forceUpdate) {
          this.forceUpdate = false;
          this.updateAndRenderFeature();
        }
      }
    },

    updateAndRenderFlowers() {
      let flowersIndex = 0;
      let weedIndex = 0;
      const flowersSprites = this.flowersContainer.children;
      const weedsSprites = this.weedsContainer.children;
      const date = Date.now();
      for (let i = 0; i < this.flowersList.length; i++) {
        const flower = this.flowersList[i];
        flower.updateLifeCycle(date);
        const state = flower.getFlowerState();
        const flowerWeedEnabled = flower.weedEnabled;

        if (state < 0) { // flower & weed inactive
          flower.positionArray.forEach(()=>{
            this.handleSpriteState(flowersSprites[flowersIndex], 0);
            if (flowerWeedEnabled) {
              this.handleSpriteState(weedsSprites[weedIndex], 0);
              weedIndex++;
            }
            flowersIndex++;
          });
        } else { // flower living or weed state
          // get progress for each spot inside flower
          const flowerProgress = flower.getFlowerProgress();
          flowerProgress.forEach((flower, index)=>{
            // Update flower state
            flowersSprites[flowersIndex].texture =
                this.flowerSheet.textures[flower.assetName];
            this.handleSpriteState(flowersSprites[flowersIndex], flower.size);

            // Update weed state
            if (flowerWeedEnabled) {
              const flowerSize = (state !== 0 && state > index) ? flower.size:0;
              this.handleSpriteState(weedsSprites[weedIndex], flowerSize);
              weedIndex++;
            }
            flowersIndex++;
          });
        }
      }
    },

    updateAndRenderFeature() {
      // feature is not updated every wave since they are static.
      let featureIndex = 0;
      const featureSprites = this.featureContainer.children;
      for (let i = 0; i < this.staticAssetsList.length; i++) {
        const feature = this.staticAssetsList[i];
        const size = (feature.visible) ? feature.size : 0;
        const featureDelay = (feature.randomDelay) ?
          Math.floor(Math.random() * 10) + 2 : 0;
        let finalDelay = featureDelay;
        feature.positionArray.forEach((item)=>{
          if (feature.visible) {
            featureSprites[featureIndex].texture =
                this.featureSheet.textures[feature.assetName];
            if (feature.type === Const.ASSET_TYPE_PATH) {
              finalDelay = featureDelay + Math.random() / 2;
            }
          }
          this.handleSpriteState(
              featureSprites[featureIndex],
              size,
              finalDelay,
          );
          featureIndex++;
        });
      }
    },

    updateGardenItems(items, updateDelay) {
      if (typeof items === 'undefined') return;
      // Update flowers instances
      this.updateEnabled = false;
      this.magicTwinklesPos = [];
      const customTime = (this.gameState === Const.STATE_STORY);
      this.flowersList.forEach((flower) => {
        const i = items.data.findIndex((x)=> x.id === flower.id);
        if (i >= 0) flower.addFlower(items.data[i], customTime);
        else flower.removeFlower();
        if (flower.stateUpdated) {
          // If flower is added or removed
          this.addMagicTwinklesPos(flower);
        }
      });

      // Update features instances
      this.staticAssetsList.forEach((feature)=>{
        const i = items.data.findIndex((x)=> x.id === feature.id);
        if (i >= 0) feature.addAsset(items.data[i], customTime);
        else feature.removeAsset();
        if (feature.stateUpdated) {
          // If feature is added or removed
          this.addMagicTwinklesPos(feature);
        }
      });

      if (this.appInitialized && this.gnome) {
        this.updateGnomePosition(items.gnomePos, items.gnomeSize);
        this.gnome.runMagicAnimation(this.magicTwinklesPos);
      }
      setTimeout(() => {
        // Force update
        this.forceUpdate = true;
        this.updateEnabled = true;
      }, updateDelay);
    },

    updateGnomePosition(gnomePos, gnomeSize=1) {
      const disableDelay = (this.gameState === Const.STATE_STORY);
      if (gnomePos === -1 && gnomeSize > 1) {
        this.gnome.moveTo({x: 0, y: 0}, disableDelay, gnomeSize);
      } else {
        for (const type in this.gardenData) {
          if (Object.prototype.hasOwnProperty.call(this.gardenData, type)) {
            let pos = this.gardenData[type].findIndex((x)=> x.id === gnomePos);
            if (pos >= 0) {
              pos = this.gardenData[type][pos].gnome_pos;
              this.gnome.moveTo(pos, disableDelay, gnomeSize);
              break;
            }
          }
        }
      }
    },

    updateBackgroundMusic(boolean) {
      if (boolean) {
        soundManager.playBackgroundSound(Const.SOUND_NATURE_LOOP);
      } else {
        soundManager.stopBackgroundSound(Const.SOUND_NATURE_LOOP);
      }
    },

    handleGameState(newState, oldState) {
      if (newState !== Const.STATE_SPLASH && !this.appInitialized) {
        this.initAppRenderer(true);
      }
      if (
        newState === Const.STATE_STORY ||
        oldState === Const.STATE_STORY
      ) {
        this.manageStoryGarden(newState === Const.STATE_STORY);
      }
      if (
        newState === Const.STATE_REMOVE ||
        oldState === Const.STATE_REMOVE
      ) {
        this.manageRemoveUI(newState === Const.STATE_REMOVE);
      }
      if (newState === Const.STATE_RESET_GAME) {
        setTimeout(() => {
          this.initAppRenderer(false);
        }, this.resetGardenDelay);
      }
    },

    handleSpriteState(sprite, spriteSize, delay=-1) {
      const newScale = this.flowerMaxScale * (spriteSize*this.sizeMultiplier);
      if (sprite.scale.x === newScale) return;
      gsap.killTweensOf(sprite);
      gsap.to(sprite, {
        pixi: {
          scale: newScale,
          visible: (spriteSize > 0),
        },
        duration: this.gsapSpeed,
        ease: (spriteSize > 0) ? 'back.out(1.7)' : 'none',
        delay: (delay >= 0) ? delay :
            (spriteSize > 0) ? 0 : Math.random() / 2,
      });
    },

    addMagicTwinklesPos(assetObj) {
      let positions;
      if (assetObj.timestamp > 0) {
        // Adding asset
        positions = [assetObj.positionArray[0]];
      } else {
        // Removing asset
        const n = Math.ceil(assetObj.positionArray.length / 3);
        positions = this.getRandom(assetObj.positionArray, n);
      }
      this.magicTwinklesPos = this.magicTwinklesPos.concat(positions);
    },

    createDisplayGroup(index) {
      // z-index = index, sorting = true;
      const target = new PIXI.display.Group(index, true);
      target.on('sort', (sprite) => {
        // Orden zIndex based on XY pos.
        sprite.zOrder = (sprite.y + sprite.x) * 100;
      });
      this.app.stage.addChild(new PIXI.display.Layer(target));
      return target;
    },

    enableTicker(boolean) {
      if (boolean) {
        gsap.ticker.add(this.update);
      } else {
        gsap.ticker.remove(this.update);
      }
    },

    getRandom(arr, n) {
      const result = new Array(n);
      let len = arr.length;
      const taken = new Array(len);
      if (n > len) {
        return [];
      }
      while (n--) {
        const x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
      }
      return result;
    },

    manageStoryGarden(storyState) {
      this.initAppRenderer(false);
      this.canvasVisible = false;
      this.toggleStoryView(storyState);
      setTimeout(() => {
        if (this.gnome) {
          this.gnome.moveTo({x: 0, y: 0}, true);
        }
        this.initAppRenderer(true);
      }, this.resetGardenDelay);
    },

    manageRemoveUI(removeState) {
      if (removeState && !this.removeUiReady) this.initRemoveUI();
      this.$nextTick(()=>{
        removeUiManager.update(removeState, this.flowersList);
      });
    },

    resizeGameView({width, height}) {
      this.app.view.width = width;
      this.app.view.height = height;
      this.background.width = width;
      this.background.height = height;
      this.isoScalingContainer.position.set(
          width / 2, height / 2,
      );
      this.planeSize = width / 1.2;
      this.ceilSize = this.planeSize / 100;
      this.ceilSizeNormalice = this.ceilSize / this.planeSize;
    },

    ...mapMutations({
      toggleStoryView: 'toggleStoryView',
    }),
  },
};
</script>

<style lang="scss" scoped>
.game-scene{
  canvas {
    opacity: 0;
    transition: opacity $transition-duration * 2 linear;
    &.visible {
      opacity: 1;
      transition: opacity 1s linear .5s;
    }
  }
}
</style>

/**
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
 */

/* eslint-disable */
import * as PIXI from 'pixi.js';
window.PIXI = PIXI;
require('pixi-layers');
require('pixi-projection');
/* eslint-enable */

import {gsap} from 'gsap';
import {PixiPlugin} from 'gsap/PixiPlugin';


import {soundManager} from './SoundManager';
import {SOUND_GRID_APPEAR, SOUND_GRID_DISAPPEAR} from '../constants';

/**
 * Remove UI Manager
 */
class RemoveUiManager {
  /**
   * Constructor
   */
  constructor() {
    gsap.registerPlugin(PixiPlugin);

    this.texture = PIXI.Texture.WHITE;
    this.fontStyle = new PIXI.TextStyle({
      fontFamily: 'Open Sans',
      fontSize: 40,
      fontWeight: 500,
      wordWrap: true,
      wordWrapWidth: 440,
    });
    this.txtBGSize = 40;
    this.gsapSpeed = 0.5;
    this._initialize = false;
    this.visible = false;
  }

  /**
   * Setup Remove UI Scene
   * @param {obj} app, main PIXI app instance
   * @param {obj} parentContainer, main PIXI parent container
   * @param {Array} itemsArray, list of items to be removed
   * @param {int} planeSize, plane size in px
   * @param {int} ceilSize, cell size in px
   */
  setup(app, parentContainer, itemsArray, planeSize, ceilSize) {
    if (!this._initialize) {
      this._initialize = true;
      this.app = app;
      this.planeSize = planeSize;
      this.ceilSize = ceilSize;
      this.container = new PIXI.Container();
      this.footPrintcontainer = new PIXI.Container();
      this.container.visible = false;
      this.container.alpha = 0;
      this.footPrintcontainer.visible = false;
      this.footPrintcontainer.alpha = 0;
      parentContainer.addChild(this.container);
      parentContainer.addChild(this.footPrintcontainer);

      this.gardenUi = new PIXI.display.Group(2, true);
      this.app.stage.addChild(new PIXI.display.Layer(this.gardenUi));

      this._updateUiTexture();
    }

    itemsArray.forEach((item) => {
      // Just flowers will be able to be removed
      if (item.removeable) {
        const textSprite = new PIXI.projection.Text2d(item.id, this.fontStyle);
        const txtBG = new PIXI.projection.Sprite2d(this.texture);
        textSprite.proj.affine = txtBG.proj.affine =
          PIXI.projection.AFFINE.AXIS_X;
        textSprite.rotation = txtBG.rotation = -parentContainer.rotation;
        textSprite.anchor.set(0.5);
        textSprite.scale.set(0.5);
        txtBG.anchor.set(0.5);
        txtBG.width = this.txtBGSize;
        txtBG.height = this.txtBGSize;
        const cage = new PIXI.Container();
        cage.addChild(txtBG, textSprite);
        cage.parentGroup = this.gardenUi;
        this.container.addChild(cage);
        this._renderFootPrints(item);
      }
    });
  }

  /**
   * Remove all childrens from containers.
   * Used when garden template has changed.
   */
  reset() {
    if (this._initialize) {
      this.container.removeChildren();
      this.footPrintcontainer.removeChildren();
    }
  }

  /**
   * Update current state Containers and UI
   * @param {boolean} boolean, boolean flag to define is Ui is active or not
   * @param {Array} itemsArray, list of items could be removed
   */
  update(boolean, itemsArray) {
    if (this._initialize) {
      gsap.to([this.container, this.footPrintcontainer], {
        pixi: {alpha: (boolean) ? 1 : 0, visible: boolean},
        duration: this.gsapSpeed,
        onStart: () => {
          if (boolean) {
            soundManager.playSFX(SOUND_GRID_APPEAR);
          } else if (this.visible) {
            soundManager.playSFX(SOUND_GRID_DISAPPEAR);
          }
          this.visible = boolean;
        },
      });
      if (boolean) this._updateUi(itemsArray);
    }
  }

  /**
   * Update in state of UI
   * @param {Array} itemsArray, list of items could be removed
   */
  _updateUi(itemsArray) {
    let indexContainer = 0;
    let indexFootContainer = 0;
    const uiContainerItems = this.container.children;
    const uiFootContainerItems = this.footPrintcontainer.children;
    if (uiContainerItems.length <= 0) return;
    itemsArray.forEach((item) => {
      if (item.removeable) {
        const visible = (item.timestamp > 0);
        // Update footprint visibility
        item.positionArray.forEach((spot) => {
          uiFootContainerItems[indexFootContainer].visible = visible;
          indexFootContainer++;
        });
        // Handle id visibility
        this._updateItemId(uiContainerItems[indexContainer],
            item.removeIdPos, item.removeId, visible);
        indexContainer++;
      }
    });
  }

  /**
   * Update state spot ID
   * @param {obj} uiItem, UI element
   * @param {obj} position, position to set uiItem
   * @param {int} id, UI id to display
   * @param {boolean} boolean, define if need to be visible
   */
  _updateItemId(uiItem, position, id, boolean) {
    const translateXY = 20;
    gsap.set(uiItem, {
      alpha: 0,
      visible: false,
      x: (position.x * this.planeSize) + translateXY,
      y: (position.y * this.planeSize) + translateXY,
    });
    uiItem.children[1].text = id;
    if (boolean) {
      gsap.to(uiItem, {
        pixi: {
          alpha: 1,
          visible: true,
          x: (position.x * this.planeSize),
          y: (position.y * this.planeSize),
        },
        duration: this.gsapSpeed,
        delay: this.gsapSpeed / 2,
      });
    }
  }

  /**
   * Update current state of UI
   * @param {obj} coords, coordinates to render
   * @param {int} size, size of foot print
   * @param {obj} parent, parent container
   */
  _drawRectangleShape(coords = {}, size = 0, parent) {
    const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    sprite.alpha = 0.5;
    sprite.width = size * this.ceilSize;
    sprite.height = size * this.ceilSize;
    sprite.anchor.set(0, 0);
    sprite.position.set(
        coords.x * this.planeSize,
        coords.y * this.planeSize);
    parent.addChild(sprite);
  }

  /**
   * Create white texture for id boxes
   */
  _updateUiTexture() {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0xFFFFFF);
    graphics.drawRoundedRect(10, 10, 100, 100, 20);
    graphics.endFill();
    this.texture = this.app.renderer.generateTexture(graphics);
  }

  /**
   * Render footprint for item
   * @param {obj} item, item data
   */
  _renderFootPrints(item) {
    item.positionArray.forEach((spot) => {
      this._drawRectangleShape(spot, item.size, this.footPrintcontainer);
    });
  }
}

export const removeUiManager = new RemoveUiManager();

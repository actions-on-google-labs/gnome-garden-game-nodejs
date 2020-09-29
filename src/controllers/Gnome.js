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

import * as PIXI from 'pixi.js';
window.PIXI = PIXI;
require('pixi-layers');
require('pixi-projection');
import * as Const from '../constants.js';

/**
 * Class to handle GNOME
 */
class Gnome {
  /**
   * Create new Gnome: constructor
   * @param {obj} parentContainer Parent Container.
   * @param {obj} parentGroup Parent group to handle Z-Index.
   * @param {int} planeSize Plane size in px.
   * @param {obj} spritesheet Sprite sheet with all textures.
   */
  constructor({parentContainer, parentGroup, planeSize, spritesheet}) {
    this.parentContainer = parentContainer;
    this.parentGroup = parentGroup;
    this.planeSize = planeSize;
    this.spritesheet = spritesheet;
    this.gnomeCustomSize = 1;
    this.gnomeScale = 0.5;
    this.gnomeAnchorY = 0.81;
    this.HatTwinklesScale = 0.75;
    this.HatTwinklesAnchorY = 1.5;
    this.animationSpeed = 0.8;
    this.maxPosX = 0.55;
    this.maxPosY = 0.55;
    this.GnomePosX = 0;
    this.GnomePosY = 0;
    this.gnomeAnimations = {};
    this.TwinklesPool = [];
    this.MaxTwinklesPoolItems = 15;
    this.hatAnimationRunning = false;

    this.gnomeContainer = new PIXI.Container();
    this.parentContainer.addChild(this.gnomeContainer);

    this._createAnimation(this.spritesheet, this.animationSpeed);
    this._playAnimation(Const.ANIMATION_GNOME_ENTER);
  }

  /**
   * Move Gnome to X/Y position in plane
   * @param {obj} position New position.
   * @param {boolean} disableAnimation Move gnome with out animation.
   * @param {int} gnomeSize Gnome size multiplier.
   */
  moveTo({x, y}, disableAnimation=false, gnomeSize=1) {
    this.gnomeCustomSize = gnomeSize;
    if (this.GnomePosX !== x || this.GnomePosY !== y) {
      this.GnomePosX = x;
      this.GnomePosY = y;
      // FadeOut Gnome
      if (disableAnimation) {
        this._updateGnomePosition();
        return;
      }
      this._stopAnimation(Const.ANIMATION_GNOME_ENTER);
      this._playAnimation(Const.ANIMATION_GNOME_LEAVE);
    } else {
      this._updateGnomeSize();
    }
  }

  /**
   * Run gnome animation in hat and array of positions
   * @param {Array} positions Array of position to display sprite
   */
  runMagicAnimation(positions = []) {
    if (!this.hatAnimationRunning && positions.length > 0) {
      this.hatAnimationRunning = true;
      this._playAnimation(Const.ANIMATION_HAT_TWINKLES);
      setTimeout(() => {
        this._runTwinklesFromPool(positions);
      }, 500);
    }
  }

  /**
   * Create PIXI Animation for each of the animation element
   * @param {obj} spritesheet Sprite sheet with all textures.
   * @param {int} speed Animation Speed.
   */
  _createAnimation(spritesheet, speed) {
    for (const sprite in spritesheet.animations) {
      if (Object.prototype.hasOwnProperty.call(
          spritesheet.animations, sprite)) {
        const spriteName = sprite;
        let anchorY;
        let size;
        if (sprite === Const.ANIMATION_HAT_TWINKLES) {
          anchorY = this.HatTwinklesAnchorY;
          size = this.HatTwinklesScale;
        } else {
          anchorY = this.gnomeAnchorY;
          size = this.gnomeScale;
        }
        this.gnomeAnimations[sprite] = this._createSpriteAnimation({
          spritesheet: spritesheet,
          spriteName: sprite,
          index: spriteName,
          scale: size,
          anchorY: anchorY,
          speed: speed,
        });
      }
    }
  }

  /**
   * Handle Animation Complete Callback
   * @param {string} spriteName Sprite name.
   */
  _animationComplete(spriteName) {
    switch (spriteName) {
      case Const.ANIMATION_GNOME_LEAVE:
        this._stopAnimation(spriteName);
        this._updateGnomePosition();
        this._playAnimation(Const.ANIMATION_GNOME_ENTER); // FadeIn Gnome
        break;
      case Const.ANIMATION_HAT_TWINKLES:
        this.hatAnimationRunning = false;
        break;
      default:
        if (spriteName >= 0) {
          this.TwinklesPool[spriteName].visible = false;
        }
        break;
    }
  }

  /**
   * Update position for all Sprite Animation
   */
  _updateGnomePosition() {
    for (const sprite in this.gnomeAnimations) {
      if (Object.prototype.hasOwnProperty.call(this.gnomeAnimations, sprite)) {
        this.gnomeAnimations[sprite].position.set(
            this.planeSize * this._clamp(this.GnomePosX, -0.55, 0.55),
            this.planeSize * this._clamp(this.GnomePosY, -0.55, 0.55));
      }
    }
    this._updateGnomeSize();
  }

  /**
   * Update size for gnome sprites
   */
  _updateGnomeSize() {
    // Update Gnome Scale
    this.gnomeAnimations[Const.ANIMATION_GNOME_LEAVE].scale.set(
        this.gnomeScale * this.gnomeCustomSize);
    this.gnomeAnimations[Const.ANIMATION_GNOME_ENTER].scale.set(
        this.gnomeScale * this.gnomeCustomSize);
  }

  /**
   * Play Sprite Animation
   * @param {string} spriteName Sprite name.
   */
  _playAnimation(spriteName) {
    if (this.gnomeAnimations[spriteName]) {
      this.gnomeAnimations[spriteName].visible = true;
      this.gnomeAnimations[spriteName].gotoAndPlay(0);
    }
  }

  /**
   * Stop Sprite Animation
   * @param {string} spriteName Sprite name.
   */
  _stopAnimation(spriteName) {
    if (this.gnomeAnimations[spriteName]) {
      this.gnomeAnimations[spriteName].visible = false;
      this.gnomeAnimations[spriteName].gotoAndStop(0);
    }
  }

  /**
   * Create and Run twinkles animation from pool
   * @param {Array} positions Array of position to display sprite
   */
  _runTwinklesFromPool(positions) {
    if (positions.length > this.TwinklesPool.length) {
      while (positions.length > this.TwinklesPool.length &&
        this.TwinklesPool.length < this.MaxTwinklesPoolItems) {
        this._createTwinklesInstance();
      }
    }
    positions.forEach((pos, index) => {
      if (index >= this.TwinklesPool.length) return;
      this._playTwinkleAnimation(pos, index);
    });
  }

  /**
   * Create new Sprite Animation Instance
   * @param {Obj} SpriteParams Params to create new sprite animation
   * @return {Obj} Return Sprite animation instance
   */
  _createSpriteAnimation({spritesheet, spriteName, index,
    scale, anchorY, speed}) {
    const sprite = new PIXI.AnimatedSprite(spritesheet.animations[spriteName]);
    sprite.animationSpeed = speed;
    sprite.loop = false;
    sprite.visible = false;
    sprite.scale.set(scale);
    sprite.anchor.set(0.5, anchorY);
    sprite.position.set(0);
    sprite.onComplete = ()=>{
      this._animationComplete(index);
    };

    this.gnomeContainer.addChild(sprite);
    this._convertToProjection2d(sprite);
    return sprite;
  }

  /**
   * Create new Twinkles Sprite Animation and add it to pool
   */
  _createTwinklesInstance() {
    const s = this._createSpriteAnimation({
      spritesheet: this.spritesheet,
      spriteName: Const.ANIMATION_HAT_TWINKLES,
      index: this.TwinklesPool.length,
      scale: this.HatTwinklesScale,
      anchorY: 0.75,
      speed: this.animationSpeed,
    });
    this.TwinklesPool.push(s);
  }

  /**
   * Update position & Play Twinkle Sprite Animation from pool.
   * @param {obj} pos New position.
   * @param {int} index Index from sprite in Pool Arr.
   */
  _playTwinkleAnimation(pos, index) {
    this.TwinklesPool[index].position.set(this.planeSize * pos.x,
        this.planeSize * pos.y);
    this.TwinklesPool[index].visible = true;
    this.TwinklesPool[index].gotoAndPlay(0);
  }

  /**
   * Convert Sprite Animation to projection 2D
   * @param {obj} elem Sprite Animation
   */
  _convertToProjection2d(elem) {
    elem.convertSubtreeTo2d(elem);
    elem.proj.affine = PIXI.projection.AFFINE.AXIS_X;
    elem.rotation = -this.parentContainer.rotation;
    elem.parentGroup = this.parentGroup;
  }

  /**
   * Clamp number between min and max values
   * @param {int} num number to clamp
   * @param {int} min Min number
   * @param {int} max max number
   * @return {int} number clamped
   */
  _clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num;
  }
}

export default Gnome;

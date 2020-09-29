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

// eslint-disable-next-line
import {Howl,Howler} from 'howler';
import store from '../store/index';

/**
 * Class to handle globall Sound Effects
 * @property {Function} setup Define main properties
 * @property {Function} playSFX Play new Sound Effect
 * @property {Function} playBackgroundSound Play background track
 * @property {Function} stopBackgroundSound Stop background track
 * @property {Function} stopSFX Stop Sound Effect
 * @property {Function} stopAll Stop All Clips (SFX + Background)
 */
class SoundManager {
  /**
   * Init SoundManager contructor
   */
  constructor() {
    this.sounds = [];
    this._backgroundTrackId = -1;
  }

  /**
   * Setup a New Howler Instance.
   * @param  {Object} options Howler options.
   */
  setup(options) {
    this._spriteMap = options.sprite;

    // Create our audio sprite definition.
    this.sound = new Howl({
      src: options.urls[2],
      sprite: options.sprite,
      html5: true,
    });
  }

  /**
   * PLAY a sprite as SFX.
   * @param  {String} key Key in the sprite map object.
   */
  playSFX(key) {
    if (store.state.settings.sound.enabled === 0) {
      return;
    }
    const sprite = this._spriteMap[key];
    const id = this.sound.play(key);
    const soundTrack = {
      id: id,
      sprite: sprite,
      key: key,
    };
    this.sounds.push(soundTrack);

    // When this sound is finished, remove the progress element.
    this.sound.once('end', () => {
      this._handlePlayEnd(soundTrack);
    });
  }

  /**
   * PLAY a sprite as Background track.
   * @param  {String} key Key in the sprite map object.
   * @param  {Boolean} loop Boolean to enable play in loop.
   */
  playBackgroundSound(key, loop = true) {
    if (store.state.settings.sound.enabled === 0) {
      return;
    }
    // Stop current background if exist
    this.stopBackgroundSound();

    // Play new sprite
    this._backgroundTrackId = this.sound.play(key);
    this.sound.loop(loop, this._backgroundTrackId);
  }

  /**
   * STOP Background track.
   */
  stopBackgroundSound() {
    if (this._backgroundTrackId >= 0) {
      this.sound.stop(this._backgroundTrackId);
      this._backgroundTrackId = -1;
    }
  }

  /**
   * STOP a SFX sprite.
   * @param  {String} key Key in the sprite map object.
   */
  stopSFX(key) {
    const sprite = this._spriteMap[key];
    this.sounds.filter((obj) => {
      if (obj.sprite === sprite) {
        this.sound.stop(obj.id);
      }
    });
  }

  /**
   * Stop all clips
   */
  stopAll() {
    this.sound.stop();
    this._backgroundTrackId = -1;
  }

  /**
   * Play on Player unlock callback.
   * @param  {Object} soundTrack soundTrack
   */
  _handlePlayEnd(soundTrack) {
    const index = this.sounds.indexOf(soundTrack);
    if (index >= 0) {
      this.sounds.splice(index, 1);
    }
  }
}

export const soundManager = new SoundManager();

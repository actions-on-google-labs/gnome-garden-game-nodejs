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

module.exports = {
  // Events
  EVENT_UPDATE_VIEW: 'updateView',

  // Scenes
  SCENE_PRELOAD: 'PRELOAD',
  SCENE_WELCOME: 'WELCOME',
  SCENE_STORY: 'STORY',
  SCENE_ON_BOARDING: 'ON_BOARDING',
  SCENE_GAME: 'GAME',
  SCENE_UPDATE_GARDEN: 'UPDATE_GARDEN',
  SCENE_GAME_OVER: 'GAME_OVER',
  SCENE_REMOVE: 'REMOVE',
  SCENE_SETTINGS: 'SETTINGS',
  SCENE_INSTRUCTIONS: 'INSTRUCTIONS',
  SCENE_RESET_GAME: 'RESET_GAME',
  SCENE_DEFAULT: 'DEFAULT',

  // States
  STATE_SPLASH: 'Splash',
  STATE_STORY: 'Story',
  STATE_ON_BOARDING: 'Onboarding',
  STATE_GAME: 'Game',
  STATE_UPDATE_GARDEN: 'UpdateGardenView',
  STATE_REMOVE: 'Remove',
  STATE_GAME_OVER: 'GameOverView',
  STATE_RESET_GAME: 'ResetGame',
  STATE_SETTINGS: 'Settings',
  STATE_INSTRUCTIONS: 'Instructions',

  // Text Query
  QUERY_CANVAS_DONE: 'interactive canvas done',
  QUERY_NEXT: 'next',

  // Time Progress
  UPDATE_INTERVAL: 2, // loop interval every X seconds
  WEED_INTERVAL: 80, // New weed will pop up every X intervals
  LIFE_CYCLE_LENGTH: 240, // Total intervals plant will live (no weed)

  // Sprite Animation
  ANIMATION_GNOME_ENTER: 'Gnome_Enter',
  ANIMATION_GNOME_LEAVE: 'Gnome_Leave',
  ANIMATION_HAT_TWINKLES: 'Hat_Twinkles',

  // Sound
  SOUND_GRID_APPEAR: 'grid_appear',
  SOUND_GRID_DISAPPEAR: 'grid_disappear',
  SOUND_TOGGLE_MENU: 'menu',
  SOUND_NATURE_LOOP: 'nature_loop',

  // Source path
  SOURCE_PATH_SPRITES: '/assets/images/pixi/sprites',

  // Asset Types
  ASSET_TYPE_FLOWER: 'flowers',
  ASSET_TYPE_BACKGROUND: 'background',
  ASSET_TYPE_SEAT: 'seat',
  ASSET_TYPE_PATH: 'path',
};

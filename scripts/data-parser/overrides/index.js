/**
 * Copyright 2020 Google LLC
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

/**
 * Use this file to override or append properties
 * the generated JSON file.
 */
module.exports = {
  scenes: {
    device_error: "Sorry, this device does not support Interactive Canvas!",
    welcome_tts: `<prosody volume="silent">welcome screen</prosody><audio src="${process.env.GOOGLE_HOSTING_URL}/assets/sound/splash_screen.mp3"/>`,
    story_tts: `<prosody volume="silent">story screen</prosody><audio src="${process.env.GOOGLE_HOSTING_URL}/assets/sound/prologue_screen.mp3"/>`,
    welcome_new_suggestion: ["Next"],
    welcome_suggestion: ["Start", "Story"],
    story_suggestion: ["Next"],
  },
  gnome_responses: {
    gnome_moving_sound: `<audio src="${process.env.GOOGLE_HOSTING_URL}/assets/sound/gnome_exit+enter.mp3"/><break time="0.75"/>`,
    default_response: "Good choice, I like your style!",
    growing_response_start: `<audio src="${process.env.GOOGLE_HOSTING_URL}/assets/sound/object_growing.mp3"/>`,
    growing_response_end: "<break time=\"3\"/>",
    removing_sound: `<audio src="${process.env.GOOGLE_HOSTING_URL}/assets/sound/object_removing.mp3"/>`,
    audio_config_response: "Garden audio is <audio-state>, <break time=\"1\"/>Say Done to continue playing",
  },
  questions: {},
};
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

// Check for Local .env File
require('dotenv').config();

const functions = require('firebase-functions');
const {conversation, Canvas} = require('@assistant/conversation');
const convData = require('./data/conv.json');
const GridData = require('./utils/GridData.js');

const app = conversation();

// Check for our environment variable then default to the dev environment
const {GOOGLE_HOSTING_URL} = process.env;

// Check for our environment variable then default to the dev environment
const HOSTING_URL = `${GOOGLE_HOSTING_URL}`;
if (!HOSTING_URL) {
  throw new Error('Hosting URL not found in ENV');
}

const CANVAS_STATE = {
  PRELOAD_SCENE: 'PRELOAD',
  WELCOME_SCENE: 'WELCOME',
  STORY_SCENE: 'STORY',
  ON_BOARDING_SCENE: 'ON_BOARDING',
  GAME_SCENE: 'GAME',
  UPDATE_GARDEN_SCENE: 'UPDATE_GARDEN',
  GAME_OVER_SCENE: 'GAME_OVER',
  REMOVE_SCENE: 'REMOVE',
  SETTINGS_SCENE: 'SETTINGS',
  INSTRUCTIONS_SCENE: 'INSTRUCTIONS',
  RESET_GAME: 'RESET_GAME',
  DEFAULT: 'DEFAULT',
};

app.handle('handle_init_game', (conv) => {
  if (!conv.device.capabilities.includes('INTERACTIVE_CANVAS') ||
    conv.device.capabilities.includes('WEB_LINK')) {
    addSpeechResponse(conv, convData.scenes.device_error);
    conv.scene.next.name = 'actions.page.END_CONVERSATION';
    return;
  }

  // debugClearParams(conv);
  initGardenData(conv);
  getUserProgress(conv);

  conv.add(new Canvas({
    url: HOSTING_URL,
    data: {
      state: CANVAS_STATE.PRELOAD_SCENE,
      params: conv.user.params,
      userGarden: getUserGardenData(conv),
      gardenData: conv.session.params['gardenTemplate'],
    },
    suppressMic: true,
  }));
});

app.handle('handle_welcome', (conv) => {
  const suggestion = conv.user.params['storyVisited'] ?
      convData.scenes.welcome_suggestion :
      convData.scenes.welcome_new_suggestion;
  handleAssistantResponse(conv, {
    speech: convData.scenes.welcome_tts,
    speech_delay: 0,
    canvas: {
      state: CANVAS_STATE.WELCOME_SCENE,
      params: conv.user.params,
      suggestions: suggestion,
      suppressMic: true,
    },
  });
});

app.handle('handle_story', (conv) => {
  conv.user.params['storyVisited'] = true;
  conv.session.params['error_response'] = 0;
  handleAssistantResponse(conv, {
    speech: convData.scenes.story_tts,
    speech_delay: 1.5,
    canvas: {
      state: CANVAS_STATE.STORY_SCENE,
      params: conv.user.params,
      suggestions: convData.scenes.story_suggestion,
      suppressMic: true,
    },
  });
});

app.handle('handle_on_boarding', (conv) => {
  if (conv.session.params['newVisitor']) {
    conv.session.params['newVisitor'] = false;

    const response = convData.gnome_responses.welcome_back[Math.floor(
        Math.random() * convData.gnome_responses.welcome_back.length,
    )];

    handleAssistantResponse(conv, {
      speech: response,
      speech_delay: 2,
      canvas: {
        state: CANVAS_STATE.UPDATE_GARDEN_SCENE,
        params: conv.user.params,
        suppressMic: true,
      },
    });
  } else if (!conv.user.params['onboarding_1']) {
    conv.user.params['onboarding_1'] = true;
    handleAssistantResponse(conv, {
      speech: convData.scenes.onboarding_tts,
      speech_delay: 2,
      canvas: {
        state: CANVAS_STATE.ON_BOARDING_SCENE,
        params: conv.user.params,
        suggestions: convData.scenes.onboarding_suggestion,
        suppressMic: true,
      },
    });
  } else {
    conv.user.params['onboarding_2'] = true;
    handleAssistantResponse(conv, {
      speech: convData.scenes.onboarding2_tts,
      speech_delay: 1,
      canvas: {
        state: CANVAS_STATE.ON_BOARDING_SCENE,
        params: conv.user.params,
        text_ui: convData.scenes.onboarding2_tos,
        suggestions: convData.scenes.onboarding2_suggestion,
        suppressMic: true,
      },
    });
  }
});

app.handle('handle_on_game_play', (conv) => {
  if (!conv.user.params['storyVisited']) {
    // Redirect User to Story Scene
    conv.scene.next.name = 'Story';
    return;
  } else if (!conv.user.params['onboarding_1']) {
    // Redirect User to Onboarding 1
    conv.scene.next.name = 'OnBoarding';
    return;
  } else if (!conv.user.params['onboarding_2'] &&
      conv.user.params['userProgress'].flowers === 1) {
    // Redirect User to Onboarding 2
    conv.scene.next.name = 'OnBoarding';
    return;
  } else if (!conv.user.params['onboarding_3'] &&
      conv.session.params['first_weed_timestamp'] > 0 &&
      conv.session.params['first_weed_timestamp'] <= Date.now()) {
    // Redirect user to Onboarding 3 || first weed
    conv.scene.next.name = 'FirstWeedScene';
    conv.session.params['newVisitor'] = false;
    return;
  } else if (conv.session.params['newVisitor']) {
    conv.scene.next.name = 'OnBoarding';
    return;
  }

  const oldGnomePos = (conv.session.params['nextPosition']) ?
      conv.session.params['nextPosition'].id : -1;
  let gnomeMoving = false;

  if (conv.session.params['error_response'] === 0) {
    conv.session.params['nextPosition'] = getNextPosition(conv);
    gnomeMoving = (conv.session.params['nextPosition'].id !== oldGnomePos);
    if (conv.session.params['nextPosition'].id < 0) {
      // No left space in garden. Force user to Remove or Re-Start
      conv.scene.next.name = 'GameOver';
      return;
    }
  }

  const currentType = conv.session.params['nextPosition'].type;
  const currentProgress = conv.user.params['userProgress'][currentType];
  const sceneConvData = convData.questions[currentType][currentProgress];
  const randPrefix = Math.floor(
      Math.random() * convData.gnome_responses.question_prefixes.length,
  );
  const currPrefix = (currentProgress > 1 || currentType !== 'flowers') ?
      convData.gnome_responses.question_prefixes[randPrefix] : '';

  conv.session.params['sceneConvData'] = sceneConvData;

  let gnomeSound = '';
  let delay = 0;
  if (gnomeMoving) {
    if (conv.user.params['soundState'] !== 0) {
      gnomeSound = convData.gnome_responses.gnome_moving_sound;
    } else {
      delay = 1;
    }
  }
  handleAssistantResponse(conv, {
    speech: gnomeSound + currPrefix + sceneConvData.question_tts,
    speech_delay: delay,
    canvas: {
      state: CANVAS_STATE.GAME_SCENE,
      params: conv.user.params,
      text_ui: sceneConvData.question_tos,
      suggestions: Object.keys(sceneConvData.answer),
    },
  });
});

app.handle('handle_weed_the_garden', (conv) => {
  const currentScene = conv.scene.name;
  const updated = updateFlowersTimestamp(conv);
  conv.session.params['error_response'] = 0;
  conv.scene.next.name = 'GardenAnimation';
  let responsetts = responsetos = '';
  // Check if weeds has been removed and sound is enabled
  if (updated && conv.user.params['soundState'] !== 0) {
    responsetts += convData.gnome_responses.removing_sound;
  }
  if (currentScene === 'FirstWeedScene') {
    responsetts += convData.scenes.first_weeding_response_tts;
    responsetos = convData.scenes.first_weeding_response_tos;
  } else {
    responsetts += convData.scenes.weeding_response_tts;
    responsetos = convData.scenes.weeding_response_tos;
  }
  handleAssistantResponse(conv, {
    speech: responsetts,
    speech_delay: 0,
    canvas: {
      state: CANVAS_STATE.UPDATE_GARDEN_SCENE,
      params: conv.user.params,
      text_ui: responsetos,
    },
  });
});

app.handle('handle_skip_weeding', (conv) => {
  handleAssistantResponse(conv, {
    speech: convData.scenes.skip_weeding_response_tts,
    speech_delay: 2,
    canvas: {
      state: CANVAS_STATE.UPDATE_GARDEN_SCENE,
      params: conv.user.params,
      text_ui: convData.scenes.skip_weeding_response_tos,
      suppressMic: true,
    },
  });
});

app.handle('handle_first_weed', (conv) => {
  conv.user.params['onboarding_3'] = true;
  handleAssistantResponse(conv, {
    speech: convData.scenes.onboarding_weeding_tts,
    speech_delay: 1,
    canvas: {
      state: CANVAS_STATE.GAME_SCENE,
      params: conv.user.params,
      text_ui: convData.scenes.onboarding_weeding_tos,
      suggestions: convData.scenes.onboarding_weeding_suggestion,
    },
  });
});

app.handle('handle_skip_question', (conv) => {
  updateUserProgress(conv);
  conv.session.params['error_response'] = 0;
  conv.scene.next.name = 'GardenAnimation';
  handleAssistantResponse(conv, {
    speech: convData.gnome_responses.question_skip,
    speech_delay: 0,
    canvas: {
      state: CANVAS_STATE.UPDATE_GARDEN_SCENE,
      params: conv.user.params,
      suppressMic: true,
    },
  });
});

app.handle('handle_both_question', (conv) => {
  conv.session.params['error_response'] = 1;
  addSpeechResponse(conv, convData.gnome_responses.question_both);
  conv.scene.next.name = 'Game';
});

app.handle('handle_repeat_question', (conv) => {
  conv.session.params['error_response'] = 1;
  addSpeechResponse(conv, convData.gnome_responses.question_repeat);
  conv.scene.next.name = 'Game';
});

app.handle('handle_user_answer', (conv) => {
  try {
    const answer = conv.intent.params.Word.resolved.toLowerCase();
    if (answer in conv.session.params['sceneConvData'].answer) {
      handleCorrectAnswer(conv, answer);
    } else {
      handleWrongAnswer(conv);
    }
  } catch (e) {
    handleWrongAnswer(conv);
  }
});

app.handle('handle_on_game_over', (conv) => {
  handleAssistantResponse(conv, {
    speech: convData.scenes.game_over_tts,
    speech_delay: 2,
    canvas: {
      state: CANVAS_STATE.GAME_OVER_SCENE,
      params: conv.user.params,
      text_ui: convData.scenes.game_over_tos,
      suggestions: convData.scenes.game_over_suggestion,
    },
  });
});

app.handle('handle_open_remove', (conv) => {
  conv.session.params['error_response'] = 0;
  handleAssistantResponse(conv, {
    speech: convData.scenes.remove_intro_tts,
    speech_delay: 2,
    canvas: {
      state: CANVAS_STATE.REMOVE_SCENE,
      params: conv.user.params,
      text_ui: convData.scenes.remove_intro_tos,
    },
  });
});

app.handle('handle_remove_flower_by_id', (conv) => {
  // Check if user has some progress (flowers planted)
  const usergarden = getUserGardenData(conv);
  const labels = [];
  if (typeof usergarden.data !== 'undefined' &&
    usergarden.data instanceof Array &&
    usergarden.data.length > 0) {
    // Get Array of ids to remove
    let flowersId;
    try {
      flowersId = conv.intent.params.number.resolved;
    } catch (e) {
      flowersId = [];
    }
    const gardenProgress = conv.user.params['gardenProgress'];
    flowersId.forEach((flowerId)=>{
      const flower = usergarden.data.find(
          (x) => x.removeId === Number(flowerId));
      if (flower !== undefined) {
        const index = gardenProgress.findIndex(
            (x) => x.gardenSpot === flower.id);
        if (index >= 0 && gardenProgress[index].type === 'flowers') {
          gardenProgress.splice(index, 1);
          conv.session.params['gardenAvailableSpots'].push(
              {type: 'flowers', id: flower.id});
          labels.push(flower.label);
        }
      }
    });
    conv.user.params['gardenProgress'] = gardenProgress;
  }
  if (labels.length > 0) {
    const last = labels.pop();
    const result = (labels.length > 0) ?
      `${labels.join(', ')} and ${last}` : last;
    const key = '<plant_plural_name>';
    let response = '';
    // Check if sound is enabled
    if (conv.user.params['soundState'] !== 0) {
      response += convData.gnome_responses.removing_sound;
    }
    response += convData.scenes.remove_response_tts.replace(key, result);
    addSpeechResponse(conv, response);
  }
  conv.scene.next.name = 'CloseRemove';
});

app.handle('handle_close_remove', (conv) => {
  handleAssistantResponse(conv, {
    speech: convData.scenes.remove_end_tts,
    speech_delay: 2,
    canvas: {
      state: CANVAS_STATE.GAME_SCENE,
      params: conv.user.params,
      text_ui: convData.scenes.remove_end_tos,
      suggestions: convData.scenes.remove_end_suggestion,
    },
  });
});

app.handle('handle_open_settings', (conv) => {
  conv.session.params['error_response'] = 0;
  handleAssistantResponse(conv, {
    speech: convData.scenes.menu_tts,
    speech_delay: 2,
    canvas: {
      state: CANVAS_STATE.SETTINGS_SCENE,
      params: conv.user.params,
    },
  });
});

app.handle('handle_update_sound_state', (conv) => {
  let soundState;
  try {
    soundState = conv.intent.params.state.resolved.toLowerCase();
  } catch (e) {
    soundState = (conv.user.params['soundState'] !== 0) ? 'on' : 'off';
  }
  conv.user.params['soundState'] = (soundState === 'off') ? 0 : 1;
  const response = convData.gnome_responses.audio_config_response.replace(
      '<audio-state>', soundState);

  handleAssistantResponse(conv, {
    speech: response,
    speech_delay: 0,
    canvas: {
      state: CANVAS_STATE.SETTINGS_SCENE,
      params: conv.user.params,
    },
  });
});

app.handle('handle_open_instructions', (conv) => {
  conv.session.params['error_response'] = 0;
  handleAssistantResponse(conv, {
    speech: convData.scenes.instructions_tts,
    speech_delay: 2,
    canvas: {
      state: CANVAS_STATE.INSTRUCTIONS_SCENE,
      params: conv.user.params,
    },
  });
});

app.handle('handle_confirm_new_garden', (conv) => {
  handleAssistantResponse(conv, {
    speech: convData.scenes.confirm_new_garden_tts,
    speech_delay: 0.5,
    canvas: {
      state: CANVAS_STATE.GAME_OVER_SCENE,
      params: conv.user.params,
      text_ui: convData.scenes.confirm_new_garden_tos,
      suggestions: convData.scenes.confirm_new_garden_suggestion,
    },
  });
});

app.handle('handle_game_reset', (conv) => {
  clearParams(conv);
  initGardenData(conv);

  addSpeechResponse(conv, convData.gnome_responses.removing_sound +
    convData.scenes.new_garden_tts, 0);
  conv.add(new Canvas({
    data: {
      state: CANVAS_STATE.RESET_GAME,
      params: conv.user.params,
      userGarden: getUserGardenData(conv),
      gardenData: conv.session.params['gardenTemplate'],
    },
    suppressMic: true,
  }));
});

app.handle('handle_keep_garden', (conv) => {
  handleAssistantResponse(conv, {
    speech: convData.scenes.keep_intro_tts,
    speech_delay: 0,
    canvas: {
      state: CANVAS_STATE.GAME_OVER_SCENE,
      params: conv.user.params,
      text_ui: convData.scenes.keep_intro_tos,
      suppressMic: true,
    },
  });
});

app.handle('handle_nomatch_1', (conv) => {
  handleNoMatchResponse(conv, conv.scene.name, 1);
});
app.handle('handle_nomatch_2', (conv) => {
  handleNoMatchResponse(conv, conv.scene.name, 2);
});
app.handle('handle_nomatch_3', (conv) => {
  handleNoMatchResponse(conv, conv.scene.name, 3);
});

app.handle('handle_game_closes', (conv) =>{
  addSpeechResponse(conv, convData.gnome_responses.game_exit);
});

exports.ActionsOnGoogleFulfillment = functions.https.onRequest(app);

/**
 * Handle Conversation Response
 * @param {obj} conv, the conversation object.
 * @param {obj} responseObj, the conversation data for the current scene.
 */
function handleAssistantResponse(conv, responseObj) {
  if (responseObj.speech) {
    addSpeechResponse(conv, responseObj.speech, responseObj.speech_delay);
  }
  conv.add(new Canvas({
    data: {
      state: responseObj.canvas.state,
      params: responseObj.canvas.params,
      userGarden: getUserGardenData(conv),
      text_ui: responseObj.canvas.text_ui || '',
      suggestions: responseObj.canvas.suggestions || [],
    },
    suppressMic: responseObj.canvas.suppressMic || false,
  }));
  if (responseObj.canvas.suggestions) {
    conv.expected = {
      speech: responseObj.canvas.suggestions,
    };
  }
}

/**
 * Handle Speak Response from GA
 * @param {obj} conv, the conversation object.
 * @param {String} string, string message to add to conv.
 * @param {int} delay, add break delay at beggining of sentence.
 */
function addSpeechResponse(conv, string, delay = 0) {
  conv.add(`<speak><prosody volume="default">
      <break time="${delay}"/>${string}</prosody></speak>`);
}

/**
 * Handle No_Match Response
 * @param {obj} conv, the conversation object.
 * @param {String} sceneName, CurrentsScene name
 * @param {int} noMatchIndex, no match index.
 */
function handleNoMatchResponse(conv, sceneName, noMatchIndex) {
  let responseKey = false;
  switch (sceneName) {
    case 'Welcome':
    case 'Story':
    case 'OnBoarding':
      responseKey = `default_nomatch_${noMatchIndex}`;
      break;
    case 'Instructions':
      responseKey = `instructions_nomatch_${noMatchIndex}`;
      break;
    case 'Settings':
      responseKey = `settings_nomatch_${noMatchIndex}`;
      break;
    case 'FirstWeedScene':
      responseKey = `first_weed_nomatch_${noMatchIndex}`;
      break;
    case 'GameOver':
      responseKey = `gardenfull_nomatch_${noMatchIndex}`;
      break;
    case 'ConfirmNewGarden':
      responseKey = `newgarden_nomatch_${noMatchIndex}`;
      break;
    case 'Remove':
      responseKey = `remove_nomatch_${noMatchIndex}`;
      break;
    case 'CloseRemove':
      responseKey = `remove_end_nomatch_${noMatchIndex}`;
      break;
    case 'Game':
      handleWrongAnswer(conv);
      return;
  }
  if (responseKey) {
    addSpeechResponse(conv, convData.gnome_responses[responseKey]);
  }
  conv.add(new Canvas({
    data: {
      state: CANVAS_STATE.DEFAULT,
      params: conv.user.params,
    },
  }));
}

/**
 * Handle Conversation Flow | Correct Answer
 * @param {obj} conv, the conversation object.
 * @param {string} userAnswer, user answer intent.
 */
function handleCorrectAnswer(conv, userAnswer) {
  updateUserProgress(conv);
  conv.scene.next.name = 'GardenAnimation';
  conv.session.params['error_response'] = 0;
  const answerData = conv.session.params['sceneConvData'].answer[userAnswer];
  const speech = (answerData.response_tts === '') ?
      convData.gnome_responses.default_response : answerData.response_tts;

  addNewItemToGarden(conv, answerData.update);

  const ttsResponse = (conv.user.params['soundState'] === 0) ?
      speech : convData.gnome_responses.growing_response_start + speech;

  handleAssistantResponse(conv, {
    speech: ttsResponse + convData.gnome_responses.growing_response_end,
    speech_delay: 0.1,
    canvas: {
      state: CANVAS_STATE.UPDATE_GARDEN_SCENE,
      params: conv.user.params,
      suppressMic: true,
    },
  });
}

/**
 * Handle Conversation Flow | Incorrect Answer
 * @param {obj} conv, the conversation object.
 */
function handleWrongAnswer(conv) {
  conv.session.params['error_response'] += 1;
  const responseArr = convData.gnome_responses[
      `question_nomatch_${conv.session.params['error_response']}`];
  const response = responseArr[Math.floor(Math.random() * responseArr.length)];
  addSpeechResponse(conv, response);
  if (conv.session.params['error_response'] >= 3) {
    closeConversation(conv);
  } else {
    conv.scene.next.name = 'Game';
  }
}

/**
 * Close conversation
 * @param {obj} conv, the conversation object.
 */
function closeConversation(conv) {
  conv.scene.next.name = 'actions.page.END_CONVERSATION';
}

/**
 * Clears params
 * @param {obj} conv, the conversation object.
 */
function clearParams(conv) {
  conv.session.params['gardenAvailableSpots'] = [];
  conv.session.params['error_response'] = 0;
  conv.session.params['gardenTemplate'] = null;
  conv.session.params['sceneConvData'] = null;
  conv.session.params['first_weed_timestamp'] = 0;
  conv.session.params['nextPosition'] = null;
  conv.user.params['gardenTemplateId'] = null;
  conv.user.params['gardenProgress'] = null;
}
/**
 * Clears all params
 * @param {obj} conv, the conversation object.
 */
function debugClearParams(conv) {
  conv.session.params['gardenTemplate'] = null;
  conv.user.params['gardenTemplateId'] = null;
  conv.user.params['userProgress'] = null;
  conv.user.params['gardenProgress'] = null;
  conv.user.params['storyVisited'] = null;
  conv.user.params['onboarding_1'] = null;
  conv.user.params['onboarding_2'] = null;
  conv.user.params['onboarding_3'] = null;
  conv.user.params['soundState'] = null;
}

/**
 * Init garden data
 * @param {obj} conv, the conversation object.
 */
function initGardenData(conv) {
  const gardenTemplate = getGardenTemplate(conv);
  conv.session.params['gardenTemplate'] = gardenTemplate;
  // Clean garden available spots
  const gardenAvailableSpots = [];
  for (const prop in gardenTemplate) {
    if (Object.prototype.hasOwnProperty.call(gardenTemplate, prop)) {
      gardenTemplate[prop].forEach((spot)=>{
        gardenAvailableSpots.push({type: prop, id: spot.id});
      });
    }
  }

  // Remove used spots
  const gardenProgress = conv.user.params['gardenProgress'];
  if (typeof gardenProgress !== 'undefined' &&
    gardenProgress instanceof Array &&
    gardenProgress.length > 0) {
    gardenProgress.forEach((item)=>{
      const index = gardenAvailableSpots.findIndex(
          (x) => (x.id === item.gardenSpot && x.type === item.type));
      if (index > -1) {
        gardenAvailableSpots.splice(index, 1);
      }
    });
  } else {
    conv.user.params['gardenProgress'] = [];
  }
  conv.session.params['gardenAvailableSpots'] = [...gardenAvailableSpots];
}

/**
 * Set timestamp when first weed will grow in garden
 * @param {obj} conv, the conversation object.
 * @param {int} timestamp, first flower timestamp.
 */
function updateFirstWeedTimestamp(conv, timestamp) {
  const updateInterval = 2;
  const lifeCycleLength = 240;
  const time = timestamp + (updateInterval * lifeCycleLength * 1000);
  conv.session.params['first_weed_timestamp'] = time;
}

/**
 * Update timestamp for all flowers to remove all weeds
 * @param {obj} conv, the conversation object.
 * @return {Boolean} return if flowers timestamp has been updated
 */
function updateFlowersTimestamp(conv) {
  const currentTime = getRoundedDate(5);
  const updateInterval = 2;
  const lifeCycleLength = 240;
  const gardenProgress = conv.user.params['gardenProgress'];
  let updated = false;
  if (typeof gardenProgress !== 'undefined' &&
    gardenProgress instanceof Array &&
    gardenProgress.length > 0) {
    gardenProgress.forEach((el) => {
      if (el.type === 'flowers') {
        const time = currentTime - (updateInterval * lifeCycleLength * 1000);
        const randTime = (Math.ceil(Math.random() * 10) +
            lifeCycleLength) * 1000;

        console.log('Timestamps :: ', time, randTime);
        if (el.timestamp <= time) {
          updated = true;
          el.timestamp = time + randTime;
        }
      }
    });
  }
  return updated;
}

/**
 * Set user progress with default values if undefined
 * @param {obj} conv, the conversation object.
 */
function getUserProgress(conv) {
  const defaultProgress = {
    'flowers': 0,
    'background': 0,
    'hero': 0,
    'path': 0,
    'seat': 0,
    'secondary': 0,
  };
  conv.session.params['newVisitor'] = (conv.user.params['userProgress'] &&
      conv.user.params['onboarding_2']) ? true : false;
  conv.user.params['userProgress'] = (conv.user.params['userProgress']) ?
      conv.user.params['userProgress'] : defaultProgress;
  conv.session.params['error_response'] = 0;
}

/**
 * Update user progress based on next position type.
 * @param {obj} conv, the conversation object.
 */
function updateUserProgress(conv) {
  const currentType = conv.session.params['nextPosition'].type;
  conv.user.params['userProgress'][currentType] += 1;
  if (conv.user.params['userProgress'][currentType] >=
      convData.questions[currentType].length) {
    // If user finish all questions, start again.
    // Skip first question for flowers, since it is for onboarding.
    conv.user.params['userProgress'][currentType] =
        (currentType === 'flowers') ? 1 : 0;
  }
}

/**
 * Add new asset to garden progress based on question answer.
 * @param {obj} conv, the conversation object.
 * @param {obj} answerData, the answer data.
 */
function addNewItemToGarden(conv, answerData) {
  const gardenProgress = conv.user.params['gardenProgress'];
  // add item
  const nextPosId = conv.session.params['nextPosition'].id;
  const index = conv.session.params['gardenAvailableSpots'].findIndex(
      (x) => x.id === nextPosId);
  if (index >= 0) {
    gardenProgress.push({
      id: answerData.asset_id,
      type: answerData.asset_type,
      label: answerData.asset_label || '',
      gardenSpot: nextPosId,
      timestamp: getRoundedDate(5, Date.now() + 10000),
    });
    conv.session.params['gardenAvailableSpots'].splice(index, 1);
  }

  // Update user data
  conv.user.params['gardenProgress'] = gardenProgress;
}

/**
 * Get next asset position from available spots array.
 * @param {obj} conv, the conversation object.
 * @return {obj} next gardenSpot obj (type, id)
 */
function getNextPosition(conv) {
  if (conv.session.params['gardenAvailableSpots'].length > 0) {
    let nextIndex;
    if (conv.user.params['userProgress'].flowers === 0) {
      nextIndex = conv.session.params['gardenAvailableSpots'].findIndex(
          (x) => x.type === 'flowers');
    } else if (conv.session.params['gardenAvailableSpots'].some(
        (e)=>e.type === 'background')) {
      nextIndex = conv.session.params['gardenAvailableSpots'].findIndex(
          (x) => x.type === 'background');
    } else if (conv.session.params['gardenAvailableSpots'].some(
        (e) => e.type === 'path')) {
      nextIndex = conv.session.params['gardenAvailableSpots'].findIndex(
          (x) => x.type === 'path');
    } else {
      nextIndex = Math.floor(Math.random() *
          conv.session.params['gardenAvailableSpots'].length);
    }
    return conv.session.params['gardenAvailableSpots'][nextIndex];
  } else {
    console.log('DEBUG:availablespots: ',
        conv.session.params['gardenAvailableSpots'].length);
    console.log('DEBUG:gardentemplate: ',
        conv.user.params['gardenTemplateId']);
    console.log('DEBUG:gardenProgress: ',
        conv.user.params['gardenProgress'].length);
    return {type: null, id: -1};
  }
}

/**
 * Return current garden state properties.
 * @param {obj} conv, the conversation object.
 * @return {obj} userGarden obj.
 */
function getUserGardenData(conv) {
  let firstFlower = true;
  conv.session.params['first_weed_timestamp'] = 0;

  let removeIndex = 1;
  const gardenData = [];
  const gardenProgress = conv.user.params['gardenProgress'];
  if (typeof gardenProgress !== 'undefined' &&
    gardenProgress instanceof Array &&
    gardenProgress.length > 0) {
    gardenProgress.forEach((el) => {
      const cat = conv.session.params['gardenTemplate'][el.type];
      const i = cat.find((x) => x.id === el.gardenSpot);
      if (typeof i !== 'undefined') {
        i.assetId = el.id;
        i.timestamp = el.timestamp;
        if (i.removeable) {
          i.removeId = removeIndex;
          i.label = el.label || '';
          removeIndex++;
        }
        gardenData.push(i);

        // Update first weed timestamp
        if (firstFlower && el.type === 'flowers') {
          firstFlower = false;
          updateFirstWeedTimestamp(conv, el.timestamp);
        }
      }
    });
  }

  const currentScene = conv.scene.name;
  const gnomeCustomSize = (currentScene === 'OnBoarding' &&
      conv.user.params['onboarding_2'] !== true) ? 2 : 1;

  const userGarden = {
    gnomeSize: gnomeCustomSize,
    gnomePos: (conv.session.params['nextPosition']) ?
        conv.session.params['nextPosition'].id : -1,
    data: gardenData,
  };
  return userGarden;
}

/**
 * Return current date rounded by 'X' minutes.
 * @param {int} seconds, value to round in seconds.
 * @param {Date} d, current date.
 * @return {Date} return rounded date.
 */
function getRoundedDate(seconds, d=Date.now()) {
  const ms = 1000 * seconds; // convert seconds to ms;
  return Math.floor(d / ms) * ms;
}

/**
 * Get garden data from user params or set new one
 * @param {obj} conv, the conversation object.
 * @return {obj} gridTemplateData based on id.
 */
function getGardenTemplate(conv) {
  const gridData = new GridData();
  let templateId;

  if (conv.user.params['gardenTemplateId']) {
    templateId = conv.user.params['gardenTemplateId'];
  } else {
    // generate random value
    const id = Math.floor(Math.random() * gridData.getlength());
    conv.user.params['gardenTemplateId'] = templateId = id;
  }
  return gridData.getData(templateId);
}

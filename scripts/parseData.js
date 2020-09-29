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

const path = require("path");
const csv = require("csvtojson/v1");
const fs = require("fs-extra");
const async = require("async");
const axios = require("axios");
const Blob = require("node-blob");

const idGoogleDoc = "";
const format = "csv";
const sheetIdContent = 67664178;

async.waterfall([
    getCsvContent = (step) => { // eslint-disable-line
        axios.get("https://docs.google.com/spreadsheets/d/" + idGoogleDoc + "/export?format=" + format + "&id=" + idGoogleDoc + "&gid=" + sheetIdContent)
            .then((result)=>{
                fs.createWriteStream(path.resolve(__dirname, "csv", "data.csv")).write(new Blob([result.data]).buffer);
                step(null);
            });
    },
    parseCSVs = (step) => {
        const inData = path.resolve(__dirname, "csv", "data.csv");
        let data = {
            scenes: {
                device_error: "Sorry, this device does not support Interactive Canvas!",
                welcome_tts: "<audio src=\"https://actions-on-gnome-garden.firebaseapp.com/assets/sound/splash_screen.mp3\"/><prosody volume=\"silent\">welcome screen</prosody>",
                story_tts: "<audio src=\"https://actions-on-gnome-garden.firebaseapp.com/assets/sound/prologue_screen.mp3\"/><prosody volume=\"silent\">story screen</prosody>",
                story_suggestion: ["Skip"],
                onboarding_tts: "There you are! It’s a pleasure to meet you!<break time=\"1\"/> M’name’s Gnorman. If it’s ok with you, I’d love to help look after your garden!<break time=\"1\"/> As you can see, we have some work to do. Here’s how it works.<break time=\"1\"/> Every now ‘n then, I’ll ask you a question, and your answer will guide my magic and enhance the garden accordingly.",
                onboarding_suggestion: ["Skip"],
                onboarding2_tts: "And it’s as easy as that!<break time=\"1\"/> If you ever get hung up on a question, simply say SKIP and we’ll move on to the next one.<break time=\"1\"/> And if you ever want to start fresh again, just say NEW GARDEN.<break time=\"1\"/> Let’s Go!",
                onboarding2_tos: "And it’s as easy as that! If you ever get hung up on a question, simply say SKIP and we’ll move on to the next one. And if you ever want to start fresh again, just say NEW GARDEN. Let’s Go!",
                onboarding2_suggestion: ["Skip"],
                onboarding_weeding_tts: "Oh no! It looks like some pesky weeds have started to grow in our lovely garden.<break time=\"1\"/> Have no fear, I happen to be a weeding wizard.<break time=\"1\"/> Would you like me to take care of them?",
                onboarding_weeding_tos: "Oh no! It looks like some pesky weeds have started to grow in our lovely garden. Have no fear, I happen to be a weeding wizard.",
                onboarding_weeding_suggestion: ["Weed the garden"],
                weeding_response_tts: "All set! If you ever see weeds creeping in again, simply say “WEED THE GARDEN” and I’ll take quick care of them.",
                weeding_response_tos: "All set! If you ever see weeds creeping in again, simply say “WEED THE GARDEN” and I’ll take quick care of them.",
                skip_weeding_response_tts: "Ok, I'll let the weeds grow for now. If you'd like them gone in the future, just say \"WEED THE GARDEN\"",
                skip_weeding_response_tos: "Ok, I'll let the weeds grow for now. If you'd like them gone in the future, just say \"WEED THE GARDEN\"",
                game_over_tts: "Would you look at that, your garden is all filled in! What a beautiful site.<break time=\"1\"/> Would you like to remove an item, or start a new garden?",
                game_over_tos: "Would you look at that, your garden is all filled in! What a beautiful site. Would you like to remove an item, or start a new garden?",
                game_over_suggestion: ["Remove", "New Garden"],
                confirm_new_garden_tts: "Fantastic idea! A fresh start sounds lovely. Just so you know, this will get rid of your current garden. Are you sure you want to start a new one?",
                confirm_new_garden_tos: "Fantastic idea! A fresh start sounds lovely. Just so you know, this will get rid of your current garden. Are you sure you want to start a new one?",
                new_garden_tts: "New garden, coming right up!",
                confirm_new_garden_suggestion: ["New Garden", "Current Garden"],
                remove_intro_tts: "Excellent idea, check out the screen and say the number of the plant you'd like to remove?",
                remove_intro_tos: "Excellent idea, check out the screen and say the number of the plant you'd like to remove?",
                remove_response_tts: "Great choice, let me clear that space right up.",
                remove_response_tos: "Great choice, let me clear that space right up.",
                remove_end_tts: "Say DONE to get back to planting, or REMOVE to clear up more space",
                remove_end_tos: "Say \"DONE\" to get back to planting, or \"REMOVE\" to clear up more space",
                remove_end_suggestion: ["Done", "Remove"],
                menu_tts: "You can start a new garden. Hear instructions. Adjust the Sound. Adjust the Music. Or keep playing.",
                instructions_tts: "You only need to remember a few words to play. Skip. New Garden. Remove. Weed the Garden. Menu. Exit."
              },
              gnome_responses: {
                gnome_moving_sound: "<audio src=\"https://actions-on-gnome-garden.firebaseapp.com/assets/sound/gnome_exit+enter.mp3\"/><break time=\"0.75\"/>",
                default_response: "Good choice, I like your style!",
                growing_response_start: "<audio src=\"https://actions-on-gnome-garden.firebaseapp.com/assets/sound/object_growing.mp3\"/>",
                growing_response_end: "<break time=\"5\"/>",
                question_skip: "Well alright then, let's move on to the next question.",
                question_both: "They do both sound nice, but unfortunately you'll have to pick one!",
                question_repeat: "Certainly...",
                question_nomatch_1: [
                  "I don't quite follow...",
                  "Sorry, I missed that...",
                  "I didn't quite catch that...",
                  "Hmmm, let's try that again...",
                  "Oops! let me ask again..."
                ],
                question_nomatch_2: [
                  "Let me try one more time...",
                  "Unfortunately I still don't understand...",
                  "I'm afraid I missed that again...",
                  "Shoot, I still didn't catch that...",
                  "Oh no, I still didn't hear you correctly..."
                ],
                question_nomatch_3: [
                  "Sorry friend. I still didn't catch that. But come back and garden with me again soon. Simply say, \"OK GOOGLE, TURN ON GNOME GARDEN\""
                ],
                default_nomatch_1: "I didn't catch that. Say Next to continue.",
                default_nomatch_2: "I'm sorry, I still missed that. Say Next to continue.",
                default_nomatch_3: "Sorry friend. I still didn't catch that. But come back and garden with me again soon.",
                remove_nomatch_1: "I didn't catch that. Say a number that appears on the screen, to remove an area of plants.",
                remove_nomatch_2: "I'm sorry, I still missed that. Say a number from the screen to remove plants.",
                remove_nomatch_3: "Sorry friend. I still didn't catch that. But come back and garden with me again soon.",
                remove_end_nomatch_1: "I didn't catch that. Say \"DONE\" to get back to planting, or \"REMOVE\" to clear up more space",
                remove_end_nomatch_2: "I'm sorry, I still missed that. Say \"DONE\" to get back to planting, or \"REMOVE\" to clear up more space.",
                remove_end_nomatch_3: "Sorry friend. I still didn't catch that. But come back and garden with me again soon.",
                gardenfull_nomatch_1: "I didn't quite catch that. Say \"REMOVE\" to clear up some space in your garden, or \"NEW GARDEN\" to start over.",
                gardenfull_nomatch_2: "Sorry, I still missed that, try saying \"REMOVE\" or \"NEW GARDEN\"",
                gardenfull_nomatch_3: "Sorry friend, I still didn't catch that. But come back and garden with me again soon.",
                newgarden_nomatch_1: "I missed that. Say \"NEW\" to start over, or \"RESUME\" to keep working.",
                newgarden_nomatch_2: "I'm sorry, I still didn't catch that. Say \"NEW\" to start over, or \"RESUME\" to keep working.",
                newgarden_nomatch_3: "Sorry friend, I still didn't catch that. But come back and garden with me again soon.",
                settings_nomatch_1: "Say a command from the screen to proceed.",
                settings_nomatch_2: "Keep Playing. Instructions. New Garden. Music. Sound. Exit.",
                settings_nomatch_3: "Sorry friend. I still didn't catch that. But come back and garden with me again soon.",
                instructions_nomatch_1: "Say a command from the screen to proceed.",
                instructions_nomatch_2: "Resume Playing. New Garden. Remove. Weed the Garden. Menu. Exit.",
                instructions_nomatch_3: "Sorry friend. I still didn't catch that. But come back and garden with me again soon.",
                game_exit: "See you later. You know where to find me.",
            },
        };
        data.questions = {
            flowers: [
                {
                    question_tts: "Here’s an easy one. fruits or vegetables? What do you fancy more.",
                    question_tos: "Here’s an easy one: fruits or vegetables, what do you fancy more?",
                    question_type: "flowers",
                    answer: {
                        fruits: {
                            response_tts: "Fruits! I’ve always loved a fresh bowl of fruit. There we are, a patch of grapes! Not much maybe, but a wonderful start.",
                            response_tos: "Fruits! I’ve always loved a fresh bowl of fruit. There we are, a patch of grapes! Not much maybe, but a wonderful start.",
                            update: {
                                asset_id: "grapes",
                                asset_type: "flowers"
                            }
                        },
                        vegetables: {
                            response_tts: "Vegetables! I’ve always loved a plate of fresh veggies. There we are, a lettuce patch! Not much maybe, but a wonderful start.",
                            response_tos: "Vegetables! I’ve always loved a plate of fresh veggies. There we are, a lettuce patch! Not much maybe, but a wonderful start.",
                            update: {
                                asset_id: "lettuce",
                                asset_type: "flowers"
                            }
                        }
                    }
                }
            ],
            path: [],
            background: [],
            seat: [],
            secondary: [],
            hero: [],
        };

        csv({delimiter: [","], ignoreEmpty: true}).fromFile(inData).on("csv", (csvRow)=>{
            if(csvRow[2] !== ""){
                let entry = {
                    question_tts: `${csvRow[0].toLowerCase()}`,
                    question_tos: `${csvRow[1]}`,
                    answer: {},
                }
                let type = `${csvRow[6].toLowerCase()}`;
                csvRow.splice(0,2);
                let numberOfAnswers = csvRow.length / 5;
                for(let i=0; i < numberOfAnswers; i++){
                    let offset = (i*5);
                    entry.answer[csvRow[offset].toLowerCase()] = {
                        // response_tts: `${csvRow[offset+1].toLowerCase().replace(/\b(\w+)\W*$/, "<mark name=\"UPDATE\"/> $1")}`,
                        response_tts: `${csvRow[offset+1].toLowerCase()}`,
                        response_tos: `${csvRow[offset+2]}`,
                        update: {
                            asset_id: `${csvRow[offset+3].toLowerCase()}`,
                            asset_type: `${csvRow[offset+4].toLowerCase()}`
                          }
                    };
                }
                data.questions[type].push(entry);
            }
        }).on("done", ()=>{
            const dir = `../spa/data/`;
            const file = `gameData.json`;
            if (!fs.existsSync(dir)) fs.mkdirSync(dir);
            fs.writeFileSync(dir + file, JSON.stringify(data), {encoding: "utf8"});
            console.log(`Dummy data generated in ${dir + file}.`);
        });

        console.log(`Starting Dummy Parser for Gnome Garden data`); 
    }
]);

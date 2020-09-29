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

// SoundSprite Generator

const fs = require("fs-extra");
const audiosprite = require('audiosprite');

const FilePath = "./spa/public/assets/sound/sfx/";
const SourcePath = FilePath + 'source/';
let sourceFiles = [];
const outputPath = "./spa/src/assets/data/soundsprite";
const opts = {
    output: FilePath + 'sprite',
    path: 'assets/sound/sfx',
    format: 'howler'
}

fs.readdir(SourcePath, function (err, files) {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }
    files.forEach(function (file) {
        sourceFiles.push(SourcePath + file);
    });

    audiosprite(sourceFiles, opts, function (err, obj) {
        if (err) return console.error(err);
        fs.writeFileSync(`${outputPath}.json`, JSON.stringify(obj, null, 2), {
            encoding: "utf8"
        });
        console.log("sound sprite generated", `${outputPath}.json`);
    })
});


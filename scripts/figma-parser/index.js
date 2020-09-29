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

require("dotenv").config({ path: `${__dirname}/.env` });

const Figma = require("figma-js");
const fs = require("fs");
const logger = require("../utils/logger")();

const figmaToken = process.env.FIGMA_TOKEN;
const fileId = process.env.FIGMA_FILE_ID;
const outputPath = process.env.OUTPUT_PATH;

const fileCanvas = process.env.FIGMA_CANVAS;

const GRID_W = 1000;
const GRID_H = 1000;

const regionRegEx = new RegExp(
  /(sm|md|lg)-(region|hero|tree|trees|seat|path|secondary)-(\d+)/
);

/**
 * Convert the size string to an integer
 * to align with Diego's existing structure.
 */
const getSizeInt = (size, type) => {
  switch (size) {
    case "sm":
      return type === 'region' ? 1.5 : 1;
    case "md":
      return type === 'region' ? 2.4 : 2;
    case "lg":
      return type === 'region' ? 3.2 : 3;
  }
};

/**
 * Retrieve a specific canvas from the Figma File
 */
const getCanvas = async (file, canvas) => {
  const {
    document
  } = file.data;

  return document.children.find(
    (child) => child.type === "CANVAS" && child.name === canvas
  );
};

/**
 * Get all the "Garden" named frames from the canvas
 * object we selected.
 *
 * Garden frames are named in the following format:
 * - garden (int) - grid
 *
 * This is filtered via. a regex.
 */
const getGardens = async (frames) => {
  const regex = new RegExp(/garden\s*\d+\s*-\s*grid/);

  return frames.filter((frame) => {
    return regex.test(frame.name);
  });
};

/**
 * Normalize a number for a grid node
 * -1 and 1.
 */
const normalize = (val, min, max) => 2 * ((val - min) / (max - min)) - 1;
/**
 * Calculate a nodes specifc position based on the
 * coordinates of the frame it sits within.
 *
 * Then, Based off that position, calculate the relative
 * position for the x / y and return an object.
 */
const parseNode = (node, offset) => {
  const {
    x,
    y
  } = node.absoluteBoundingBox;
  const relX = x - offset.x;
  const relY = y - offset.y;

  return {
    x: Number(normalize(relX, 0, GRID_W).toFixed(2)),
    y: Number(normalize(relY, 0, GRID_H).toFixed(2)),
  };
};

/**
 * Get all the nodes from the supplied region, along
 * with region details (calculated from the name), and
 * get their relative postion from the offset object.
 *
 * This also checks if the supplied region is a group
 * of a group, and handles it accordingly.
 */
const parseRegion = (region, offset, id) => {
  logger.info(`  - Parsing Region - ${region.name}`);
  const [name, size_str, type, figma_id] = region.name.match(regionRegEx);

  let nodes = [];
  let gnome_pos;
  let id_pos;

  region.children.forEach((node) => {
    if (node.type === 'GROUP') {
      const groupNodes = node.children
        .filter(childNode => {
          if (childNode.name === 'gnome' ) {
            gnome_pos = parseNode(childNode, offset);
          }

          if (childNode.name == 'id') {
            id_pos = parseNode(childNode, offset);
          }

          return childNode.name !== 'gnome' && childNode.name !== 'id';
        })
        .map(childNode => {
          return parseNode(childNode, offset);
        });

      nodes = [...nodes, ...groupNodes];
    } else {
      if (node.name === 'gnome' ) {
        gnome_pos = parseNode(node, offset);
      } else if (node.name == 'id') {
        id_pos = parseNode(node, offset);
      } else {
        nodes.push(parseNode(node, offset));
      }
    }
  });

  // Set the position of the Gnome and Removal ID
  const {
    x,
    y
  } = region.children[0].absoluteBoundingBox;

  if (!gnome_pos) {
    gnome_pos = parseNode({
        absoluteBoundingBox: {
          x: x - 30,
          y: y - 30
        }
      },
      offset
    );
  }

  if (!id_pos) {
    id_pos = parseNode({
        absoluteBoundingBox: {
          x: x - 30,
          y: y - 30
        }
      },
      offset
    );
  }

  return {
    id: parseInt(id),
    id_str: name,
    figma_id: figma_id,
    id_pos,
    gnome_pos,
    size: getSizeInt(size_str, type),
    size_str,
    items: nodes,
  };
};

/**
 * Take the frame board and parse through the groups
 * that exist within it. Based on the group name,
 * they will be organized into a property model.
 *
 * All Models follow the same format:
 * {
 *    {type}: {
 *      id: (int),
 *      id_str: (str),
 *      size: (int:1|2|3),
 *      size_str: (str:sm|md|lg)
 *      items: (Array:<{x, y}>)
 *    }
 * }
 */
const parseGarden = (frame) => {
  const {
    x,
    y
  } = frame.absoluteBoundingBox;
  const garden = {
    flowers: [],
    path: [],
    background: [],
    hero: [],
    seat: [],
    secondary: [],
  };

  let index = 0;
  let prop;

  frame.children.forEach((child) => {
    let removeable = false;

    if (child.name === "viewing area") return;
    if (child.name === "grid") return;

    switch (child.name) {
      case "hero":
        child.name = `lg-hero-${index}`;
        prop = "hero";
        break;
      case "seat":
        child.name = `lg-seat-${index}`;
        prop = "seat";
        break;
      case 'lg-path':
        child.name = `lg-path-${index}`;
        prop = 'path';
        break;
      case 'md-path':
        child.name = `md-path-${index}`;
        prop = 'path';
        break;
      case 'sm-path':
      case 'path':
        child.name = `sm-path-${index}`;
        prop = 'path';
        break;
      case "secondary":
        child.name = `md-secondary-${index}`;
        prop = "secondary";
        break;
      case "tree":
      case "trees":
      case "background":
        child.name = `lg-tree-${index}`;
        prop = "background";
        break;
      default:
        removeable = true;
        prop = "flowers";
    }

    garden[prop].push({
      ...parseRegion(child, {
        x,
        y
      }, index),
      removeable
    });
    index++;
  });

  return garden;
};

(async () => {
  const client = Figma.Client({
    personalAccessToken: figmaToken,
  });
  logger.log(fileCanvas);
  logger.info(`Loading Figma File: ${fileId}`);
  const figmaFile = await client.file(fileId);

  logger.info(`Finding the Canvas: ${fileCanvas}`);
  const canvas = await getCanvas(figmaFile, fileCanvas);

  logger.info(`Looking for Garden Templates in our Canvas`);
  const gardens = await getGardens(canvas.children);

  gardens.map((garden) => {
    logger.info(`Parsing Garden: ${garden.name}`);
    const data = parseGarden(garden);
    const fileName = garden.name.replace(/\s+/g, "");

    logger.info(
      `Writing output to file ${__dirname}/${outputPath}/${fileName}.json`
    );
    fs.writeFileSync(
      `${__dirname}/${outputPath}/${fileName}.json`,
      JSON.stringify(data, null, 4)
    );
  });
})();
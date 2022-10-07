"use strict";

import * as display from "./display.js";
import * as windows from "./windows.js";

document.addEventListener("DOMContentLoaded", init);

let displayInfo;

async function init() {
  await getDisplays();
  setupDisplayChooser();
  setupListeners();
}

async function getDisplays() {
  displayInfo = await display.getDisplayInfo();
}

function setupDisplayChooser() {
  let select = document.getElementById("displayChooser");

  // Sanity check
  if (!displayInfo || displayInfo.length === 0) {
    let option = document.createElement("option");
    option.text = chrome.i18n.getMessage("no_display");
    select.appendChild(option);
    return;
  }

  for (let display of displayInfo) {
    let option = document.createElement("option");

    if (display.name) {
      option.text = display.name;
    } else {
      option.text =
        chrome.i18n.getMessage("display") +
        " (" +
        display.bounds.width +
        " x " +
        display.bounds.height +
        ")";
    }

    option.value = display.id;

    select.appendChild(option);
  }

  selectCurrentDisplay();
}

async function selectCurrentDisplay() {
  let select = document.getElementById("displayChooser");
  let currentWindow = await windows.getCurrentWindow();
  let index = 0;

  let wt = currentWindow.top;
  let wl = currentWindow.left;
  let wr = currentWindow.width + wl;
  let wb = currentWindow.height + wt;

  displayInfo.forEach(function (display, i) {
    let dt = display.bounds.top;
    let dl = display.bounds.left;
    let dr = display.bounds.width + dl;
    let db = display.bounds.height + dt;

    if (wt >= dt && wt <= db && wl >= dl && wl <= dr) {
      index = i;
    } else if ((wt < dt && wt <= db) || (wl < dl && wl <= dr)) {
      if (wb >= dt && wb <= db && wr >= dl && wr <= dr) {
        index = i;
      }
    }
  });

  select.selectedIndex = index;
}

function setupListeners() {
  let layouts = document.querySelectorAll(".layout-option");

  for (let item of layouts) {
    item.addEventListener("click", onLayoutsClicked);
  }
}

async function onLayoutsClicked(e) {
  if (!displayInfo || displayInfo.length === 0) {
    return;
  }

  let windowsToBeSized = e.target.querySelectorAll(".win");

  let existingWindows = await windows.getWindows();
  let currentWindow = await windows.getCurrentWindow();

  let indexOfCurrent = existingWindows.findIndex((object) => {
    return object.id === currentWindow.id;
  });

  existingWindows.unshift(existingWindows.splice(indexOfCurrent, 1)[0]);

  let numberToBeSized = windowsToBeSized.length;
  let numberOfExisting = existingWindows.length;

  let n = 0;

  windowsToBeSized.forEach((sizedWindow, i) => {
    let winDimensions = getWinDimentions(sizedWindow);

    if (n >= numberOfExisting) {
      windows.createWindow(winDimensions);
    } else {
      // I need to always start with the current window
      let existingWindow = existingWindows[i];
      windows.setWindowSize(existingWindow.id, winDimensions);
      n++;
    }
  });

  if (numberToBeSized < numberOfExisting) {
    existingWindows.forEach((existingWindow, i) => {
      if (i + 1 > n) {
        windows.updateWindowState(existingWindow.id, "minimized");
      }
    });
  }
}

function getWinDimentions(win) {
  let workArea;
  let dimensions = {};

  if (displayInfo.length > 1) {
    let displayId = document.getElementById("displayChooser").value;
    let selectedDisplay = displayInfo.filter((obj) => {
      return obj.id === displayId;
    });

    workArea = selectedDisplay[0].workArea;
  } else {
    workArea = displayInfo[0].workArea;
  }

  // Y value
  switch (win.dataset.y) {
    case "row_0":
      dimensions.top = workArea.top;
      break;
    case "row_50":
      dimensions.top = Math.floor(workArea.height / 2 + workArea.top);
      break;
  }

  // X value
  switch (win.dataset.x) {
    case "keyline_0":
      dimensions.left = workArea.left;
      break;
    case "keyline_50":
      dimensions.left = Math.floor(workArea.width / 2 + workArea.left);
      break;
    case "keyline_33":
      dimensions.left = Math.floor(workArea.width / 3 + workArea.left);
      break;
    case "keyline_66":
      dimensions.left = Math.floor((workArea.width / 3) * 2 + workArea.left);
      break;
  }

  // Width
  switch (win.dataset.w) {
    case "full":
      dimensions.width = workArea.width;
      break;
    case "half":
      dimensions.width = Math.floor(workArea.width / 2);
      break;
    case "third":
      dimensions.width = Math.floor(workArea.width / 3);
      break;
    case "twoThirds":
      dimensions.width = Math.floor((workArea.width / 3) * 2);
      break;
  }

  // Height
  switch (win.dataset.h) {
    case "full":
      dimensions.height = workArea.height;
      break;
    case "half":
      dimensions.height = Math.floor(workArea.height / 2);
      break;
  }

  return dimensions;
}

"use strict";

export function getDisplayInfo() {
  return new Promise((resolve, reject) => {
    chrome.system.display.getInfo(function (value) {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
      }
      resolve(value);
    });
  });
}

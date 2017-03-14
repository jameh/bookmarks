exports.get = function(category, callback) {
  chrome.storage.sync.get(category || null, callback);
};

exports.set = function(obj, callback) {
  chrome.storage.sync.set(obj, callback);
};

exports.clear = function(callback) {
  chrome.storage.sync.clear(callback);
};

exports.remove = function(category) {
  chrome.storage.sync.remove(category);
};

exports.onChanged = {
  addListener: function(callback) {
    chrome.storage.onChanged.addListener(function(changes, areaName) {
      if (areaName !== "sync") {
        return;
      }
      callback(changes);
    });
  }
};
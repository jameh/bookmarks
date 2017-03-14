exports.get = function(category, callback) {
  chrome.storage.sync.get(category || null, callback);
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
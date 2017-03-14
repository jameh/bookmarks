// Class file for bookmarks list element

var data = require("../common/data.js");

module.exports = function(listElement, categorySelect) {

  data.onChanged.addListener(updateFromStorage);
  categorySelect.addEventListener("change", updateBookmarksList);

  function buildBookmarksList() {
    data.get(categorySelect.getValue(), function(storage) {
      if (!storage.hasOwnProperty(categorySelect.getValue())) {
        return;
      }
      // otherwise, assume storage is well-formed
      var nodes = storage[categorySelect.getValue()].nodes;
      for (var url in nodes) {
        if (nodes.hasOwnProperty(url)) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          a.href = url;
          a.textContent = nodes[url].label;
          li.appendChild(a);
          listElement.appendChild(li);
        }
      }
    });
  }

  function updateBookmarksList() {
    while(listElement.firstChild) {
      listElement.removeChild(listElement.firstChild);
    }
    buildBookmarksList();
  }

  function updateFromStorage(changes) {
    for (var category in changes) {
      if (changes.hasOwnProperty(category)) {
        if (category === categorySelect.getValue()) {
          updateBookmarksList();
          break;
        }
      }
    }
  }
  categorySelect.addEventListener("ready", buildBookmarksList);
};

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{}],2:[function(require,module,exports){
module.exports = function(text) {
  console.log(text);
};
},{}],3:[function(require,module,exports){
var NewCategoryForm = require("./popup/NewCategoryForm.js"),
    newCategoryFormElement = document.getElementById("new-category-form"),
    newCategoryForm = new NewCategoryForm(newCategoryFormElement);

var CategoryList = require("./popup/CategoryList.js"),
    categoryListElement = document.getElementById("category-list"),
    categoryList = new CategoryList(categoryListElement);

var ClearAllButton = require("./popup/ClearAllButton.js"),
    clearAllButtonElement = document.getElementById("clear-all-button"),
    clearAllButton = new ClearAllButton(clearAllButtonElement, categoryList);

},{"./popup/CategoryList.js":4,"./popup/ClearAllButton.js":5,"./popup/NewCategoryForm.js":6}],4:[function(require,module,exports){
var data = require("../common/data.js");
var log = require("../common/log.js");

module.exports = function(listElement) {

  function populateCategoryList() {
      var categoryList = document.getElementById("category-list"); // ul element
      data.get(null, function(storage) {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          var tab = tabs[0];
          for (var category in storage) {
            if (storage.hasOwnProperty(category)) {
              var li = document.createElement("li");
              var button = document.createElement("button");
              button.classList.add("btn");
              button.classList.add("category-button");
              // check if current tab's url is in storage[category].nodes
              if (storage[category].nodes.hasOwnProperty(tab.url)) {
                button.classList.add("btn-success");
              }
              button.textContent = category;

              var hideButtonDiv = document.createElement("div");
              hideButtonDiv.classList.add("hide-button");
              var hideButtonIcon = document.createElement("i");
              hideButtonIcon.classList.add("ion-close-circled");
              hideButtonDiv.appendChild(hideButtonIcon);

              hideButtonDiv.addEventListener("click", deleteButtonClick);

              var mapButtonDiv = document.createElement("div");
              mapButtonDiv.classList.add("map-button");
              var mapButtonA = document.createElement("a")

              button.addEventListener("click", categoryButtonClick);
              li.appendChild(button);
              li.appendChild(hideButtonDiv);
              categoryList.appendChild(li);
            }
          }
        });
      })
    }

    function categoryButtonClick(e) {
      var button = this;
      var category = this.textContent;
      data.get(category, function(storage) {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          var tab = tabs[0];
          var removed = false;
          if (storage[category].nodes.hasOwnProperty(tab.url)) {
            // remove it
            delete storage[category].nodes[tab.url];
            delete storage[category].urlsByTabId[tab.id][tab.url];
            if (storage[category].urlsByTabId[tab.id].newest === tab.url) {
              // find newest
              var newest = null;
              var isEmpty = true;
              for (var url in storage[category].urlsByTabId[tab.id]) {
                if (storage[category].urlsByTabId[tab.id].hasOwnProperty(url)) {
                  isEmpty = false;
                  if (newest < storage[category].urlsByTabId[tab.id][url]) {
                    newest = url;
                  }
                }
              }
              if (isEmpty) {
                // delete the whole tab id
                delete storage[category].urlsByTabId[tab.id];
              } else {
                storage[category].urlsByTabId[tab.id].newest = newest;
              }
            }
            // ensure class reflects the storage state.
            if (button.classList.contains("btn-success")) {
              button.classList.remove("btn-success");
            }
          } else {
            // add it
            storage[category].nodes[tab.url] = {
              label: tab.title,
              tabId: tab.id
            };
            // add tab id
            if (!storage[category].urlsByTabId.hasOwnProperty(tab.id)) {
              storage[category].urlsByTabId[tab.id] = {};
            }
            storage[category].urlsByTabId[tab.id][tab.url] = {
              timeStamp: new Date(),
              nextNewest: storage[category].urlsByTabId[tab.id].newest || null
            };
            storage[category].urlsByTabId[tab.id].newest = tab.url;
            // ensure class reflects the storage state.
            if (!button.classList.contains("btn-success")) {
              button.classList.add("btn-success");
            }
          }
          // write to storage
          data.set(storage, function() {
            if (removed) {
              log("Remove url " + tab.url + " from category " + category + ".");
            } else {
              log("Add url " + tab.url + " to category " + category + ".");
            }
          });
        });
      });
    }

    function deleteButtonClick(e) {
      var category = this.parentNode.getElementsByClassName("category-button")[0].textContent;
      this.parentNode.parentNode.removeChild(this.parentNode);
      data.remove(category);
    }

    populateCategoryList();
};
},{"../common/data.js":1,"../common/log.js":2}],5:[function(require,module,exports){
var data = require("../common/data.js");
var log = require("../common/log.js");

module.exports = function(clearAllButtonElement, categoryList) {
  function clearAllButtonClick(e) {
    data.clear(function() {
      while (categoryList.firstChild) {
        categoryList.removeChild(categoryList.firstChild);
      }
      log("Clear all category list data.")
    });
  }
  clearAllButtonElement.addEventListener("click", clearAllButtonClick);
};
},{"../common/data.js":1,"../common/log.js":2}],6:[function(require,module,exports){
var data = require("../common/data.js");
var log = require("../common/log.js");

module.exports = function(formElement) {

  function newCategoryFormSubmit(e) {
    var newCategory = formElement.elements["new-category-text"].value;
    var entry = {};
    entry[newCategory] = { "nodes": {}, "urlsByTabId": {} };
    data.set(entry, function() {
      log("Add new category: " + newCategory);
    });
  }
  formElement.addEventListener("submit", newCategoryFormSubmit);
};
},{"../common/data.js":1,"../common/log.js":2}]},{},[3]);

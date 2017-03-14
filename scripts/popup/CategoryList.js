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
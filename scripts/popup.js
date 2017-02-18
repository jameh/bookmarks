window.onload = function() {

  var gLogLevel = "quiet";

  // Global logging function
  function gLog(x) {
    if (gLogLevel !== "quiet")
      console.log(x);
  }

  // BUTTONS AND FORMS

  // Clear Storage Button
  (function() {
    function clearAllButtonClick(e) {
      function clearCategoryListDOMNodes() {
        var categoryList = document.getElementById("category-list");
        // clear list
        while (categoryList.firstChild) {
          categoryList.removeChild(categoryList.firstChild);
        }
      }
      chrome.storage.sync.clear(function() {
        clearCategoryListDOMNodes();
        gLog("Clear all category list data.")
      });
    }
    var clearAllButton = document.getElementById("clear-all-button");
    clearAllButton.addEventListener("click", clearAllButtonClick);
  })();

  // New Category Form
  (function() {
    function newCategoryFormSubmit(e) {
      var newCategory = document.getElementById("new-category-form-text-input").value;
      var entry = {};
      entry[newCategory] = { "nodes": {}, "urlsByTabId": {} };
      chrome.storage.sync.set(entry, function() {
        gLog("Add new category: " + newCategory);
      });
    }
    var newCategoryForm = document.getElementById("new-category-form");
    newCategoryForm.addEventListener("submit", newCategoryFormSubmit);
  })();

  // CATEGORY LIST POPULATION

  // Populate #category-list ul with a button for each category in storage
  (function() {
    function populateCategoryList() {
      var categoryList = document.getElementById("category-list"); // ul element
      chrome.storage.sync.get(null, function(storage) {
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
      console.log(category);
      chrome.storage.sync.get(category, function(storage) {
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
          chrome.storage.sync.set(storage, function() {
            if (removed) {
              gLog("Remove url " + tab.url + " from category " + category + ".");
            } else {
              gLog("Add url " + tab.url + " to category " + category + ".");
            }
          });
        });
      });
    }

    function deleteButtonClick(e) {
      var category = this.parentNode.getElementsByClassName("category-button")[0].textContent;
      this.parentNode.parentNode.removeChild(this.parentNode);
      chrome.storage.sync.remove(category);
    }

    populateCategoryList();
  })();

};
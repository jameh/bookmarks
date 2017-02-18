window.onload = function() {

  var categorySelect = document.getElementById("category-select");
  var categorySelectReady = new Event("_ready");

  (function buildCategorySelect(categorySelect) {

    // Get categories from db, build menu
    chrome.storage.sync.get(null, function(storage) {
      for (var category in storage) {
        if (storage.hasOwnProperty(category)) {
          var option = document.createElement("option");
          option.text = category;
          categorySelect.appendChild(option);
        }
      }
      chrome.storage.onChanged.addListener(updateCategorySelect);
      categorySelect.dispatchEvent(categorySelectReady);
    });

    function updateCategorySelect(changes, areaName) {
      if (areaName !== "sync") {
        return;
      }
      for (var category in changes) {
        if (changes.hasOwnProperty(category)) {
          if (changes[category].newValue && !changes[category].oldValue) {
            // add new option
            var option = document.createElement("option");
            option.text = category;
            option.value = category;
            categorySelect.appendChild(option);
          } else if (changes[category].oldValue && !changes[category].newValue) {
            // remove old option
            // var option = categorySelect.options.filter(function(o) {
            //   return o.text === category;
            // })[0];
            // categorySelect.removeChild(option);
            categorySelect.remove(category);
          }
        }
      }
    }

  })(categorySelect);

  (function buildBookmarksList(categorySelect) {

    var bookmarksList = document.getElementById("bookmarks-list");

    function _buildBookmarksList() {
      chrome.storage.sync.get(categorySelect.value, function(storage) {
        if (!storage.hasOwnProperty(categorySelect.value)) {
          return;
        }
        // otherwise, assume storage is well-formed
        var nodes = storage[categorySelect.value].nodes;
        for (var url in nodes) {
          if (nodes.hasOwnProperty(url)) {
            var li = document.createElement("li");
            var a = document.createElement("a");
            a.href = url;
            a.textContent = nodes[url].label;
            // var deleteIcon = document.createElement("i");
            // deleteIcon.classList.add("ion-close-round");
            // deleteIcon.classList.add("delete-icon");
            // deleteIcon.addEventListener("click", deleteIconClick);
            li.appendChild(a);
            // li.appendChild(deleteIcon);
            bookmarksList.appendChild(li);
          }
        }
      });
    }

    function updateBookmarksList() {
      clearBookmarksList();
      _buildBookmarksList();
    }

    function clearBookmarksList() {
      while(bookmarksList.firstChild) {
        bookmarksList.removeChild(bookmarksList.firstChild);
      }
    }

    function deleteIconClick(e) {
      var category = categorySelect.value;
      var url = this.parentNode.getElementsByTagName("a")[0].href;
      chrome.storage.sync.get(category, function(storage) {
        var nodes = storage[category].nodes;
        delete nodes[url];
        storage[category].nodes = nodes;
        chrome.storage.sync.set(storage);
      })
    }

    function updateFromStorage(changes, areaName) {
      if (areaName !== "sync") {
        return;
      }
      for (var category in changes) {
        if (changes.hasOwnProperty(category)) {
          if (category === categorySelect.value) {
            updateBookmarksList();
          }
        }
      }
    }

    categorySelect.addEventListener("_ready", _buildBookmarksList);
    categorySelect.onchange = updateBookmarksList;
    chrome.storage.onChanged.addListener(updateFromStorage);

  })(categorySelect);

  // Network Map, using d3js
  (function(categorySelect) {
    var categoryList = document.getElementById("category-list-map");
    

    // Create toggle buttons for categories to control network graph
    function populateCategoryList() {

      while(categoryList.firstChild) {
        categoryList.removeChild(categoryList.firstChild);
      }

      chrome.storage.sync.get(null, function(storage) {
        for (var category in storage) {
          if (storage.hasOwnProperty(category)) {
            var li = document.createElement("li");
            var button = document.createElement("button");
            button.classList.add("btn");
            button.classList.add("category-button");
            button.textContent = category;

            button.addEventListener("click", categoryButtonClick);
            li.appendChild(button);
            categoryList.appendChild(li);
          }
        }
        var categoryButtonsReady = new Event("category-buttons-ready");
        categoryList.dispatchEvent(categoryButtonsReady);
      });

      function categoryButtonClick(e) {
        // style first ;)
        if (this.classList.contains("btn-success")) {
          this.classList.remove("btn-success");
        } else {
          this.classList.add("btn-success");
        }
        categorySelect.value = this.textContent;
        var event = new UIEvent("change", {
          "view": window,
          "bubbles": true,
          "cancelable": true
        });
        categorySelect.dispatchEvent(event);
      }
    }
    chrome.storage.onChanged.addListener(populateCategoryList);
    populateCategoryList();

    // Return subset of nodes according to highlighted categories
    function filterNodesByCategories(storage) {
      var btns = categoryList.getElementsByClassName("btn-success");
      
      var filteredNodes = {};
      for (var i = 0; i < btns.length; i++) {
        filteredNodes[btns[i].textContent] = storage[btns[i].textContent];
      }
      return filteredNodes;
    }

    // Return subset of links according to highlighted categories
    function filterLinksByCategories(storage) {
      var btns = categoryList.getElementsByClassName("btn-success");
      console.log("getting link data");
      console.log(btns)
      
      var filteredLinks = [];
      // format { source: lala, target: lolo }
      for (var i = 0; i < btns.length; i++) {
        var category = btns[i].textContent;
        console.log("getting data for category")
        console.log(category)
        console.log("storage:")
        console.log(storage);
        for (var tabId in storage[category].urlsByTabId) {
          if (storage[category].urlsByTabId.hasOwnProperty(tabId)) {
            var newestUrl = storage[category].urlsByTabId[tabId].newest;
            var newestNode = storage[category].urlsByTabId[tabId][newestUrl];
            console.log(storage[category])
            console.log(tabId)
            while(newestNode.nextNewest !== null) {
              var nextNewestNode = storage[category].urlsByTabId[tabId][newestNode.nextNewest];
              filteredLinks.push({ source: newestNode.nextNewest, target: newestUrl});
              newestNode = nextNewestNode;
            }
          }
        }
      }
      return filteredLinks;
    }

    // Put nodes data into an array, add category info to node
    function preProcessNodesData(data) {
      var processedData = {};
      for (var category in data) {
        if (data.hasOwnProperty(category)) {
          for (var nodeId in data[category].nodes) {
            if (data[category].nodes.hasOwnProperty(nodeId)) {
              if (processedData.hasOwnProperty(nodeId)) {
                // just modify and add current category
                processedData[nodeId].categories.push(category);
              } else {
                // make new entry
                processedData[nodeId] = data[category].nodes[nodeId];
                processedData[nodeId].categories = [category];
                processedData[nodeId].id = nodeId;
              }
            }
          }
        }
      }

      var dataArr = [];
      for (var nodeId in processedData) {
        if (processedData.hasOwnProperty(nodeId)) {
          dataArr.push(processedData[nodeId]);
        }
      }
      return dataArr;
    }

    function createMap() {
      var svg = d3.select("#map-svg"),
          width = +svg.attr("width"),
          height = +svg.attr("height");
      var linkGroup = svg.append("g")
          .attr("class", "links");
      var nodeGroup = svg.append("g")
          .attr("class", "nodes");
      var color = d3.scaleOrdinal(d3.schemeCategory20);

      var link = linkGroup.selectAll("line")
        .data([]);
      var node = nodeGroup.selectAll("node")
        .data([]);

      var simulation = null;

      function redraw() {
        if (simulation) {
          simulation.stop();
          node.data([])
            .exit().remove();
          link.data([])
            .exit().remove();
        }
        chrome.storage.sync.get(null, function(storage) {

          // Get new data set
          var curNodesData = preProcessNodesData(filterNodesByCategories(storage));
          var curLinksData = filterLinksByCategories(storage);

          console.log(curNodesData);
          console.log(curLinksData);

          link = linkGroup.selectAll("line")
            .data(curLinksData)
            .enter().append("line")
              .attr("stroke", "#ccc")
              .attr("stroke-width", "2px");

          node = nodeGroup.selectAll("circle")
            .data(curNodesData)
            .enter().append("circle")
              .attr("r", 10)
              .attr("fill", function(d) { return color(d.categories[0]); });

          node.append("title")
              .text(function(d) { return d.label; });

          // Create physics simulation
          simulation = d3.forceSimulation(curNodesData)
              .force("charge", d3.forceManyBody())
              .force("center", d3.forceCenter(width / 2, height / 2))
              .force("link", d3.forceLink(curLinksData).id(function(d) { return d.id; }))
              .on("tick", ticked);

            

          function ticked() {
            link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            node
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
          }
        });
      }

      chrome.storage.onChanged.addListener(function(changes, areaName) {
        if (areaName !== "sync") {
          return;
        }
        redraw();
      });
      categoryList.addEventListener("category-buttons-ready", function(e) {
        var btns = this.getElementsByClassName("category-button");
        for (var i = 0; i < btns.length; i++) {
          console.log(btns[i])
          btns[i].addEventListener("click", redraw);
        }
      });
    }
    createMap();


  })(categorySelect);
}
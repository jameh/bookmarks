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
var data = require("./common/data.js");

var CategorySelect = require("./map/CategorySelect.js"),
    categorySelectElement = document.getElementById("category-select"),
    categorySelect = new CategorySelect(categorySelectElement);

var BookmarksList = require("./map/BookmarksList.js"),
    bookmarksListElement = document.getElementById("bookmarks-list"),
    bookmarksList = new BookmarksList(bookmarksListElement, categorySelect);

var CategoryList = require("./map/CategoryList.js"),
    categoryListElement = document.getElementById("category-list"),
    categoryList = new CategoryList(categoryListElement, categorySelect);

var Network = require("./map/Network.js"),
    networkSvg = document.getElementById("map-svg"),
    network = new Network(networkSvg, categoryListElement);

},{"./common/data.js":1,"./map/BookmarksList.js":3,"./map/CategoryList.js":4,"./map/CategorySelect.js":5,"./map/Network.js":6}],3:[function(require,module,exports){
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

},{"../common/data.js":1}],4:[function(require,module,exports){
var data = require("../common/data.js");

module.exports = function(listElement, categorySelect) {

  this.getElementsByClassName = listElement.getElementsByClassName.bind(listElement);
  this.addEventListener = listElement.addEventListener.bind(listElement);

  // Create toggle buttons for categories to control network graph
  function populateCategoryList() {

    while(listElement.firstChild) {
      listElement.removeChild(listElement.firstChild);
    }

    data.get(null, function(storage) {
      for (var category in storage) {
        if (storage.hasOwnProperty(category)) {
          var li = document.createElement("li");
          var button = document.createElement("button");
          button.classList.add("btn");
          button.classList.add("category-button");
          button.textContent = category;

          button.addEventListener("click", categoryButtonClick);
          li.appendChild(button);
          listElement.appendChild(li);
        }
      }
      var categoryButtonsReady = new Event("category-buttons-ready");
      listElement.dispatchEvent(categoryButtonsReady);
    });

    function categoryButtonClick(e) {
      // style first ;)
      if (this.classList.contains("btn-success")) {
        this.classList.remove("btn-success");
      } else {
        this.classList.add("btn-success");
      }
      categorySelect.setValue(this.textContent);
    }
  }
  data.onChanged.addListener(populateCategoryList);
  populateCategoryList();

  

};
},{"../common/data.js":1}],5:[function(require,module,exports){
// Class file for category select element

var data = require("../common/data.js");

module.exports = function(selectElement) {

  this.addEventListener = selectElement.addEventListener.bind(selectElement);
  this.getValue = function() { return selectElement.value; };
  this.setValue = function(value) {
    selectElement.value = value;
    var event = new UIEvent("change", {
      "view": window,
      "bubbles": true,
      "cancelable": true
    });
    selectElement.dispatchEvent(event);
  };

  // Get categories from db, build menu
  data.get(null, function(storage) {
    for (var category in storage) {
      if (storage.hasOwnProperty(category)) {
        var option = document.createElement("option");
        option.text = category;
        selectElement.appendChild(option);
      }
    }
    data.onChanged.addListener(updateCategorySelect);
    selectElement.dispatchEvent(new Event("ready"));
  });

  function updateCategorySelect(changes) {
    for (var category in changes) {
      if (changes.hasOwnProperty(category)) {
        if (changes[category].newValue && !changes[category].oldValue) {
          // add new option
          var option = document.createElement("option");
          option.text = category;
          option.value = category;
          selectElement.appendChild(option);
        } else if (changes[category].oldValue && !changes[category].newValue) {
          // remove old option
          selectElement.remove(category);
        }
      }
    }
  }
};

},{"../common/data.js":1}],6:[function(require,module,exports){
var data = require("../common/data.js");

module.exports = function(svgElement, categoryList) {
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
    
    var filteredLinks = [];
    // format { source: lala, target: lolo }
    for (var i = 0; i < btns.length; i++) {
      var category = btns[i].textContent;
      for (var tabId in storage[category].urlsByTabId) {
        if (storage[category].urlsByTabId.hasOwnProperty(tabId)) {
          var newestUrl = storage[category].urlsByTabId[tabId].newest;
          var newestNode = storage[category].urlsByTabId[tabId][newestUrl];
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
      data.get(null, function(storage) {

        // Get new data set
        var curNodesData = preProcessNodesData(filterNodesByCategories(storage));
        var curLinksData = filterLinksByCategories(storage);

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
        btns[i].addEventListener("click", redraw);
      }
    });
  }
  createMap();
}
},{"../common/data.js":1}]},{},[2]);

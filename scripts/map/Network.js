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
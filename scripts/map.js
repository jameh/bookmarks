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

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
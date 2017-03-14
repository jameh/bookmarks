var data = require("../common/data.js");
var log = require("../common/log.js");

module.exports = function(clearAllButtonElement, categoryList) {
  function clearAllButtonClick(e) {
    data.clear(function() {
      while (categoryList.element.firstChild) {
        categoryList.element.removeChild(categoryList.element.firstChild);
      }
      log("Clear all category list data.")
    });
  }
  clearAllButtonElement.addEventListener("click", clearAllButtonClick);
};
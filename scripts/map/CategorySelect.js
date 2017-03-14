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

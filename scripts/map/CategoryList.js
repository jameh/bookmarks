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
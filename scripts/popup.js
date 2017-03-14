var NewCategoryForm = require("./popup/NewCategoryForm.js"),
    newCategoryFormElement = document.getElementById("new-category-form"),
    newCategoryForm = new NewCategoryForm(newCategoryFormElement);

var CategoryList = require("./popup/CategoryList.js"),
    categoryListElement = document.getElementById("category-list"),
    categoryList = new CategoryList(categoryListElement);

var ClearAllButton = require("./popup/ClearAllButton.js"),
    clearAllButtonElement = document.getElementById("clear-all-button"),
    clearAllButton = new ClearAllButton(clearAllButtonElement, categoryList);

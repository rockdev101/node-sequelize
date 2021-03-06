var express = require("express");
var router = express.Router();
const favoritesController = require("../../../api/controllers/favorites_controller");
const productsController = require("../../../api/controllers/products_controller");

const authPolicy = require("../../../api/policies/auth.policy");

router.get("/getProductsByCategory", authPolicy, function(req, res) {
  return productsController().getByCategory(req, res);
});

router.post("/updateFavorites", authPolicy, function(req, res) {
  return favoritesController().addorDeleteOne(req, res);
});

router.get("/getFavoriteProducts", authPolicy, function(req, res) {
  return favoritesController().getFavoriteProducts(req, res);
});

router.get("/getProductById", authPolicy, function(req, res) {
  return productsController().getById(req, res);
});

module.exports = router;

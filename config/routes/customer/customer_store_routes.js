var express = require("express");
var router = express.Router();
const storeQueryController = require("../../../api/controllers/store/store_query_controller");
const authPolicy = require("../../../api/policies/auth.policy");

router.get("/getStoresByCustomerId", authPolicy, function(req, res) {
  return storeQueryController().getByCustomerId(req, res);
});

router.post("/getStoresByLocation", authPolicy, function(req, res) {
  return storeQueryController().getByLocation(req, res);
});

router.post("/checkAddressWithInStoresRange", authPolicy, function(req, res) {
  return storeQueryController().checkAddressWithInStoresRange(req, res);
});

module.exports = router;

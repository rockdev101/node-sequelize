const db = {};

// All models in the database go here:
db.Customer = require("../../models").Customer;
db.Driver = require("../../models").Driver;
db.StoreUser = require("../../models").StoreUser;
db.Order = require("../../models").Order;
db.LineItem = require("../../models").LineItem;
db.Store = require("../../models").Store;
db.Favorites = require("../../models").Favorites;
db.Product = require("../../models").Product;
db.Inventory = require("../../models").Inventory;
db.UserLocation = require("../../models").UserLocation;
db.Category = require("../../models").Category;
db.Size = require("../../models").Size;
db.CategorySizes = require("../../models").CategorySizes;
db.Cart = require("../../models").Cart;
db.Setting = require("../../models").Setting;
db.Slot = require("../../models").Slot;
db.DriverSlot = require("../../models").DriverSlot;

module.exports = db;

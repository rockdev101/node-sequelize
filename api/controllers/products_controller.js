const Product = require("../../models").Product;
const Category = require("../../models").Category;
const Size = require("../../models").Size;
const Favorites = require("../../models").Favorites;
const Inventory = require("../../models").Inventory;
const Store = require("../../models").Store;
const Sequelize = require("sequelize");

const ProductController = () => {
  const allActiveProduct = async (req, res) => {
    try {
      const products = await Product.findAll({
        where: {
          isDeleted: false,
          isActive: true
        }
      });
      return res.status(200).json({
        products,
        message: "success",
        StatusCode: 1
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  const getAll = async (req, res) => {
    try {
      const products = await Product.findAll({
        where: {
          isDeleted: false
        }
      });
      return res.status(200).json({
        products,
        message: "success",
        StatusCode: 1
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  const getByCategory = async (req, res) => {
    const { categoryId } = req.query;
    try {
      const products = await Product.findAll({
        where: {
          isDeleted: false,
          categoryId
        },
        include: [
          {
            model: Inventory,
            attributes: ["id", "price", "storeId"],
            where: {
              storeId: { [Sequelize.Op.in]: JSON.parse(req.query.storeIds) },
            }
          }
        ]
      });
      const productIds = products.map(product => product.id);
      const favorites = await Favorites.findAll({
        where: {
          productId: { [Sequelize.Op.in]: productIds },
          customerId: req.token.id
        },
        include: [
          {
            model: Product,
          }
        ]
      });
      return res.status(200).json({
        products,
        favorites,
        message: "success",
        StatusCode: 1
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  const getById = async (req, res) => {
    const { id, storeIds } = req.query;
    try {
      const product = await Product.findOne({
        where: {
          id
        },
        include: [
          {
            model: Category,
            include: [
              {
                model: Size
              }
            ]
          }
        ]
      });

      const condition = storeIds
        ? {
            productId: id,
            storeId: { [Sequelize.Op.in]: JSON.parse(storeIds) }
          }
        : { productId: id };
      const inventories = await Inventory.findAll({
        where: condition,
        include: [
          {
            model: Store
          },
          {
            model: Product
          }
        ]
      });
      const isCustomerFavorite =
        (await Favorites.count({
          where: { productId: id, customerId: req.token.id }
        })) > 0;
      return res.status(200).json({
        product,
        inventories,
        isCustomerFavorite,
        message: "success",
        StatusCode: 1
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  const addOne = async (req, res) => {
    const { body } = req;
    try {
      const product = await Product.create(body);
      return res.status(200).json({
        product: product,
        message: "Product Added Succesfully",
        StatusCode: 1
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  const updateOne = async (req, res) => {
    const { body } = req;
    try {
      await Product.update(body, { where: { id: body.id } });
      return res.status(200).json({
        message: "Your product successfully updated.",
        StatusCode: 1
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  const deleteOne = async (req, res) => {
    const { id } = req.body;
    try {
      await Product.update({ isDeleted: 1 }, { where: { id } });
      return res.status(200).json({
        message: "Produtc Deleted Succesfully",
        StatusCode: 1
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  return {
    allActiveProduct,
    getAll,
    getByCategory,
    getById,
    addOne,
    updateOne,
    deleteOne
  };
};
module.exports = ProductController;

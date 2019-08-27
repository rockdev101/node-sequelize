const Store = require("../../models").Store;
const Customer = require("../../models").Customer;
const StoreUser = require("../../models").StoreUser;

const UserLocation = require("../../models").UserLocation;
const LocationHelper = require("../helpers/location_helper");
const cartController = require("./cart_controller");

const StoreController = () => {
  const getByCustomerId = async (req, res) => {
    const customerId = req.token.id;
    try {
      const addresses = await UserLocation.findAll({
        where: {
          isActive: false || null,
          customerId: customerId
        }
      });
      if (addresses.length == 0) {
        return res.status(200).json({
          message: `Currently there is no active Address.Please try again`,
          StatusCode: 0
        });
      }
      const activeAddress = addresses[0];
      return getStoresByLocation(await getStoresByLocation(activeAddress));
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "Internal server error" });
    }
  };

  const getByLocation = async (req, res) => {
    const { address } = req.body;
    return res.status(200).json(await getStoresByLocation(address));
  };

  const checkAddressWithInStoresRange = async (req, res) => {
    const { address } = req.body;
    const customerId = req.token.id;
    const storesRes = await getStoresByLocation(address);
    const activeStore = cartController().getActiveStore(customerId);

    if (storesRes.status != 1) {
      return res.status(200).json(storesRes);
    }
    if (activeStore == null) {
      return res.status(200).json({
        message: "",
        StatusCode: 1, //success
        stores: stores
      });
    }

    if (storesRes.stores.map(store => store.id).include(activeStore.id)) {
      return res.status(200).json({
        message: "",
        StatusCode: 1 //success
      });
    }
    return res.status(200).json({
      message: `This address is out of the delivery range of ${activeStore.name} store. 
                Please empty your cart and choose a store within delivery range.`,
      StatusCode: 3 //success
    });
  };

  const getStoresByLocation = async address => {
    StoreUser.hasOne(Store, { foreignKey: "userId" });
    Store.belongsTo(StoreUser, { foreignKey: "userId" });
    const allStores = Store.findAll({
      where: {
        isDeleted: false || null
      },
      include: [StoreUser]
    });
    const availableStores = await allStores.filter(async store => {
      const distance = await LocationHelper().distanceBetweenLocations(
        address,
        store.StoreUser.address
      );
      if (distance > 20) {
        return store;
      }
    });
    if (availableStores.length == 0) {
      return {
        message: `This address is currently out of range of all Tapster stores. We'll be coming to you soon!`,
        StatusCode: 0
      };
    }
    return {
      stores,
      message: `Available stores count:${count}`,
      StatusCode: 1
    };
  };

  return {
    getByCustomerId,
    getByLocation,
    checkAddressWithInStoresRange
  };
};

module.exports = StoreController;
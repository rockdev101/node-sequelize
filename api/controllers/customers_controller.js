const Customer = require("../../models").Customer;
const authService = require("../services/auth.service");
const bcryptService = require("../services/bcrypt.service");
const otpService = require("../services/otp.service");
const Sequelize = require("sequelize");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const BrainTreeHelper = require("../helpers/braintree_helper");
const getCurrentUser = require("../helpers/current_user_helper");
const UserLocation = require("../../models").UserLocation;
var _ = require("lodash");

const CustomerController = () => {
  const register = async (req, res) => {
    const { body } = req;
    const address = body.address;
    delete body.address;
    try {
      const existing = await Customer.findOne({
        where: {
          [Sequelize.Op.or]: [
            { email: body.email.toLowerCase() },
            { phone: body.phone }
          ]
        }
      });
      if (!!existing) {
        return res.status(400).json({
          message: `${body.email.toLowerCase()} or ${
            body.phone
          } was already used in other accounts`
        });
      }
      const customer = await Customer.create({
        ...body,
        email: body.email.toLowerCase(),
        password: bcryptService().password(body)
      });
      if (address) {
        const { longitude, latitude, address1, address2, address3 } = address;
        await UserLocation.create({
          ...address,
          address1,
          longitude,
          latitude,
          isActive: true,
          customerId: customer.id
        });
      }

      // Create stripeCusId
      const stripeCus = await stripe.customers.create({
        description: `Tapster customer id: ${customer.id}, name: ${customer.firstName} ${customer.lastName}, email: ${customer.email}`,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email
      });

      // Store stripeCusId in customer record:
      customer.update({ stripeCusId: stripeCus.id });

      delete customer.password;
      const token = authService().issue({ id: customer.id });
      return res.status(200).json({
        message: "Successfully Registered",
        StatusCode: 1,
        customer,
        token
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  const login = async (req, res) => {
    const { password } = req.body;
    const email = req.body.email.toLowerCase();
    if (email && password) {
      try {
        let customer = await Customer.findOne({
          where: {
            email: email
          },
          include: [
            {
              model: UserLocation,
              as: "addresses"
            }
          ]
        });
        if (!customer) {
          return res
            .status(400)
            .json({ message: "Bad Request: User not found" });
        }
        if (bcryptService().comparePassword(password, customer.password)) {
          const token = authService().issue({ id: customer.id });
          return res.status(200).json({
            message: "Login Success",
            StatusCode: 1,
            customer,
            token
          });
        }
        return res.status(401).json({ message: "Unauthorized" });
      } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal server error" });
      }
    }

    return res
      .status(400)
      .json({ message: "Bad Request: Email or password is wrong" });
  };

  const migrate1 = async (req, res) => {
    try {
      const customers = await Customer.findAll();
      for (var i = 0; i < customers.length; i++) {
        const customer = customers[i];
        const encryptPw = bcryptService().password({
          password: !!customer.dataValues.password
            ? customer.dataValues.password
            : "welcome"
        });
        await customer.update({ password: encryptPw });
        console.log(`success- ${customer.dataValues.password}`, i);
      }
      return res.status(200).json({ message: "success" });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  const checkOtp = async (req, res) => {
    const { otpCode } = req.body;
    const existing = await Customer.findOne({
      where: {
        otpCode
      }
    });
    if (!existing) {
      return res.status(200).json({
        Message: "Invalid Code",
        StatusCode: 0
      });
    }
    return res.status(200).json({
      Message: "Valid Code",
      StatusCode: 1
    });
  };

  const forgotPassword = async (req, res) => {
    const { phone, otpCode, password } = req.body;
    const existing = await Customer.findOne({
      where: {
        otpCode,
        phone
      }
    });
    if (!existing) {
      return res.status(200).json({
        Message: "Invalid Code",
        StatusCode: 0
      });
    }
    await Customer.update(
      { password: bcryptService().password(req.body) },
      { where: { otpCode } }
    );
    return res.status(200).json({
      Message: "Passowrd Updated Succesfully",
      StatusCode: 1
    });
  };

  const forgotPasswordOTP = async (req, res) => {
    const { body } = req;
    try {
      const customer = await Customer.findOne({
        where: {
          phone: body.phone
        }
      });
      if (!customer) {
        return res.status(404).json({
          Message:
            "There are no Tapster accounts associated with that phone number",
          StatusCode: 0
        });
      }
      const otpCode = await otpService().create("Customer", customer.id);
      await customer.update({ otpCode });
      return res.status(200).json({
        message: "OTP generated.",
        StatusCode: 1
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  const validate = (req, res) => {
    const { token } = req.body;
    authService().verify(token, err => {
      if (err) {
        return res.status(401).json({ isvalid: false, err: "Invalid Token!" });
      }
      return res.status(200).json({ isvalid: true });
    });
  };

  const generateBraintreeToken = async (req, res) => {
    const customerId = req.token.id;
    const currentUser = await getCurrentUser("Customer", customerId);
    const brainTreeResponse = await BrainTreeHelper().generateBraintreeToken(
      currentUser.braintreeCustomerId
    );
    if (brainTreeResponse.err) {
      return res
        .status(500)
        .json({ StatusCode: 0, err: brainTreeResponse.err });
    }
    return res.status(200).json({
      BraintreeToken: brainTreeResponse.response.clientToken,
      Message: "Token generated",
      StatusCode: 1
    });
  };

  const updateProfile = async (req, res) => {
    const { body } = req;
    customerId = req.token.id;
    const currentUser = await getCurrentUser("Customer", customerId);

    // Whitelist allowable attributes:
    const filteredAttributes = _.pick(body, [
      "phone",
      "firstName",
      "lastName",
      "userName",
      "address",
      "gender",
      "secondaryContact",
      "secondaryContactName",
      "stateId",
      "dob"
    ]);

    // Check for password
    if (body.password) {
      filteredAttributes.password = bcryptService().password(body);
    }

    // Check for email - only update if different from current email:
    if (
      body.email &&
      body.email.toLowerCase() !== currentUser.email.toLowerCase()
    ) {
      const email = body.email.toLowerCase();

      // Make sure new email is unique in the db:
      const existing = await Customer.findOne({
        where: {
          email: email
        }
      });
      if (!!existing) {
        return res
          .status(400)
          .json({ message: `${email} is already registered` });
      } else {
        // valid unique email:
        filteredAttributes.email = email;
      }
    }

    await currentUser.update(filteredAttributes);

    return res.status(200).json({
      isvalid: true,
      message: "Successfully updated customer",
      customer: currentUser
    });
  };

  const getCustomerProfile = async (req, res) => {
    customerId = req.token.id;
    const currentUser = await getCurrentUser("Customer", customerId);

    try {
      const addresses = await UserLocation.findAll({
        where: {
          customerId: customerId
        }
      });

      return res.status(200).json({
        message: "Successfully retrieved customer profile",
        customer: currentUser,
        addresses: addresses
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  const createOtp = async (req, res) => {
    const customer = await Customer.findOne({
      where: {
        email: req.body.email.toLowerCase(),
        phone: req.body.phone
      }
    });

    if (!customer)
      res.status(404).json({ message: "No user found for that email/phone." });

    try {
      await otpService().create("Customer", customer.id);
      return res.status(200).json({
        message: "Successfully sent One Time Password (OTP) code!",
        StatusCode: 1
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  return {
    register,
    login,
    forgotPassword,
    forgotPasswordOTP,
    validate,
    updateProfile,
    getCustomerProfile,
    generateBraintreeToken,
    createOtp,
    checkOtp,
    migrate1
  };
};

module.exports = CustomerController;

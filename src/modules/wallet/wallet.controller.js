const walletService = require("./wallet.service");

const getBalance = async (req, res, next) => {
  try {
    const result = await walletService.getBalance(req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const topup = async (req, res, next) => {
  try {
    const { amount, paymentProvider } = req.body;
    const result = await walletService.topup(req.user.id, { amount, paymentProvider });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const transactions = await walletService.getTransactions(req.user.id);
    res.status(200).json(transactions);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBalance,
  topup,
  getTransactions
};
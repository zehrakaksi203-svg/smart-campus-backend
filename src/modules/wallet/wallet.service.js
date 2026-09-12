const crypto = require("crypto");
const { Wallet, WalletTransaction, Student } = require("../../../models");

const getStudentByUserId = async (userId) => {
  const student = await Student.findOne({ where: { userId } });
  if (!student) {
    throw { status: 403, message: "Bu işlem için öğrenci kaydınız bulunamadı." };
  }
  return student;
};

// Öğrencinin cüzdanını getirir, yoksa otomatik oluşturur (balance: 0)
const getOrCreateWallet = async (studentId) => {
  let wallet = await Wallet.findOne({ where: { studentId } });

  if (!wallet) {
    wallet = await Wallet.create({ studentId, balance: 0 });
  }

  return wallet;
};

const getBalance = async (userId) => {
  const student = await getStudentByUserId(userId);
  const wallet = await getOrCreateWallet(student.id);

  return {
    walletId: wallet.id,
    balance: parseFloat(wallet.balance)
  };
};

// Test modu para yükleme: gerçek bir ödeme sağlayıcısına gitmeden
// anında başarılı sayar (spesifikasyonun "test ortamı" gereksinimine uygun).
const topup = async (userId, { amount, paymentProvider }) => {
  if (!amount || amount <= 0) {
    throw { status: 400, message: "Geçerli bir tutar giriniz." };
  }

  const MIN_AMOUNT = 50;
  if (amount < MIN_AMOUNT) {
    throw { status: 400, message: `Minimum yükleme tutarı ${MIN_AMOUNT} TL'dir.` };
  }

  const student = await getStudentByUserId(userId);
  const wallet = await getOrCreateWallet(student.id);

  const transactionId = crypto.randomUUID();

  const transaction = await WalletTransaction.create({
    walletId: wallet.id,
    amount,
    type: "Credit",
    status: "Completed",
    paymentProvider: paymentProvider || "Test",
    transactionId
  });

  wallet.balance = parseFloat(wallet.balance) + parseFloat(amount);
  await wallet.save();

  return {
    message: "Bakiye başarıyla yüklendi.",
    balance: parseFloat(wallet.balance),
    transaction
  };
};

const getTransactions = async (userId) => {
  const student = await getStudentByUserId(userId);
  const wallet = await getOrCreateWallet(student.id);

  return WalletTransaction.findAll({
    where: { walletId: wallet.id },
    order: [["createdAt", "DESC"]]
  });
};

// Diğer modüllerin (meal, event vs.) cüzdandan düşüm yapması için kullanılacak.
// Bakiye yetersizse hata fırlatır, yeterliyse Debit transaction oluşturur ve bakiyeyi düşer.
const debitWallet = async (studentId, amount, description) => {
  const wallet = await getOrCreateWallet(studentId);

  if (parseFloat(wallet.balance) < parseFloat(amount)) {
    throw { status: 400, message: "Yetersiz bakiye." };
  }

  const transaction = await WalletTransaction.create({
    walletId: wallet.id,
    amount,
    type: "Debit",
    status: "Completed",
    paymentProvider: "Wallet",
    transactionId: crypto.randomUUID()
  });

  wallet.balance = parseFloat(wallet.balance) - parseFloat(amount);
  await wallet.save();

  return { wallet, transaction, description };
};

// İptal/iade durumunda cüzdana geri para yükler.
const refundWallet = async (studentId, amount, description) => {
  const wallet = await getOrCreateWallet(studentId);

  const transaction = await WalletTransaction.create({
    walletId: wallet.id,
    amount,
    type: "Refund",
    status: "Completed",
    paymentProvider: "Wallet",
    transactionId: crypto.randomUUID()
  });

  wallet.balance = parseFloat(wallet.balance) + parseFloat(amount);
  await wallet.save();

  return { wallet, transaction, description };
};

module.exports = {
  getOrCreateWallet,
  getBalance,
  topup,
  getTransactions,
  debitWallet,
  refundWallet
};
const config = require('config');
const firebase = require('@firebase/app').default;
require('@firebase/firestore');

firebase.initializeApp(config.get('Firebase'));
const db = firebase.firestore();

exports.getUser = async chatId => {
  const user = await db.collection('users').doc(chatId.toString()).get();
  return user.data();
};

exports.setUser = (chatId, user) => {
  return db.collection('users').doc(chatId.toString()).set(user, { merge: true });
};
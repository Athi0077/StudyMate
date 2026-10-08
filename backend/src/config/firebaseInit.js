const admin = require('firebase-admin');
const serviceAccount = require('./firebase-admin.json');

const apps = admin.getApps ? admin.getApps() : (admin.apps || []);

if (!apps.length) {
  admin.initializeApp({
    credential: admin.cert(serviceAccount)
  });
}

module.exports = admin;

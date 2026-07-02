importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// Config based on the provided keys
const firebaseConfig = {
  apiKey: "AIzaSyB_FI4W5iOTbuOrGlhHMc3cdC5o9jzRIuQ",
  authDomain: "icre-43dd0.firebaseapp.com",
  projectId: "icre-43dd0",
  storageBucket: "icre-43dd0.firebasestorage.app",
  messagingSenderId: "117735946079",
  appId: "1:117735946079:web:715c91b52e4ee9fe1968ea"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Novo Aviso SIGE';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/icon.png', // Assuming there's a favicon/icon
    badge: '/icon.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

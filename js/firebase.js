const firebaseConfig = {
  apiKey: "AIzaSyD0GQxJ1DypcOfKs0Hvn4AQ0jFcMi8qq_U",
  authDomain: "hotel-app-f4b1b.firebaseapp.com",
  projectId: "hotel-app-f4b1b",
  storageBucket: "hotel-app-f4b1b.firebasestorage.app",
  messagingSenderId: "3832391759",
  appId: "1:3832391759:web:eab4820a5f4eb19563a23a",
  measurementId: "G-EC02BHFGMD"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

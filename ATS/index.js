const express = require("express");
const app = express();
const { spawn } = require("child_process");
const axios = require('axios');
const bp = require("body-parser");
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore} = require('firebase-admin/firestore');
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth")
var admin = require("firebase-admin");
const PORT = process.env.PORT || 3000;
const path = require('path');

app.use(bp.urlencoded({ extended: true }));
app.use(bp.json());
app.set('view engine', 'ejs');

var serviceAccount = require("./key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const auth = admin.auth();
const db = getFirestore();
app.use(express.static('views'))
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
  res.render("home.ejs");
  // res.sendFile(__dirname+"/home.html")
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Check if email exists in the database
  db.collection('users').where('email', '==', email).get()
    .then(snapshot => {
      if (snapshot.empty) {
        return res.status(404).send('Email not found');
      } else {
        // Email exists, check if password matches
        const user = snapshot.docs[0].data();
        if (user.password === password) {
          // Password matches, proceed with login
          // res.send('hiiiiiii'); // Redirect to dashboard after successful login
          const streamlitApp = spawn("streamlit", ["run", "app.py"]);

  streamlitApp.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  streamlitApp.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  streamlitApp.on("close", (code) => {
    console.log(`Streamlit app exited with code ${code}`);
  });

  res.send("Running Streamlit app...");
        } else {
          // Password doesn't match
          return res.status(401).send('Invalid password');
        }
      }
    })
    .catch(error => {
      console.error('Error logging in:', error);
      res.status(500).send('Internal Server Error');
    });
});

// });
app.get("/signup", (req, res) => {
  res.render("register.ejs");
});
app.post('/signup', (req, res) => {
  const { firstname, lastname, email, password } = req.body;

  // Check if email already exists in the database
  db.collection('users').where('email', '==', email).get()
    .then(snapshot => {
      if (!snapshot.empty) {
        return res.status(400).send('Email already exists');
      } else {
        // Email does not exist, proceed with registration
        return db.collection('users').add({
          firstname,
          lastname,
          email,
          password, // Note: In a real application, you should hash the password before storing it
        });
      }
    })
    .then(() => {
      res.redirect('/login'); // Redirect to login page after successful registration
    })
    .catch(error => {
      console.error('Error registering user:', error);
      res.status(500).send('Internal Server Error');
    });
});



app.get("/as", (req, res) => {
  

});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

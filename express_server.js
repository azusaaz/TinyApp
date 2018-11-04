const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const addressPrefix = `http://localhost:${PORT}/u/`;
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const methodOverride = require('method-override')

//for css use
app.use('/public', express.static(process.cwd() + '/public'));

app.use(methodOverride('_method'));

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
}))

app.set("view engine", "ejs");


//////////////////////// Database obj with test data ////////////////////////

var urlDatabase = {
  "b2xVn2": {
    url: "http://www.lighthouselabs.ca",
    user_id: "userRandomID",
  },
  "9sm5xK": {
    url: "http://www.google.com",
    user_id: "user2RandomID",
  },
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    // *** Actual password: "purple-monkey-dinosaur"
    password: "$2b$10$NrsPyX1jibhvbKRiXEHV3.eWOc05rvcBzIQ.XFym5uMPDOkTt.PIq",
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    // *** Actual password: "dishwasher-funk"
    password: "$2b$10$LXwPZiQW0Z6ExMgJ6pMRwuqytUTsAZtZa3J1fkkgp68oyFhe3nT16",
  },
  "user3RandomID": {
    id: "user3RandomID",
    email: "user3@example.com",
    // *** Actual password: "garden-twitter"
    password: "$2b$10$bSzEkfb8ro/yf/IVvPb4weo7a6vHKTBRipDrVOUQKxXErQVvOpu7.",
  },
}


////////////////////////// helper functions //////////////////////////


//Generate random alphanumeric string 6 length to make a shortURL
function generateRandomString() {
  const howMany = 6;
  const alphanumeric = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  var randomAlpha = '';

  for (let ii = 0; ii < howMany; ii++) {
    randomAlpha += alphanumeric.charAt(
      Math.floor(Math.random() * Math.floor(alphanumeric.length))
    );
  }
  return randomAlpha;
}

//Return ulrs only belongs to given id
function urlsForUser(id) {
  let urls = {};
  for (url in urlDatabase) {
    if (urlDatabase[url].user_id === id) {
      urls[url] = urlDatabase[url];
    }
  }
  return urls;
}

//Validate email existence
function isExistEmail(newEmail) {
  var result = false;

  for (user in users) {
    if (users[user].email === newEmail) {
      result = true;
    }
  }
  return result;
}

//Validate email existence
function whoHasThisEmail(newEmail) {
  var result = false;

  for (user in users) {
    if (users[user].email === newEmail) {
      result = user;
    }
  }
  return result;
}


///////////////////////////// routes /////////////////////////////


//Default loot
app.get("/", (req, res) => {

  if (req.session["user_id"]) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

//Display url list
app.get("/urls", (req, res) => {
  if (!req.session["user_id"]) {
    res.redirect("/login");
  } else {

    let templateVars = {
      addressPrefix,
      user: users[req.session["user_id"]],
      urls: urlsForUser(req.session["user_id"]),
    };
    res.render("urls_index", templateVars);
  }
});

//Display form that request new short url
app.get("/urls/new", (req, res) => {
  if (!req.session["user_id"]) {
    res.redirect("/login");
  } else {
    let templateVars = {
      user: users[req.session["user_id"]],
    };
    res.render("urls_new", templateVars);
  }

});

//Register new URL info into the urlDatabase
app.post("/urls", (req, res) => {

  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = {
    "url": req.body.longURL,
    "user_id": req.session["user_id"],
  };
  res.redirect(`/urls/${newShortURL}`);
});

//Redirect to a longURL page from the given shortURL
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(403);
    res.send("This short url doesn't exist.");
  } else {

    let longURL = urlDatabase[req.params.shortURL].url;
    res.redirect(longURL);
  }
});

//Display one url page for edit or show generated result
app.get("/urls/:id", (req, res) => {
  if (!req.session["user_id"]) {
    res.status(403);
    res.send("Please log-in first!");

  } else if (!urlDatabase[req.params.id]) {
    res.status(403);
    res.send("You don't have this short url.");

  } else {

    let templateVars = {
      addressPrefix,
      user: users[req.session["user_id"]],
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id].url,
    };
    res.render("urls_show", templateVars);
  }
});

//Update original url belongs to the given id
app.put("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id].user_id === users[req.session["user_id"]].id) {
    urlDatabase[req.params.id].url = req.body["newUrl"];
  }

  res.redirect("/urls");
});

//Display user registration page
app.get("/register", (req, res) => {

  if (req.session["user_id"]) {
    res.redirect("/urls");
  } else {

    let templateVars = {
      user: users[req.session["user_id"]],
    };

    res.render("register", templateVars);
  }
});

//Register new user info into data base object
app.post("/register", (req, res) => {
  let newUserId = generateRandomString();

  if (!req.body.email || !req.body.password) {
    res.status(400);
    res.send("please enter your email and password!");

  } else if (isExistEmail(req.body.email)) {
    res.status(400);
    res.send("email already exist! Please log-in.");

  } else {
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);

    users[newUserId] = {
      id: newUserId,
      email: req.body.email,
      password: hashedPassword,
    };

    req.session.user_id = newUserId;

    res.redirect("/urls");
  }
});

//Display login page
app.get("/login", (req, res) => {

  if (req.session["user_id"]) {
    res.redirect("/urls");
  } else {

    let templateVars = {
      user: "",
    };

    res.render("login", templateVars);
  }
});

//Login and store userId in a cookie
app.post("/login", (req, res) => {

  if (!req.body.email || !req.body.password) {
    res.status(400);
    res.send("please enter your email and password!");

  } else {

    let user = whoHasThisEmail(req.body.email);

    if (user) {

      //compare bcrypted password
      let isRightPassword = bcrypt.compareSync(req.body.password, users[user].password);

      if (isRightPassword) {
        req.session.user_id = user;
        res.redirect("/urls");

      } else {
        res.status(403);
        res.send("password doesn't match, please try again.");
      }

    } else {
      res.status(403);
      res.send("cannot find user. Please register first.");
    }
  }
});

//Logout and clear cookie
app.post("/logout", (req, res) => {

  req.session = null;

  res.redirect("/urls");
});

//Display database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Delete one url data by id
app.delete("/urls/:id", (req, res) => {

  if (!req.session["user_id"]) {
    res.status(403);
    res.send("Please log-in first!");

  } else if (!urlDatabase[req.params.id]) {
    res.status(403);
    res.send("You don't have this short url.");

  } else {

    if (urlDatabase[req.params.id].user_id === users[req.session["user_id"]].id) {
      delete urlDatabase[req.params.id];
    }

    res.redirect("/urls");
  }
});

//Server star message
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
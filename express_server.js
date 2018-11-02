var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
var addressPrefix = `http://localhost:${PORT}/`;
const bcrypt = require('bcrypt');
var cookieSession = require('cookie-session');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
}))

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

app.set("view engine", "ejs");

//Default
app.get("/", (req, res) => {

  if (req.session["user_id"]) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }

});

function urlsForUser(id) {
  let urls = {};
  for (url in urlDatabase) {
    if (urlDatabase[url].user_id === id) {
      urls[url] = urlDatabase[url];
    }
  }
  return urls;
}
//Display urls with the template
app.get("/urls", (req, res) => {
  let templateVars = {
    user: users[req.session["user_id"]],
    urls: urlsForUser(req.session["user_id"]),
  };
  res.render("urls_index", templateVars);
});

//Display form for new short url
app.get("/urls/new", (req, res) => {
  if (!req.session["user_id"]) {
    res.redirect("/login");
  }

  let templateVars = {
    user: users[req.session["user_id"]],
  };
  res.render("urls_new", templateVars);
});

//Register new URL info into urlDatabase
app.post("/urls", (req, res) => {

  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = {
    "url": req.body.longURL,
    "user_id": req.session["user_id"],
  };
  res.redirect(`/urls/${newShortURL}`);
});

//Redirect to a longURL page from the passed shortURL
app.get("/u/:shortURL", (req, res) => {
  if (!req.session["user_id"]) {
    res.status(403);
    res.send("Please log-in first!");
  } else {

    let longURL = urlDatabase[req.params.shortURL].url;
    res.redirect(longURL);
  }
});

//Display one url with the template
app.get("/urls/:id", (req, res) => {
  if (!req.session["user_id"]) {
    res.status(403);
    res.send("Please log-in first!");
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

//Edit data by id
app.post("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id].user_id === users[req.session["user_id"]].id) {
    urlDatabase[req.params.id].url = req.body["newUrl"];
  }

  res.redirect("/urls");
});

//Display user register page
app.get("/register", (req, res) => {

  if (req.session["user_id"]) {
    res.redirect("/urls");
  }

  let templateVars = {
    user: users[req.session["user_id"]],
  };

  res.render("register", templateVars);
});

//validate email existence
function isExistEmail(newEmail) {
  var result = false;

  for (user in users) {
    if (users[user].email === newEmail) {
      result = true;
    }
  }
  return result;
}

//Register user info into data base object
app.post("/register", (req, res) => {
  let newUserId = generateRandomString();

  if (!req.body.email || !req.body.password) {
    res.status(400);
    res.send("please send your email and password!");

  } else if (isExistEmail(req.body.email)) {
    res.status(400);
    res.send("email already exist!");

  } else {
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    users[newUserId] = {
      id: newUserId,
      email: req.body.email,
      password: hashedPassword,
    };

    res.session.user_id = newUserId;

    res.redirect("/urls");
  }
});

//Display login page
app.get("/login", (req, res) => {

  if (req.session["user_id"]) {
    res.redirect("/urls");
  }

  let templateVars = {
    user: users[req.session["user_id"]],
  };

  res.render("login", templateVars);
});

//validate email existence
function whoHasThisEmail(newEmail) {
  var result = false;

  for (user in users) {
    if (users[user].email === newEmail) {
      result = user;
    }
  }
  return result;
}

//login and store username in a 
app.post("/login", (req, res) => {
  let user = whoHasThisEmail(req.body.email);

  if (user) {

    //compare bcrypted password
    let isRightPassword = bcrypt.compareSync(req.body.password, users[user].password);

    if (isRightPassword) {
      req.session.user_id = user;
      res.redirect("/urls");

    } else {
      res.status(403);
      res.send("password doesn't match, please try again");
    }

  } else {
    res.status(403);
    res.send("cannot find user");
  }
});

//logout and clear cookie
app.post("/logout", (req, res) => {

  req.session = null;

  res.redirect("/urls");
});

//Display database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Delete data by id
app.post("/urls/:id/delete", (req, res) => {

  if (!req.session["user_id"]) {
    res.status(403);
    res.send("Please log-in first!");
  } else {

    if (urlDatabase[req.params.id].user_id === users[req.session["user_id"]].id) {

      delete urlDatabase[req.params.id];
    }

    res.redirect("/urls");
  }
});

//Starter message
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

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
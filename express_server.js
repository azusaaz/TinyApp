var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
var addressPrefix = `http://localhost:${PORT}/`

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
  extended: true
}));

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.set("view engine", "ejs");

//Default
app.get("/", (req, res) => {
  let templateVars = {
    greeting: 'Hello World!'
  };
  res.render("hello_world", templateVars);
});

//Display urls with the template
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase
  };

  res.render("urls_index", templateVars);
});

//Show a form
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//Receive the form submission
app.post("/urls", (req, res) => {

  console.log(req.body);
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
  res.redirect(`/urls/${newShortURL}`);
});

//Redirect to a longURL page from the passed shortURL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//Display one url with the template
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    addressPrefix,
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

//Edit data by id
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body["newUrl"];
  res.redirect("/urls");
});

//Display database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Delete data by id
app.post("/urls/:id/delete", (req, res) => {

  delete urlDatabase[req.params.id];

  res.redirect("/urls");
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
const { ipcRenderer } = require("electron");

const form = document.getElementById("form");

const doLogin = () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const total = document.getElementById("total").value;
  const delay = document.getElementById("delay").value;

  ipcRenderer.send("login", { username, password, total, delay });
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  doLogin();
});
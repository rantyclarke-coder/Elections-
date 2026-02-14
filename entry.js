const menuBtn = document.querySelector(".menu");
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");
const closeMenu = document.getElementById("closeMenu");

function openMenu() {
  sideMenu.classList.add("active");
  overlay.classList.add("active");
}

function hideMenu() {
  sideMenu.classList.remove("active");
  overlay.classList.remove("active");
}

menuBtn.addEventListener("click", openMenu);
overlay.addEventListener("click", hideMenu);
closeMenu.addEventListener("click", hideMenu);

const themeToggle = document.getElementById("themeToggle");
const logo = document.getElementById("logo");

/* APPLY SAVED THEME ON LOAD */

if(localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  logo.src = "images/wpdark.png";
}

/* TOGGLE THEME */

themeToggle.addEventListener("click", function() {

  document.body.classList.toggle("dark");

  if(document.body.classList.contains("dark")) {

    logo.src = "images/wpdark.png";
    localStorage.setItem("theme", "dark");

  } else {

    logo.src = "images/wplight.png";
    localStorage.setItem("theme", "light");

  }

});

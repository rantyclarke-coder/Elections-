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

themeToggle.addEventListener("click", function() {

  document.body.classList.toggle("dark");

});

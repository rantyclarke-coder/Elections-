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

/* LOAD. YEAR. */
async function loadYear(){

    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsbbXqdgfMGosYWjOVNR-2UUw6bZzjGNtnfuuWpbBuTutk6Jm1lffgHUis8GNjfQLFZLkaSpJNlck2/pub?gid=0&single=true&output=csv";

    try {
        const res = await fetch(url);
        const text = await res.text();

        const rows = text.split("\n");   // all rows
        const row58 = rows[57];          // row 58 (index starts from 0)

        const cols = row58.split(",");   // split columns
        const year = cols[2];            // column C (A=0, B=1, C=2)

        document.getElementById("electionYear").textContent = year;

    } catch(err){
        console.log("Sheet load failed:", err);
    }
}

loadYear();
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

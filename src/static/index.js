const userName = document.getElementById("userName");

if (userName) {
  userName.addEventListener("keydown", (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
    }
  });
}

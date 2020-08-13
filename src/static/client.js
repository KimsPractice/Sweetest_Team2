const socket = io();
const nickName = document.querySelector(".nickName"); // 내이름
const opponentName = document.querySelector(".opponentName"); //상대방이름
const readyBtn = document.querySelector(".ready");
const startBtn = document.querySelector(".gameStart");
const bell = document.querySelector(".bell");
const cardOpenBtn = document.querySelector(".cardOpenBtn");
const myOpenCardImg = document.querySelector(".myOpenCardImg");
const userOpenCardImg = document.querySelector(".userOpenCardImg");
const bellText = document.querySelector(".bellText");
const finText = document.querySelector(".finText");

let currentCards = [];

const imageName = (firstCard) => {
  let cardName = "";
  let forderName = "";
  let name = firstCard.substring(0, 1);
  const number = firstCard.substring(1, 2);

  switch (name) {
    case "A":
      forderName = `apple`;
      cardName = `apple${number}`;
      break;
    case "B":
      forderName = `banana`;
      cardName = `banana${number}`;
      break;
    case "C":
      forderName = `peach`;
      cardName = `peach${number}`;
      break;
    case "D":
      forderName = `strawberry`;
      cardName = `strawberry${number}`;
      break;
  }
  return `css/${forderName}/${cardName}.png`;
};

const turnChange = (userList, imagePath = "") => {
  userList.map((users) => {
    if (users.turn) {
      if (users.socketId == socket.id) {
        userOpenCardImg.src = imagePath || "";
        cardOpenBtn.disabled = false;
      } else {
        myOpenCardImg.src = imagePath || "";
        cardOpenBtn.disabled = true;
      }
    }
  });
};

socket.on("gameSet", ({ loseuserId }) => {
  console.log("게임 끝~~~~~");
  finText.style.display = "block";
  if (loseuserId == socket.id) {
    finText.innerHTML = "패배";
  } else {
    finText.innerHTML = "승리";
  }
});

socket.on("bellDone", (cleaning) => {
  bellText.style.display = "block";
  setTimeout(() => {
    bellText.style.display = "none";
  }, 1000);

  if (cleaning) {
    currentCards = [];
    userOpenCardImg.src = "";
    myOpenCardImg.src = "";
  }
});

socket.on("drawCard", ({ firstCard, userList }) => {
  if (firstCard) {
    const imagePath = imageName(firstCard);
    turnChange(userList, imagePath);
  }

  if (currentCards.length < 2) {
    currentCards.push(firstCard);
  } else {
    currentCards.shift();
    currentCards.push(firstCard);
  }
});

socket.on("gameSetup", (userList) => {
  startBtn.style.display = "none";
  readyBtn.style.display = "none";
  turnChange(userList);
  bell.disabled = false;
});

socket.on("readyComplete", (roomInfo) => {
  console.log(roomInfo);
  const { full } = roomInfo;

  console.log("준비가 완료되었습니다!! 게임시작을 눌러주세요 !!");
  if (full == true) {
    startBtn.style.display = "block";
  }
});

socket.on("userInit", (userList) => {
  userList.map((users) => {
    if (users.socketId != socket.id || users.length < 3) {
      opponentName.innerHTML = users.name;
    }
  });
});

// 벨
$("#big_bell").click(() => {
  socket.emit("bellClick", { userId: socket.id, currentCards, currentCards });
});

$(".ready").click(() => {
  // 레디 (방에 입장) 2P도 레디 해야 카드 오픈 누를 수 있게 해야함
  $(".ready")[0].disabled = true;
  socket.emit("ready", nickName.innerHTML);
});

const handlecardOpenBtn = () => {
  socket.emit("cardOpen", socket.id);
};

const handleStartBtn = () => {
  socket.emit("gameStart");
};

const init = () => {
  startBtn.addEventListener("click", handleStartBtn);
  cardOpenBtn.addEventListener("click", handlecardOpenBtn);
};

init();

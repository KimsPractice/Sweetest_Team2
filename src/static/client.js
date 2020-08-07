const socket = io();
const nickName = document.querySelector(".nickName"); // 내이름
const opponentName = document.querySelector(".opponentName"); //상대방이름
const readyBtn = document.querySelector(".ready");
const startBtn = document.querySelector(".gameStart");
const bell = document.querySelector(".bell");
const cardOpenBtn = document.querySelector(".cardOpenBtn");
const myOpenCardImg = document.querySelector(".myOpenCardImg");
const userOpenCardImg = document.querySelector(".userOpenCardImg");

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

const turnChange = (userList, imagePath = "", cardDumy = "") => {
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

socket.on("drawCard", ({ firstCard, userList }) => {
  const imagePath = imageName(firstCard);
  turnChange(userList, imagePath);
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

// // 카드 배분. 받은걸로 액션 처리.
// socket.on("gift_card", (card, idx, match, ask) => {
//   var folder_name = makeName(card);
//   var card_name = folder_name + card.substring(1, 2);

//   is_match = match; // $('#big_bell').click 에서 사용

//   console.log("(idx:" + idx + ")", card_name, " / match: ", match);

//   // 카드를 요청한 소켓이 본인이면 본인자리에, 상대방이면 상대방 자리에 카드 배치
//   ask == socket.id
//     ? ($("#myOpenCardImg")[0].src =
//         "/Image/" + folder_name + "/" + card_name + ".png")
//     : ($("#userOpenCardImg")[0].src =
//         "/Image/" + folder_name + "/" + card_name + ".png");

//   if (idx == 55) {
//     console.log("카드 다 썼음. 엔딩처리하면 됨");
//   }
// });

// // 게임오버
// socket.on("win", (msg) => {
//   console.log("승리");
// });

// socket.on("lose", (msg) => {
//   console.log("패배");
// });

// // 카드 요청
// $("#cardOpenBtn").click(() => {
//   socket.emit("cardOpen");
// });

// // 벨
// $("#big_bell").click(() => {
//   var msg = {
//     mode: "bell",
//     match: null,
//   };

//   if (is_match) {
//     // 쓴 카드 회수하는 것은 승패에 영향이 없지만 추가해야할까...
//     // 한 번이라도 종을 친 적이 있다면 0 됐을 때 카드 뒷면 이미지 보여지게 처리하면 됨. 없으면 맨마닥.

//     msg.match = true;
//     socket.emit("client_message", msg);
//   } else {
//     msg.match = false;
//     socket.emit("client_message", msg);
//   }
// });

// /////////////// 테스트용

// socket.on("clean", () => {
//   $("#myOpenCardImg")[0].src = ""; // 제출 이미지 비워줌
//   $("#userOpenCardImg")[0].src = "";
//   $("#tmp1")[0].disabled = false;
// });

$(".ready").click(() => {
  // 레디 (방에 입장) 2P도 레디 해야 카드 오픈 누를 수 있게 해야함
  $(".ready")[0].disabled = true;
  socket.emit("ready", nickName.innerHTML);
});

// $("#tmp2").click(() => {
//   console.log("게임을 초기화합니다.");
//   socket.emit("reset");
// });

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

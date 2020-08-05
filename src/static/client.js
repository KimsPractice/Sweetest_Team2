const socket = io();
let turn = true;
let is_match = "";
let count = "";
let nickName = document.querySelector(".nickName"); // 내이름
let opponentName = document.querySelector(".opponentName"); //상대방이름

// // 카드 이름 매칭
// function makeName(card) {
//   let card_name = "";
//   let name = card.substring(0, 1);
//   switch (name) {
//     case "A":
//       card_name = "apple";
//       break;
//     case "B":
//       card_name = "banana";
//       break;
//     case "C":
//       card_name = "peach";
//       break;
//     case "D":
//       card_name = "strawberry";
//       break;
//   }
//   return card_name;
// }

// (function () {
//   $("#cardOpenBtn")[0].disabled = true;
//   nickName.innerHTML = name;
// })();

// 서버로부터 전달받은 정보 메세지를 종류별로 처리
socket.on("readyComplete", (roomInfo) => {
  console.log(roomInfo);
});

socket.on("userInit", (userList) => {
  console.log(userList);
});

socket.on("server_message", (msg) => {
  var msg_mode = msg.mode;

  switch (msg_mode) {
    case "start":
      console.log("유저정보: ", msg);

      break;

    case "info":
      console.log(msg);

      break;

    case "bell":
      console.log("bell: ", msg);

      $("#myOpenCardImg")[0].src = ""; // 제출 이미지 비워줌
      $("#userOpenCardImg")[0].src = "";

      // 턴 처리

      break;

    case "card_open_after":
      console.log("card_open_after: ", msg);

      // 턴 처리
      if (msg.msg[0].turn) {
        console.log("1P의 턴");
        msg.msg[1].socketId == socket.id
          ? ($("#cardOpenBtn")[0].disabled = true)
          : ($("#cardOpenBtn")[0].disabled = false);
      } else {
        console.log("2P의 턴");
        msg.msg[0].socketId == socket.id
          ? ($("#cardOpenBtn")[0].disabled = true)
          : ($("#cardOpenBtn")[0].disabled = false);
      }

      break;

    default:
      console.log(msg);
  }
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
  $("#cardOpenBtn")[0].disabled = false;

  const msg = {
    mode: "user_init",
    userName: name,
  };

  socket.emit("ready", nickName.innerHTML);
});

// $("#tmp2").click(() => {
//   console.log("게임을 초기화합니다.");
//   socket.emit("reset");
// });

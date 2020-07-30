var socket = io();
var turn = true;
var is_match;
var count;
var nickName = document.getElementById("nickname"); // 내이름

// 카드 이름 매칭
function makeName(card) {
  let card_name = "";
  let name = card.substring(0, 1);
  switch (name) {
    case "a":
      card_name = "apple";
      break;
    case "b":
      card_name = "banana";
      break;
    case "c":
      card_name = "peach";
      break;
    case "d":
      card_name = "strawberry";
      break;
  }
  return card_name;
}

(function () {
  $("#cardOpenBtn")[0].disabled = true;
  nickName.innerHTML = name;
})();

// 소켓 통신
socket
  .on("hihi", (list) => {
    // 접속한 소켓 확인용
    var socket_list = "";
    console.log("SocketList: " + JSON.stringify(list));
    nickName.innerHTML = name;
    console.log("userName:" + name);
    for (var socket in list) {
      socket_list += "<li id=" + socket + ">소켓ID: " + socket + "</li>";
    }
    $("#param1").html(socket_list);
  })

  // 서버로부터 전달받은 정보 메세지를 종류별로 처리
  .on("server_message", (msg) => {
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
  })

  // 카드 배분. 받은걸로 액션 처리.
  .on("gift_card", (card, idx, match, ask) => {
    var folder_name = makeName(card);
    var card_name = folder_name + card.substring(1, 2);

    is_match = match; // $('#big_bell').click 에서 사용

    console.log("(idx:" + idx + ")", card_name, " / match: ", match);

    // 카드를 요청한 소켓이 본인이면 본인자리에, 상대방이면 상대방 자리에 카드 배치
    ask == socket.id
      ? ($("#myOpenCardImg")[0].src =
          "/Image/" + folder_name + "/" + card_name + ".png")
      : ($("#userOpenCardImg")[0].src =
          "/Image/" + folder_name + "/" + card_name + ".png");

    if (idx == 55) {
      console.log("카드 다 썼음. 엔딩처리하면 됨");
    }
  })

  // 게임오버
  .on("win", (msg) => {
    console.log("승리");
  })

  .on("lose", (msg) => {
    console.log("패배");
  });

// 카드 요청
$("#cardOpenBtn").click(() => {
  socket.emit("show_me_the_card");
});

// 벨
$("#big_bell").click(() => {
  var msg = {
    mode: "bell",
    match: null,
  };

  if (is_match) {
    // 쓴 카드 회수하는 것은 승패에 영향이 없지만 추가해야할까...
    // 한 번이라도 종을 친 적이 있다면 0 됐을 때 카드 뒷면 이미지 보여지게 처리하면 됨. 없으면 맨마닥.

    msg.match = true;

    socket.emit("client_message", msg);
  } else {
    msg.match = false;

    socket.emit("client_message", msg);
  }
});

/////////////// 테스트용

socket.on("clean", () => {
  $("#myOpenCardImg")[0].src = ""; // 제출 이미지 비워줌
  $("#userOpenCardImg")[0].src = "";
  $("#tmp1")[0].disabled = false;
});

$("#tmp1").click(() => {
  // 레디 (방에 입장) 2P도 레디 해야 카드 오픈 누를 수 있게 해야함

  $("#tmp1")[0].disabled = true;
  $("#cardOpenBtn")[0].disabled = false;

  console.log("click go");
  var msg = {
    mode: "user_init",
    userName: name,
  };

  socket.emit("go");
  socket.emit("client_message", msg);
});

$("#tmp2").click(() => {
  console.log("게임을 초기화합니다.");

  // $("#myOpenCardImg")[0].src = ""; // 제출 이미지 비워줌
  // $("#userOpenCardImg")[0].src = "";

  socket.emit("reset");
});

var name;

function btn_on() {
  btnStart.disabled = false;
  btnStart.innerHTML = "GAME START";
}

function btnUserName() {
  temp = document.getElementById("userName").value;
  name = temp;

  btnName.disabled = true;
  //userCnt++;
  //console.log( userCnt );
}

var socket = io();

socket.on("hihi", (list) => {
  // 접속한 소켓 확인용
  var socket_list = "";
  var currentNumberUsers = Object.keys(list).length; //접속자 수 체크
  console.log("SocketList: " + JSON.stringify(list));

  for (var socket in list) {
    console.log("socket id=" + socket);
    console.log("userName:" + name); //유저 닉네임
  }

  $("#checkNumberUsers").html("인원 수 : " + currentNumberUsers + "/2");

  if (currentNumberUsers === 2) {
    //인원수가 2명일때 GAME START 버튼활성화
    btn_on();
  }
});

let socket = io("/");
let turn = 0;
let is_match;
let count;

// 소켓 통신
socket.on("hihi", (list) => {
  // 접속한 소켓 확인용
  let socket_list = [];
  let userList = "";
  console.log("SocketList: " + JSON.stringify(list));

  list.forEach((socket) => {
    userList += "<li id=" + socket + ">소켓ID: " + socket + "</li>";
  });

  $("#param1").html(userList);
});
socket.on("clear", (id) => {
  // 나가면 소켓 확인용 리스트에서 지움
  $("#param1 li#" + id).remove();
});
socket.on("info", (msg) => {
  // 서버에서 보내는 정보 메시지 받음
  console.log(msg);
});
socket.on("gift_card", (card_one, idx, match) => {
  // 카드 배분. 받은걸로 액션 처리.
  is_match = match; // 다음 단계를 위해서 저장
  count = idx; // 다음 단계를 위해서 저장

  console.log("서버로부터 카드 받음(idx:" + idx + ")", card_one);
  console.log("카드 5 ? : " + match);

  if (idx == 55) {
    console.log("카드 다 썼음. 엔딩처리하면 됨");
  }
});

$("#go").click(() => {
  // 방 입장용(게임시작용)
  console.log("click go");
  socket.emit("go", (socket) => {
    console.log("tet" + socket);
    socket;
  });
});

$("#game_start").click(() => {
  // 카드 요청.
  socket.emit("show_me_the_card");
});

$("#big_bell").click(() => {
  if (is_match) {
    console.log("종 잘 쳤음");
    // 쓴 카드 회수하는 것은 승패에 영향이 없지만 추가해야할까...
    // 한 번이라도 종을 친 적이 있다면 0 됐을 때 카드 뒷면 이미지 보여지게 처리하면 됨. 없으면 맨마닥.

    let msg =
      socket.id +
      "가 종을 잘 쳤음. 짝짝짝. 뷰에서 액션 처리할 수 있게 회신 바람";
    socket.emit("client_message", msg);
  } else {
    console.log(socket.id + " 잘못쳤음. -1해야함 ");
    let msg = socket.id + "가 종을 잘못쳤으니까 차감 후 회신 바람";
    socket.emit("client_message", msg);
  }
});

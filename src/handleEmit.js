export const handler = {
  go: (socket) => {
    console.log(socket);
    let room_for_1p = "";

    if (room_for_1p == "") {
      room_for_1p = "room_" + socket.id;

      socket.join(room_for_1p, () => {
        var player_one = new player("1p", socket.id, 28);
        var info_msg = id + " 소켓이 방을 생성함. 방이름: " + room_for_1p;
        io.to(room_for_1p).emit("info", info_msg);
        io.to(room_for_1p).emit("info", wait_msg);
        // 클라에 사용자 정보 어떤거 보낼지 생각해야
        player_one.info();

        console.log(socket.id + " 소켓이 방을 생성함. 방이름: " + room_for_1p);
        console.log(wait_msg);
      });
    } else {
      socket.join(room_for_1p, () => {
        // 입장을 두 명으로 제한해야 함.
        var info_msg =
          socket.id + " 소켓이 방에 입장함. 방이름: " + room_for_1p;
        io.to(room_for_1p).emit("info", info_msg);
        var player_two = new player("2p", socket.id, 28);
        player_two.info();

        console.log(socket.id + " 소켓이 방에 입장함 방이름: " + room_for_1p);
      });

      var rooms = socket.adapter.rooms;
      io.to(room_for_1p).emit("방정보", JSON.stringify(rooms));

      console.log("방정보: " + JSON.stringify(rooms));
    }
  },

  show_me_the_card: () => {
    let idx = 0;
    var match = false;

    if (idx == 0) {
      // 첫 카드
      var card_one = shuffled_card_list[0];
      // 만약 최초가 5인데 상대가 종을 친 경우는?? 첫카드는 종 못치게 해야할거같은디...
      io.to(room_for_1p).emit("gift_card", card_one, idx, match);
      idx++;
    } else if (idx != 0 && idx < shuffled_card_list.length) {
      // 바로 전 카드와 비교
      var card_before = shuffled_card_list[idx - 1];
      var card_one = shuffled_card_list[idx];

      var is_five =
        Number(card_one.substring(1, 2)) + Number(card_before.substring(1, 2));

      if (Number(card_one.substring(1, 2)) == 5 || is_five == 5) match = true;

      io.to(room_for_1p).emit("gift_card", card_one, idx, match);
      idx++;
    } else {
      console.log("카드 다 줬음. 엔딩은 1P 2P 카운트 비교해서");
    }
  },

  count: (count) => {
    if (player_one == 0 || player_two == 0 || count == 0) {
      console.log(
        "게임 끝. (player_one)" + player_one + " 대 (player_two)" + player_two
      );
    }
  },
  client_message: (msg) => {
    console.log("클라에게서 온 메시지: ", msg);
  },
};

export const handler = {
  go: () => {
    // app.io.emit('hihi', socket_list);

    if (two_room == "") {
      two_room = socket.id;

      // 방정보 셋팅
      room_info.roomName = two_room;

      socket.join(two_room, () => {
        player_one = new player("1p", null, true, socket.id, 28);
        player_two = new player("2p", null, false, null, 28);

        room_info.socketList[0] = socket.id;

        info_msg.mode = "start";
        info_msg.msg = player_one;

        app.io.to(two_room).emit("server_message", info_msg); // <<<<<<<<<<<<<<<< emit
        app.io.emit("server_message", room_info); // <<<<<<<<<<<<<<<< emit

        player_one.info();

        console.log(info_msg);
        console.log("room_info: ", room_info);
      });
    } else if (two_room != socket.id) {
      // 입장을 두 명으로 제한
      if (room_info.socketList.length < 2) {
        socket.join(two_room, () => {
          player_two.socketId = socket.id;
          room_info.socketList[1] = socket.id;

          info_msg.mode = "start";
          info_msg.msg = player_two;

          app.io.to(two_room).emit("server_message", info_msg); // <<<<<<<<<<<<<<<< emit
          app.io.emit("server_message", room_info); // <<<<<<<<<<<<<<<< emit

          player_two.info();

          console.log(info_msg);
          console.log("room_info: ", room_info);
        });
      }

      // var rooms = socket.adapter.rooms;
      // app.io.to(two_room).emit('방정보', JSON.stringify(rooms));

      // console.log("방정보: " + JSON.stringify(rooms));
    }
  },

  show_me_the_card: () => {
    if (player_one.life > 0 && player_two.life > 0) {
      var match = false;
      var ask = "";

      // 카드 요청한 플레이어 확인해서 상태 변경
      if (player_one.socketId == socket.id) {
        player_one.turn = false;
        player_two.turn = true;

        ask = player_one.socketId;

        player_one.life--;

        info_msg.mode = "info";
        info_msg.msg = "player1 남은 카드: " + player_one.life;
        app.io.emit("server_message", info_msg); // <<<<<<<<<<<<<<<< emit
      } else if (player_two.socketId == socket.id) {
        player_two.turn = false;
        player_one.turn = true;

        ask = player_two.socketId;

        player_two.life--;

        info_msg.mode = "info";
        info_msg.msg = "player2 남은 카드: " + player_two.life;
        app.io.emit("server_message", info_msg); // <<<<<<<<<<<<<<<< emit
      }

      if (idx == 0) {
        // 첫 카드.
        //처음 종을 쳤을 경우, 상대방의 안깐 카드를 주는지(카드 뒤집는 횟수를 늘리는지)
        //바닥에 쌓는 카드를 늘리는지

        var card_one = shuffled_card_list[0];

        match = Number(card_one.substring(1, 2)) == 5 ? true : false;
        app.io.to(two_room).emit("gift_card", card_one, idx, match, ask); // <<<<<<<<<<<<<<<< emit
        idx++;
      } else if (idx != 0 && idx < shuffled_card_list.length) {
        // 바로 전 카드와 비교
        var card_before = shuffled_card_list[idx - 1];
        var card_one = shuffled_card_list[idx];
        var card_before_num = Number(card_before.substring(1, 2));
        var card_one_num = Number(card_one.substring(1, 2));

        var same_kind =
          card_one.substring(0, 1) == card_before.substring(0, 1)
            ? true
            : false;

        if (same_kind) {
          var make_five = card_before_num + card_one_num == 5 ? true : false;
        }

        // 카드 숫자가 5일 때 종을 안치고 넘어가서 바닥엔 5가 계속 있는 상태일 때의 예외처리 필요

        match = make_five || card_one_num == 5 ? true : false;
        app.io.to(two_room).emit("gift_card", card_one, idx, match, ask); // <<<<<<<<<<<<<<<< emit
        idx++;

        console.log(
          card_before,
          card_one,
          "  >>>  same_kind: ",
          same_kind,
          " / match: ",
          match
        );
      } else {
        console.log("카드 다 줬음. 엔딩은 1P 2P 카운트 비교해서");
      }

      info_msg.mode = "card_open_after";
      info_msg.msg = [player_one, player_two];

      app.io.to(two_room).emit("server_message", info_msg); // <<<<<<<<<<<<<<<< emit
    } else {
      console.log("엔딩처리 ㄱㄱㄱㄱㄱㄱ", player_one.life, player_two.life);
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

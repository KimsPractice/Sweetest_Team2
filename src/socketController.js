import makeCardDeck from "./makeDeck";
import handleEmit from "./handleEmit";

const socketController = (socket, io) => {
  const idx = 0;

  // 접속유저 유저아이디 저장
  let socket_list = [socket.id];

  // 카드 생성
  const shuffledDeck = makeCardDeck();

  // 방에 안입장한 사람들은 관전할 수 있게 하면 되겠음
  socket
    .on("go", () => handleEmit.go(socket))

    // 카드 요청 > 전달 이벤트
    .on("show_me_the_card", () => {
      if (player_one.life > 0 && player_two.life > 0) {
        const match = false;
        const ask = "";

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

          const card_one = shuffled_card_list[0];

          match = Number(card_one.substring(1, 2)) == 5 ? true : false;
          app.io.to(two_room).emit("gift_card", card_one, idx, match, ask); // <<<<<<<<<<<<<<<< emit
          idx++;
        } else if (idx != 0 && idx < shuffled_card_list.length) {
          // 바로 전 카드와 비교
          const card_before = shuffled_card_list[idx - 1];
          const card_one = shuffled_card_list[idx];
          const card_before_num = Number(card_before.substring(1, 2));
          const card_one_num = Number(card_one.substring(1, 2));

          const same_kind =
            card_one.substring(0, 1) == card_before.substring(0, 1)
              ? true
              : false;

          if (same_kind) {
            const make_five =
              card_before_num + card_one_num == 5 ? true : false;
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
    })

    .on("count", (count) => {
      if (player_one == 0 || player_two == 0 || count == 0) {
        console.log(
          "게임 끝. (player_one)" + player_one + " 대 (player_two)" + player_two
        );
      }
    })

    // 클라이언트로부터 전달받은 메시지를 종류별로 처리
    .on("client_message", (msg) => {
      console.log("=== client_message: ", msg);

      const msg_mode = msg.mode;

      switch (msg_mode) {
        // 플레이어에게 닉네임 셋팅
        case "user_init":
          console.log("★★★ user_init: ", socket.id);
          console.log("socket list", socket_list);

          if (player_one.socketId == socket.id) {
            console.log("dddd");
            player_one.name = msg.userName;
          } else if (player_two.socketId === socket.id) {
            player_two.name = msg.userName;
          }

          console.log("1p:", player_one);
          console.log("2p:", player_two);

          break;

        // 벨 친 사람 정보로 카운트와 턴 처리
        case "bell":
          console.log("★★★ bell: ", socket.id);

          if (player_one.life > 0 && player_two.life > 0) {
            if (player_one.socketId == socket.id) {
              if (!msg.match) player_one.life--;
              player_one.turn = false;
              player_two.turn = true;

              info_msg.mode = "info";
              info_msg.msg = "player1 남은 카드: " + player_one.life;

              app.io.emit("server_message", info_msg); // <<<<<<<<<<<<<<<< emit
            } else if (player_two.socketId === socket.id) {
              if (!msg.match) player_two.life--;
              player_two.turn = false;
              player_one.turn = true;

              info_msg.mode = "info";
              info_msg.msg = "player2 남은 카드: " + player_two.life;

              app.io.emit("server_message", info_msg); // <<<<<<<<<<<<<<<< emit
            }
            info_msg.mode = "bell";
            // info_msg.msg = "벨 결과: (1p)" + player_one.life + " : (2p)" + player_two.life;
            info_msg.msg = [player_one, player_two];

            app.io.to(two_room).emit("server_message", info_msg); // <<<<<<<<<<<<<<<< emit
          } else if (player_one.life == 0) {
            console.log("플레이어1 0 됐음");

            app.io.to(player_one.socketId).emit("lose");
            app.io.to(player_two.socketId).emit("win");
          } else if (player_two.life == 0) {
            console.log("플레이어2 0 됐음");

            app.io.to(player_one.socketId).emit("win");
            app.io.to(player_two.socketId).emit("lose");
          }

          break;

        case "msg":
          break;

        case "abc":
          break;
      }
    })

    // .on() 엔딩.
    /* 승패 판별 방법.
		1p 2p 각각 28 부여해서 차감하는 방식으로, (제출시 -1, 종 잘못치면 -1)
		0에 먼저 도달하면 패배
		무승부도 생각해 봐야함.
	*/

    .on("reset", () => {
      shuffled_card_list = shuffled_card_list = card_list.shuffle();
      idx = 0;
      player_one.life = 28;
      player_two.life = 28;

      console.log("=== 카드 셔플 ===");
      console.log("=== SUFFLED CARD LIST", shuffled_card_list);

      app.io.emit("clean"); // <<<<<<<<<<<<<<<< emit
    })

    .on("disconnect", () => {
      // app.io.emit('clear', socket.id);  // <<<<<<<<<<<<<<<< emit

      if (socket.id == two_room) {
        console.log("방장이 방을 나갔음");
        // 방이름 바꾸기

        two_room = "";
        app.io.emit("clean");
      }

      // 방정보에서 해당 소켓 삭제
      const socket_index = room_info.socketList.indexOf(socket.id);
      room_info.socketList.splice(socket_index, 1);

      socket.leave(two_room);

      console.log("연결해제: " + socket.id);
      delete socket_list[socket.id];
    });
};

export default socketController;

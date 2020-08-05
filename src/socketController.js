import makeCardDeck from "./makeDeck";
import player from "./player";

const room_info = {
  name: "",
  userList: [],
  full: false,
};

const socketController = (socket, io) => {
  let { name: roomName, userList } = room_info;
  let shuffledDeck = makeCardDeck();

  const enterRoom = (roomName, newPlayer) => {
    socket.join(roomName, () => {
      const { userList } = room_info;

      if (newPlayer) {
        userList.push(newPlayer);
      }

      io.to(roomName).emit("userInit", userList);

      newPlayer.info();
    });
  };

  const player1Cards = shuffledDeck.slice(0, shuffledDeck.length / 2);
  const player2Cards = shuffledDeck.slice(
    shuffledDeck.length / 2,
    shuffledDeck.length
  );

  socket.on("ready", (nickName) => {
    if (roomName == "") {
      // 방이름을 방장의 소켓 아이디로 지정
      roomName = socket.id;
      room_info.name = roomName;

      const newPlayer = new player(
        "1P",
        nickName || "anonymous",
        true,
        socket.id,
        true,
        []
      );

      enterRoom(roomName, newPlayer);
    } else if (roomName != socket.id) {
      // 입장을 두 명으로 제한
      if (userList.length < 2) {
        const newPlayer2 = new player(
          "2P",
          nickName || "anonymous",
          false,
          socket.id,
          true,
          []
        );

        enterRoom(roomName, newPlayer2);
      } else {
        console.log("게임방에 빈자리가 없습니다.");
      }
    }

    if ((userList.length = 2)) {
      room_info.full = true;
      const { userList } = room_info;

      io.to(userList[0].socketId).emit("readyComplete", room_info);
    }
  });

  // // 카드 요청 > 전달 이벤트
  // socket.on("cardOpen", () => {
  //   const player1 = userList[0];
  //   const player2 = userList[1];
  //   console.log(player1, player2);
  //   if (player1.life > 0 && player2.life > 0) {
  //     const match = false;
  //     const ask = "";

  //     // 카드 요청한 플레이어 확인해서 상태 변경
  //     if (player1.socketId == socket.id) {
  //       player1.turn = false;
  //       player2.turn = true;

  //       ask = player1.socketId;

  //       player1.life--;

  //       info_msg.mode = "info";
  //       info_msg.msg = "player1 남은 카드: " + player1.life;
  //       io.emit("server_message", info_msg); // <<<<<<<<<<<<<<<< emit
  //     } else if (player2.socketId == socket.id) {
  //       player2.turn = false;
  //       player1.turn = true;

  //       ask = player2.socketId;

  //       player2.life--;

  //       info_msg.mode = "info";
  //       info_msg.msg = "player2 남은 카드: " + player2.life;
  //       io.emit("server_message", info_msg); // <<<<<<<<<<<<<<<< emit
  //     }

  //     if (idx == 0) {
  //       // 첫 카드.
  //       //처음 종을 쳤을 경우, 상대방의 안깐 카드를 주는지(카드 뒤집는 횟수를 늘리는지)
  //       //바닥에 쌓는 카드를 늘리는지

  //       const card_one = shuffled_card_list[0];

  //       match = Number(card_one.substring(1, 2)) == 5 ? true : false;
  //       app.io.to(two_room).emit("gift_card", card_one, idx, match, ask); // <<<<<<<<<<<<<<<< emit
  //       idx++;
  //     } else if (idx != 0 && idx < shuffled_card_list.length) {
  //       // 바로 전 카드와 비교
  //       const card_before = shuffled_card_list[idx - 1];
  //       const card_one = shuffled_card_list[idx];
  //       const card_before_num = Number(card_before.substring(1, 2));
  //       const card_one_num = Number(card_one.substring(1, 2));

  //       const same_kind =
  //         card_one.substring(0, 1) == card_before.substring(0, 1)
  //           ? true
  //           : false;

  //       if (same_kind) {
  //         const make_five = card_before_num + card_one_num == 5 ? true : false;
  //       }

  //       // 카드 숫자가 5일 때 종을 안치고 넘어가서 바닥엔 5가 계속 있는 상태일 때의 예외처리 필요

  //       match = make_five || card_one_num == 5 ? true : false;
  //       app.io.to(two_room).emit("gift_card", card_one, idx, match, ask); // <<<<<<<<<<<<<<<< emit
  //       idx++;

  //       console.log(
  //         card_before,
  //         card_one,
  //         "  >>>  same_kind: ",
  //         same_kind,
  //         " / match: ",
  //         match
  //       );
  //     } else {
  //       console.log("카드 다 줬음. 엔딩은 1P 2P 카운트 비교해서");
  //     }

  //     info_msg.mode = "card_open_after";
  //     info_msg.msg = [player1, player2];

  //     app.io.to(two_room).emit("server_message", info_msg); // <<<<<<<<<<<<<<<< emit
  //   } else {
  //     console.log("엔딩처리 ㄱㄱㄱㄱㄱㄱ", player1.life, player2.life);
  //   }
  // });

  // socket.on("count", (count) => {
  //   if (player_one == 0 || player2 == 0 || count == 0) {
  //     console.log(
  //       "게임 끝. (player_one)" + player_one + " 대 (player2)" + player2
  //     );
  //   }
  // });

  // 클라이언트로부터 전달받은 메시지를 종류별로 처리
  // socket.on("client_message", (msg) => {
  //   const player1 = userList[0];
  //   const player2 = userList[1];

  //   console.log("=== client_message: ", msg);

  //   const { mode } = msg;

  //   switch (mode) {
  //     // 플레이어에게 닉네임 셋팅
  //     case "user_init":
  //       console.log("★★★ user_init: ", socket.id);

  //       if (player1.socketId == socket.id) {
  //         player1.name = msg.userName;
  //       } else if (player2.socketId == socket.id) {
  //         player2.name = msg.userName;
  //       }

  //       console.log("1p:", player1);
  //       console.log("2p:", player2);

  //       break;

  //     // 벨 친 사람 정보로 카운트와 턴 처리
  //     case "bell":
  //       console.log("★★★ bell: ", socket.id);

  //       if (player1.life > 0 && player2.life > 0) {
  //         if (player1.socketId == socket.id) {
  //           if (!msg.match) player1.life--;
  //           player1.turn = false;
  //           player2.turn = true;

  //           info_msg.mode = "info";
  //           info_msg.msg = "player1 남은 카드: " + player1.life;

  //           app.io.emit("server_message", info_msg); // <<<<<<<<<<<<<<<< emit
  //         } else if (player2.socketId === socket.id) {
  //           if (!msg.match) player2.life--;
  //           player2.turn = false;
  //           player1.turn = true;

  //           info_msg.mode = "info";
  //           info_msg.msg = "player2 남은 카드: " + player2.life;

  //           app.io.emit("server_message", info_msg); // <<<<<<<<<<<<<<<< emit
  //         }
  //         info_msg.mode = "bell";
  //         // info_msg.msg = "벨 결과: (1p)" + player1.life + " : (2p)" + player2.life;
  //         info_msg.msg = [player1, player2];

  //         app.io.to(two_room).emit("server_message", info_msg); // <<<<<<<<<<<<<<<< emit
  //       } else if (player1.life == 0) {
  //         console.log("플레이어1 0 됐음");

  //         app.io.to(player1.socketId).emit("lose");
  //         app.io.to(player2.socketId).emit("win");
  //       } else if (player2.life == 0) {
  //         console.log("플레이어2 0 됐음");

  //         app.io.to(player1.socketId).emit("win");
  //         app.io.to(player2.socketId).emit("lose");
  //       }

  //       break;

  //     case "msg":
  //       break;

  //     case "abc":
  //       break;
  //   }
  // });

  // // .on() 엔딩.
  // /* 승패 판별 방법.
  // 	1p 2p 각각 28 부여해서 차감하는 방식으로, (제출시 -1, 종 잘못치면 -1)
  // 	0에 먼저 도달하면 패배
  // 	무승부도 생각해 봐야함.
  // */

  // socket.on("reset", () => {
  //   shuffled_card_list = shuffled_card_list = card_list.shuffle();
  //   idx = 0;
  //   player_one.life = 28;
  //   player2.life = 28;

  //   console.log("=== 카드 셔플 ===");
  //   console.log("=== SUFFLED CARD LIST", shuffled_card_list);

  //   app.io.emit("clean"); // <<<<<<<<<<<<<<<< emit
  // });

  // socket.on("disconnect", () => {
  //   // app.io.emit('clear', socket.id);  // <<<<<<<<<<<<<<<< emit

  //   if (socket.id == room) {
  //     console.log("방장이 방을 나갔음");
  //     // 방이름 바꾸기

  //     room = "";
  //     io.emit("clean");
  //   }

  //   // 방정보에서 해당 소켓 삭제
  //   const socket_index = room_info.userList.indexOf(socket.id);
  //   room_info.userList.splice(socket_index, 1);

  //   socket.leave(room);

  //   console.log("연결해제: " + socket.id);
  //   delete socket_list[socket.id];
  // });
};

export default socketController;

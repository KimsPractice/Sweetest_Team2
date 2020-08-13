import makeCardDeck from "./makeDeck";
import player from "./player";

const room_info = {
  name: "",
  userList: [],
  full: false,
  usedCards: [],
};

const socketController = (socket, io) => {
  let { name: roomName, userList, usedCards } = room_info;
  let shuffledDeck = makeCardDeck();

  const sliceDeck = (userDeck) => {
    const slicedCard = userDeck[0];
    const slicedDeck = userDeck.slice(1, userDeck.length);
    return { slicedCard, slicedDeck };
  };

  const enterRoom = (roomName, newPlayer) => {
    userList.push(newPlayer);
    socket.join(roomName);
    io.emit("userInit", userList);
    newPlayer.info();
  };

  socket.on("bellClick", ({ userId, currentCards }) => {
    let cleaning = false;

    const correctBell = () => {
      userList.map((user) => {
        if (user.socketId === socket.id) {
          usedCards.map((card) => {
            user.cards.push(card);
          });
          console.log(user.cards);
        }
      });
      usedCards = [];
      cleaning = true;
    };

    const mistakeBell = () => {
      let dropCard = "";
      cleaning = false;
      userList.map((user) => {
        if (user.socketId == userId) {
          console.log(user.cards);
          const { slicedCard, slicedDeck } = sliceDeck(user.cards);
          dropCard = slicedCard;
          console.log("dropCard: " + dropCard);
          user.cards = slicedDeck;
        } else {
          user.cards.push(dropCard);
        }
      });
    };

    if (currentCards.length < 2) {
      mistakeBell();
    } else {
      const cardKind1 = currentCards[0].substring(0, 1);
      const cardKind2 = currentCards[1].substring(0, 1);
      const cardNum1 = parseInt(currentCards[0].substring(1, 2));
      const cardNum2 = parseInt(currentCards[1].substring(1, 2));

      if (cardKind1 === cardKind2 && cardNum1 + cardNum2 >= 5) {
        correctBell();
      } else if (cardNum1 === 5 || cardNum2 === 5) {
        correctBell();
      } else {
        mistakeBell();
      }
    }
    io.emit("bellDone", cleaning);
  });

  socket.on("cardOpen", (openUserId) => {
    let firstCard = "";

    userList.map((user) => {
      if (user.socketId === openUserId) {
        if (user.cards.length != 0) {
          user.turn = false;
          const { slicedCard, slicedDeck } = sliceDeck(user.cards);
          firstCard = slicedCard;
          user.cards = slicedDeck;
          usedCards.push(firstCard);
          console.log(user.cards.length);
        } else {
          io.emit("gameSet", { userList, loseuserId: openUserId });
        }
      } else {
        user.turn = true;
      }
    });

    io.emit("drawCard", { firstCard, userList });
  });

  socket.on("gameStart", () => {
    const player1Cards = shuffledDeck.slice(0, shuffledDeck.length / 2);
    const player2Cards = shuffledDeck.slice(
      shuffledDeck.length / 2,
      shuffledDeck.length
    );

    userList[0].cards = player1Cards;
    userList[1].cards = player2Cards;

    io.emit("gameSetup", userList);
  });

  socket.on("ready", (nickName) => {
    if (userList.length == 0) {
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
    } else if (roomName !== socket.id) {
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
        socket.emit("full");
      }
    }

    if (userList.length === 2) {
      room_info.full = true;
      io.to(userList[0].socketId).emit("readyComplete", room_info);
    }
  });

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

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
    console.log(userId);

    const correctBell = () => {
      console.log("딩동댕! 사용된 카드를 가져옵니다!");

      userList.map((user) => {
        if (user.socketId === socket.id) {
          console.log("이전카드: " + user.cards);
          console.log("추가될카드:" + usedCards);
          usedCards.map((card) => {
            user.cards.push(card);
          });
          console.log("추가된카드: " + user.cards);
        }
      });
      usedCards = [];
      cleaning = true;
    };

    const mistakeBell = () => {
      console.log("땡! 상대방에게 카드를 한장주었습니다.");

      const player1 = userList[0];
      const player2 = userList[1];

      let dropCard = "";
      cleaning = false;

      if (player1.socketId === userId) {
        const { slicedCard, slicedDeck } = sliceDeck(player1.cards);
        dropCard = slicedCard;
        console.log("전달된 카드: " + dropCard);
        player1.cards = slicedDeck;
        player2.cards.push(dropCard);
      } else if (player2.socketId === userId) {
        const { slicedCard, slicedDeck } = sliceDeck(player2.cards);
        dropCard = slicedCard;
        console.log("전달된 카드: " + dropCard);
        player2.cards = slicedDeck;
        player1.cards.push(dropCard);
      }

      console.log(player1.cards);
      console.log(player2.cards);
    };

    if (currentCards.length < 2) {
      if (parseInt(currentCards[0].substring(1, 2)) != 5) {
        mistakeBell();
      } else {
        correctBell();
      }
    } else {
      const cardKind1 = currentCards[0].substring(0, 1);
      const cardNum1 = parseInt(currentCards[0].substring(1, 2));
      const cardKind2 = currentCards[1].substring(0, 1);
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

  socket.on("disconnect", () => {
    // if (socket.id == room) {
    //   console.log("방장이 방을 나갔음");
    //   // 방이름 바꾸기
    //   room = "";
    //   io.emit("clean");
    // }
    // // 방정보에서 해당 소켓 삭제
    // const socket_index = room_info.userList.indexOf(socket.id);
    // room_info.userList.splice(socket_index, 1);
    // socket.leave(room);
    // console.log("연결해제: " + socket.id);
    // delete socket_list[socket.id];
  });
};

export default socketController;

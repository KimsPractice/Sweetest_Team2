import player from "./player";

const handleEmit = {
  go: (socket) => {
    let room = ""; // 2인용 방
    const room_info = {
      name: "",
      userList: [],
    };

    const info_msg = {
      mode: "info",
      msg: "",
    };

    let { name: roomName, userList } = room_info;

    if (room == "") {
      room = socket.id;

      // 방이름을 방장의 소켓 아이디로 지정
      roomName = room;

      socket.join(roomName, () => {
        const newPlayer = new player("1P", null, true, socket.id, 28);

        userList.push(newPlayer);

        info_msg = {
          mode: "start",
          msg: newPlayer,
        };

        io.to(roomName).emit("server_message", info_msg);
        io.emit("server_message", room_info);

        newPlayer.info();

        console.log(info_msg);
        console.log("room_info: ", room_info);
      });
    } else if (room != socket.id) {
      const newPlayer = new player("2P", null, false, socket.id, 28);
      // 입장을 두 명으로 제한
      if (userList.length < 2) {
        socket.join(room, () => {
          newPlayer.socketId = socket.id;
          userList.push(newPlayer);

          info_msg = {
            mode: "start",
            msg: newPlayer,
          };

          io.to(room).emit("server_message", info_msg); // <<<<<<<<<<<<<<<< emit
          io.emit("server_message", room_info); // <<<<<<<<<<<<<<<< emit

          player_two.info();

          console.log(info_msg);
          console.log("room_info: ", room_info);
        });
      } else {
        // 추후에 방인원 제외 한 다른인원들에 대한 처리
      }
    }
  },
};

export default handleEmit;

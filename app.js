var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
// var usersRouter = require('./routes/users');
const router = require("./routes/index");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
// app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

// 시작 전 bin/www 에서 포트를 본인 환경으로 바꾸세용 (현 8080)
// 준비물 ========================================================================

// 플레이어 생성자. [ roll: 1p인지 2p인지 / name: 닉네임 / turn: 턴 / id: socket.id / count: 남은 카드 갯수 ]
class player {
  constructor(roll, name, turn, socketId, count) {
    this.roll = roll;
    this.name = name;
    this.turn = turn;
    this.socketId = socketId;
    this.count = 28; // 1:1만 할거라 일단 28로 고정. 여러명은 나중에 생각
    this.info = () => {
      console.log("	======== " + roll + "player info =======");
      console.log("	name: " + name);
      console.log("	turn: " + turn);
      console.log("	socket.id: " + socketId);
      console.log("	소지 카드: " + count);
    };
  }
}

// 카드 생성
const alpha_list = ["a", "b", "c", "d"]; // 종류
const num_list = [1, 2, 3, 4, 5]; // 숫자
const card_list = [];

for (var i = 0; i < alpha_list.length; i++) {
  for (var j = 0; j < num_list.length; j++) {
    if (j == "1") {
      var k = 2;
    } else {
      var k = j;
    } // 5 3 3 2 1 되기 위해
    while (k < 5) {
      card_list.push(alpha_list[i] + num_list[j]);
      k++;
    }
  }
}
console.log("=== CARD LIST(" + card_list.length + "개): ", card_list);

// 카드 섞기
Array.prototype.shuffle = function () {
  let length = this.length;
  while (length) {
    let index = Math.floor(length-- * Math.random());
    let temp = this[length];
    this[length] = this[index];
    this[index] = temp;
  }
  return this;
};

var shuffled_card_list = card_list.shuffle();
console.log("=== SHUFFLED CARD LIST: ", shuffled_card_list);

var player_one;
var player_two;

var socket_list = {};

var two_room = ""; // 2인용 방

var idx = 0;
var bell_flag = false;
var used_card_list = [];

var room_info = {
  roomName: null,
  socketList: [],
};

var info_msg = {
  mode: "info",
  msg: null,
};

// 소켓 통신 =====================================================================

app.io = require("socket.io")();
app.io.on("connection", (socket) => {
  socket_list[socket.id] = socket.id;
  // app.io.emit('hihi', socket_list);

  // 입장
  socket
    .on("go", () => {
      // app.io.emit('hihi', socket_list);

      if (two_room == "") {
        two_room = socket.id;

        // 방정보 셋팅
        room_info.roomName = two_room;

        socket.join(two_room, () => {
          player_one = new player("1p", null, true, socket.id, 28);
          player_two = new player("2p", null, false, null, 28);

          room_info.socketList[0] = socket.id;

          app.io.emit("info", room_info); // <<<<<<<<<<<<<<<< emit

          player_one.info();

          console.log(info_msg);
          console.log("room_info: ", room_info);
        });
      } else if (two_room != socket.id) {
        // 2P 입장

        // 입장을 두 명으로 제한
        if (room_info.socketList.length < 2) {
          socket.join(two_room, () => {
            player_two.socketId = socket.id;
            room_info.socketList[1] = socket.id;

            app.io.emit("info", room_info); // <<<<<<<<<<<<<<<< emit

            player_two.info();

            console.log(info_msg);
            console.log("room_info: ", room_info);
          });
        }

        // var rooms = socket.adapter.rooms;
        // app.io.to(two_room).emit('방정보', JSON.stringify(rooms));

        // console.log("방정보: " + JSON.stringify(rooms));
      }
    })

    // 플레이어 닉네임 세팅
    .on("user_init", (userName) => {
      console.log("★★★ user_init: ", socket.id);
      console.log("socket list", socket_list);

      if (player_one.socketId == socket.id) {
        console.log("dddd");
        player_one.name = userName;
      } else if (player_two.socketId == socket.id) {
        player_two.name = userName;
      }

      console.log("1p:", player_one);
      console.log("2p:", player_two);

      var ready_msg = [player_one, player_two];

      app.io.to(two_room).emit("ready", ready_msg); // <<<<<<<<<<<<<<<< emit
    })

    // 카드 요청 > 전달 이벤트
    .on("show_me_the_card", () => {
      // 카운트 체크 함수로

      if (player_one.count < 0) {
        app.io.to(player_one.socketId).emit("win"); // <<<<<<<<<<<<<<<< emit
        app.io.to(player_two.socketId).emit("lose"); // <<<<<<<<<<<<<<<< emit
      } else if (player_two.count < 0) {
        app.io.to(player_one.socketId).emit("lose"); // <<<<<<<<<<<<<<<< emit
        app.io.to(player_two.socketId).emit("win"); // <<<<<<<<<<<<<<<< emit
      } else {
        var match = false;
        var ask = "";

        // 카드 요청한 플레이어 확인해서 상태 변경
        if (player_one.socketId == socket.id) {
          player_one.turn = false;
          player_two.turn = true;

          ask = player_one.socketId;

          player_one.count--;

          var info_msg = "player1 남은 카드: " + player_one.count;
          app.io.emit("info", info_msg); // <<<<<<<<<<<<<<<< emit
        } else if (player_two.socketId == socket.id) {
          player_two.turn = false;
          player_one.turn = true;

          ask = player_two.socketId;

          player_two.count--;

          var info_msg = "player2 남은 카드: " + player_two.count;
          app.io.emit("info", info_msg); // <<<<<<<<<<<<<<<< emit
        }

        if (idx == 0 || bell_flag) {
          // 첫 카드.
          bell_flag = false;
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
          var five_card =
            card_one_num == 5 || (card_before_num == 5 && !same_kind)
              ? true
              : false;

          // 합 5
          if (same_kind) {
            var make_five = card_before_num + card_one_num == 5 ? true : false;
          }

          match = make_five || five_card ? true : false;

          // 바닥 카드
          // used_card_list.push(card_one);
          // console.log("바닥 카드 ", used_card_list);

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
        }

        var card_open_after_msg = [player_one, player_two];

        app.io.to(two_room).emit("card_open_after", card_open_after_msg); // <<<<<<<<<<<<<<<< emit
      }
    })

    // 아직 안씀
    .on("count", (count) => {
      if (player_one == 0 || player_two == 0 || count == 0) {
        console.log(
          "게임 끝. (player_one)" + player_one + " 대 (player_two)" + player_two
        );
      }
    })

    // 벨
    .on("bell", (match) => {
      console.log("★★★ bell: ", socket.id);

      bell_flag = true;

      //   for (var i = 0; i < used_card_list.length; i++) {
      //     shuffled_card_list.push(used_card_list[i]);
      //   }
      //   console.log("바닥카드 덧붙인 shuffled_card_list", shuffled_card_list);

      if (player_one.count > 0 && player_two.count > 0) {
        if (player_one.socketId == socket.id) {
          if (!match) {
            // player_one.count--;
            // player_two.count = player_two.count;
            player_one.turn = false;
            player_two.turn = true;
          } else {
            // player_two.count--;
            // player_one.count = player_one.count;
            player_two.turn = false;
            player_one.turn = true;
          }

          var info_msg = "player1 남은 카드: " + player_one.count;
          app.io.emit("info", info_msg); // <<<<<<<<<<<<<<<< emit

          var card_open_after_msg = [player_one, player_two];
          app.io.to(two_room).emit("card_open_after", card_open_after_msg); // <<<<<<<<<<<<<<<< emit
        } else if (player_two.socketId == socket.id) {
          if (!match) {
            // player_two.count--;
            // player_one.count = player_one.count;
            player_two.turn = false;
            player_one.turn = true;
          } else {
            // player_one.count--;
            // player_two.count = player_two.count;
            player_one.turn = false;
            player_two.turn = true;
          }

          var info_msg = "player2 남은 카드: " + player_two.count;
          app.io.emit("info", info_msg); // <<<<<<<<<<<<<<<< emit

          var card_open_after_msg = [player_one, player_two];
          app.io.to(two_room).emit("card_open_after", card_open_after_msg); // <<<<<<<<<<<<<<<< emit
        }

        // used_card_list = [];
        // info_msg.msg = "벨 결과: (1p)" + player_one.count + " : (2p)" + player_two.count;
        var bell_msg = [player_one, player_two];

        app.io.to(two_room).emit("bell", bell_msg); // <<<<<<<<<<<<<<<< emit
      } else if (player_one.count < 0) {
        console.log("플레이어1 0 됐음");

        app.io.to(player_one.socketId).emit("win"); // <<<<<<<<<<<<<<<< emit
        app.io.to(player_two.socketId).emit("lose"); // <<<<<<<<<<<<<<<< emit
      } else if (player_two.count < 0) {
        console.log("플레이어2 0 됐음");

        app.io.to(player_one.socketId).emit("lose"); // <<<<<<<<<<<<<<<< emit
        app.io.to(player_two.socketId).emit("win"); // <<<<<<<<<<<<<<<< emit
      }
    })

    .on("reset", () => {
      shuffled_card_list = card_list.shuffle();
      idx = 0;
      player_one.count = 28;
      player_two.count = 28;

      console.log("=== 카드 셔플 ===");
      console.log("=== SUFFLED CARD LIST", shuffled_card_list);

      app.io.emit("clean"); // <<<<<<<<<<<<<<<< emit
    })

    .on("disconnect", () => {
      // app.io.emit('clear', socket.id);    // <<<<<<<<<<<<<<<< emit

      if (socket.id == two_room) {
        console.log("방장이 방을 나갔음");
        // 방이름 바꾸기

        two_room = "";
        app.io.emit("clean");
      }

      // 방정보에서 해당 소켓 삭제
      var socket_index = room_info.socketList.indexOf(socket.id);
      room_info.socketList.splice(socket_index, 1);

      socket.leave(two_room);

      console.log("연결해제: " + socket.id);
      delete socket_list[socket.id];
    });
});

module.exports = app;

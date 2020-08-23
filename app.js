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
		this.count = 5; // 1:1만 할거라 일단 28로 고정. 여러명은 나중에 생각 FIXME: 테스트용으로 잠깐 줄여놓음
		this.info = () => {
			console.log("	======== " + roll + " player info =======");
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
		if (j == 1) {
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
var bell_flag = true;

var room_info = {
	roomName: null,
	socketList: [],
};

// 턴 제어
function turnChanger(player1, player2, sId, bell) {
	if (typeof bell !== "boolean") bell = false;
	player1.turn = (bell && player1.socketId == sId) || (!bell && player1.socketId != sId) ? true : false;
	player2.turn = !player1.turn;

	return player1, player2;
}

// 카운트 체크해서 승자 리턴
function countChecker(player1, player2) {
	let winner = false;
	if (player1.count <= 0) { // MEMO: 0됐을 때 카드요청 막으면 등호로 바꿔도 됨. 마이너스 테스트용
		winner = player1;
	} else if (player2.count <= 0) {
		winner = player2;
	}
	return winner;
}

function resetGame() {
	shuffled_card_list = card_list.shuffle();
	idx = 0;
	// player_one.count = 28;
	// player_two.count = 28;
}


// 소켓 통신 =====================================================================

app.io = require("socket.io")();
app.io.on("connection", (socket) => {
	socket_list[socket.id] = socket.id;

	// TODO: 마지막에 콘솔로그 정리하면서 emit 타겟도 정리할 것

	// 입장
	socket.on("go", () => {
		// MEMO: 방을 늘릴 것인지 좀 더 생각
		if (two_room == "") {
			two_room = socket.id;

			// 방정보 셋팅
			room_info.roomName = two_room;

			socket.join(two_room, () => {
				player_one = new player("1p", null, true, socket.id, 28);
				player_two = new player("2p", null, false, null, 28);

				room_info.socketList[0] = socket.id;

				app.io.emit("info", room_info); // <<<<<<<<<<<<<<<< emit

			});
		} else if (two_room != socket.id) {
			// 2P 입장

			// 입장을 두 명으로 제한
			if (room_info.socketList.length < 2) {
				socket.join(two_room, () => {
					player_two.socketId = socket.id;
					room_info.socketList[1] = socket.id;

					app.io.emit("info", room_info); // <<<<<<<<<<<<<<<< emit
				});
			}
		}
		console.log("room_info: ", room_info);
	})

	// 플레이어 닉네임 세팅
	.on("user_init", (userName) => {
		console.log("★★★ user_init: ", socket.id);

		if (player_one.socketId == socket.id) {
			player_one.name = userName;
		} else if (player_two.socketId == socket.id) {
			player_two.name = userName;
		}

		var ready_msg = [player_one, player_two];
		
		app.io.to(two_room).emit("ready", ready_msg); // <<<<<<<<<<<<<<<< emit
		console.log(ready_msg);
	})

	// 카드 요청 > 전달 이벤트
	.on("show_me_the_card", () => {

		var match = false;
		var ask = socket.id;

		turnChanger(player_one, player_two, socket.id, null);

		(ask == player_one.socketId) ? player_one.count-- : player_two.count--;

		var info_msg = "남은 카드: " + player_one.count + " vs " + player_two.count;
		app.io.emit("info", info_msg); // <<<<<<<<<<<<<<<< emit

		// 홀로 나와 있는 카드 (이전 카드와 비교하지 않음)
		if (idx == 0 && bell_flag) {
			bell_flag = false;
			var card_one = shuffled_card_list[0];

			match = Number(card_one.substring(1, 2)) == 5 ? true : false;
			app.io.to(two_room).emit("gift_card", card_one, idx, match, ask); // <<<<<<<<<<<<<<<< emit
			idx++;

		} else if (idx != 0) {
			// 바로 전 카드와 비교
			var card_before = shuffled_card_list[idx - 1];
			var card_one = shuffled_card_list[idx];
			var card_before_num = Number(card_before.substring(1, 2));
			var card_one_num = Number(card_one.substring(1, 2));

			var same_kind = card_one.substring(0, 1) == card_before.substring(0, 1) ? true : false;
			var five_card = card_one_num == 5 || (card_before_num == 5 && !same_kind) ? true : false;

			// 합 5
			if (same_kind) {
				var make_five = card_before_num + card_one_num == 5 ? true : false;
			}

			match = make_five || five_card ? true : false;

			app.io.to(two_room).emit("gift_card", card_one, idx, match, ask); // <<<<<<<<<<<<<<<< emit
			idx++;

			console.log(card_before, card_one, "  >>>  same_kind: ", same_kind, " / match: ", match);
		}

		var card_open_after_msg = [player_one, player_two];
		app.io.to(two_room).emit("card_open_after", card_open_after_msg); // <<<<<<<<<<<<<<<< emit

		// 카운트 체크해서 승리자를 리턴하면 게임 종료 시그널을 보낸다. MEMO: 0되면 서버에서 카드요청을 막을지 클라이언트에서 막을지 좀 더 생각
		var end_msg = countChecker(player_one, player_two);
		if (typeof end_msg !== 'boolean' ) {
			app.io.to(two_room).emit("the_end", end_msg);
		}
	})

	// 벨
	.on("bell", (match) => {
		console.log("★★★ bell: ", socket.id);

		bell_flag = true;

		turnChanger(player_one, player_two, socket.id, match);

		var bell_msg = [player_one, player_two];
		app.io.to(two_room).emit("bell", bell_msg); // <<<<<<<<<<<<<<<< emit
		app.io.to(two_room).emit("card_open_after", bell_msg); // <<<<<<<<<<<<<<<< emit

	})

	.on("reset", () => {
		resetGame();

		console.log("=== 카드 셔플 ===");
		console.log("=== SUFFLED CARD LIST", shuffled_card_list);

		app.io.emit("clean"); // <<<<<<<<<<<<<<<< emit
	})

	.on("disconnect", () => {
		idx = 0;
		if (socket.id == two_room) {
			console.log("방장이 방을 나갔음");
			app.io.emit("clean");
		}

		var end_msg = socket.id;
		app.io.to(two_room).emit("the_end", end_msg);
		resetGame();

		// 방정보에서 해당 소켓 삭제 TODO: 방에 혼자 남았을 때 다른 사람 들어오는거 
		var socket_index = room_info.socketList.indexOf(socket.id);
		room_info.socketList.splice(socket_index, 1);

		socket.leave(two_room);

		console.log("연결해제: " + socket.id);
		delete socket_list[socket.id];
	});
});

module.exports = app;

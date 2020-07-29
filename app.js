// 소켓 통신 =====================================================================

app.io.on('connection', (socket) => {
	socket_list[socket.id] = socket.id;
	// app.io.emit('hihi', socket_list);

	// 방에 안입장한 사람들은 관전할 수 있게 하면 되겠음
	// 카드 요청 > 전달 이벤트
	.on('show_me_the_card', )

	.on('count', (count) => {

		if (player_one == 0 || player_two == 0 || count == 0) {
			console.log("게임 끝. (player_one)" + player_one + " 대 (player_two)" + player_two);
		}
	})

	// 클라이언트로부터 전달받은 메시지를 종류별로 처리
	.on('client_message', (msg) => {
		console.log("=== client_message: ", msg);

		var msg_mode = msg.mode;

		switch (msg_mode){

			// 플레이어에게 닉네임 셋팅
			case "user_init" :
				console.log("★★★ user_init: ", socket.id);
				console.log("socket list" ,socket_list);

				if (player_one.socketId == socket.id){
					console.log("dddd");
					player_one.name = msg.userName;

				} else if (player_two.socketId === socket.id) {
					player_two.name = msg.userName;
				}

				console.log("1p:",player_one);
				console.log("2p:",player_two);
				
				break;

			// 벨 친 사람 정보로 카운트와 턴 처리
			case "bell" :
				console.log("★★★ bell: ", socket.id);
				
				if (player_one.life > 0 && player_two.life > 0) {

					if (player_one.socketId == socket.id){

						if(!msg.match) player_one.life--;
						player_one.turn = false;
						player_two.turn = true;

						info_msg.mode = 'info';
						info_msg.msg = "player1 남은 카드: " + player_one.life;

						app.io.emit('server_message', info_msg);    // <<<<<<<<<<<<<<<< emit

					} else if  (player_two.socketId === socket.id) {

						if(!msg.match) player_two.life--;
						player_two.turn = false;
						player_one.turn = true;

						info_msg.mode = 'info';
						info_msg.msg = "player2 남은 카드: " + player_two.life;

						app.io.emit('server_message', info_msg);    // <<<<<<<<<<<<<<<< emit

					}
					info_msg.mode = 'bell';
					// info_msg.msg = "벨 결과: (1p)" + player_one.life + " : (2p)" + player_two.life;
					info_msg.msg = [player_one, player_two];

					app.io.to(two_room).emit('server_message', info_msg);   // <<<<<<<<<<<<<<<< emit

				} else if (player_one.life == 0) {
					console.log("플레이어1 0 됐음");

					app.io.to(player_one.socketId).emit('lose');
					app.io.to(player_two.socketId).emit('win');


				} else if (player_two.life == 0) {
					console.log("플레이어2 0 됐음");

					app.io.to(player_one.socketId).emit('win');
					app.io.to(player_two.socketId).emit('lose');

				}


				break;

			case "msg" :

				break;

			case "abc" :

				break;

		}

	})

	// .on() 엔딩. 
	/* 승패 판별 방법.
		1p 2p 각각 28 부여해서 차감하는 방식으로, (제출시 -1, 종 잘못치면 -1)
		0에 먼저 도달하면 패배
		무승부도 생각해 봐야함.
	*/

	.on('reset', () => {
		shuffled_card_list = shuffled_card_list = card_list.shuffle();
		idx = 0;
		player_one.life = 28;
		player_two.life = 28;

		console.log("=== 카드 셔플 ===");
		console.log("=== SUFFLED CARD LIST", shuffled_card_list);

		app.io.emit('clean');  // <<<<<<<<<<<<<<<< emit

	})

	.on('disconnect', () => {
		// app.io.emit('clear', socket.id);  // <<<<<<<<<<<<<<<< emit

		if(socket.id == two_room){
			console.log("방장이 방을 나갔음");
			// 방이름 바꾸기

			two_room = '';
			app.io.emit('clean');	
		} 

		// 방정보에서 해당 소켓 삭제
		var socket_index = room_info.socketList.indexOf(socket.id);
		room_info.socketList.splice(socket_index, 1);

		socket.leave(two_room);
		
		console.log('연결해제: ' + socket.id);
		delete socket_list[socket.id];
	})

});

module.exports = app;

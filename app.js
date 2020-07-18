var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');
const router = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
// app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// 시작 전 bin/www 에서 포트를 본인 환경으로 바꾸세용 (현 8080)
// 준비물 ========================================================================

var socket_list = {};
var room_for_1p = '';
var idx = 0;

// 플레이어 생성자. [ roll: 1p인지 2p인지 / id: socket.id / life: 남은 카드 갯수 ]
class player {
  constructor(roll, id, life) {
    this.roll = roll;
    this.id = id;
    this.life = 28; // 1:1만 할거라 일단 28로 고정. 여러명은 나중에 생각
    this.info = () => {
      console.log("=======" + this.roll + " 플레이어 정보 =======");
      console.log(" socket.id: " + id);
      console.log(" 소지 카드: " + life);
      console.log("================================");
    };
  }
}

// 카드 생성
const alpha_list = ['a', 'b', 'c', 'd']; // 종류
const num_list = [1, 2, 3, 4, 5]; // 숫자
const card_list = []

for(var i=0; i<alpha_list.length; i++){
  for(var j=0; j<num_list.length; j++) {
    if(j == '1'){ var k = 2; } else { var k = j; } // 5 3 3 2 1 되기 위해
    while(k < 5){
      card_list.push(alpha_list[i] + num_list[j]);
      k++;
    }
  }
}
console.log('=== CARD LIST('+card_list.length+'개): ', card_list);

// 카드 섞기
Array.prototype.shuffle = function() {
  let length = this.length;
  while (length) {
    let index = Math.floor((length--) * Math.random());
    let temp = this[length];
    this[length] = this[index];
    this[index] = temp;
  }
  return this;
};

const shuffled_card_list = card_list.shuffle();
console.log('=== SHUFFLED CARD LIST: ', shuffled_card_list);


// 소켓 통신 =====================================================================

app.io = require('socket.io')();
app.io.on('connection', (socket) => {

  socket_list[socket.id] = socket.id; 


  // Messasge Zone
  var wait_msg = "1P 입장해서 2P 기다리는 중...";



  /* room 배치
    아래는 처음 입장자 소켓명으로 방을 생성해서 이후 접속자를 1P방에 입장시키는 방식임. 오직 두 사람 용.
    방이 여러개일 때, 중간에 빵꾸나면 그 다음 입장자는 빈 곳을 어떻게 찾아 들어가는지 등등 예외에 대한 생각이 좀 필요함.
    방 배열을 미리 만들어 놓고 들락날락할 때 자리 인덱스를 갱신하여 순차 배치하는 방법이 괜찮을 것 같음.
  */
  socket.on('go', () => { 
    if(room_for_1p == ''){
      room_for_1p = 'room_' + socket.id;

      socket.join(room_for_1p, () => {
        var player_one = new player('1p', socket.id, 28);
        var info_msg = socket.id + " 소켓이 방을 생성함. 방이름: " + room_for_1p;
        app.io.to(room_for_1p).emit('info', info_msg);
        app.io.to(room_for_1p).emit('info', wait_msg);
        // 클라에 사용자 정보 어떤거 보낼지 생각해야
        player_one.info();

        console.log(socket.id + " 소켓이 방을 생성함. 방이름: " + room_for_1p);
        console.log(wait_msg);
      });
    } else {
      socket.join(room_for_1p, () => { // 입장을 두 명으로 제한해야 함.
        var info_msg = socket.id + " 소켓이 방에 입장함. 방이름: " + room_for_1p;
        app.io.to(room_for_1p).emit('info', info_msg);
        var player_two = new player('2p', socket.id, 28);
        player_two.info();

        console.log(socket.id + " 소켓이 방에 입장함 방이름: " + room_for_1p);
      });

      var rooms = socket.adapter.rooms;
      app.io.to(room_for_1p).emit('방정보', JSON.stringify(rooms));

      console.log("방정보: " + JSON.stringify(rooms));
    }
  })


  // 종종 첫 번 째 접속에 소켓이 두 개 연결돼서 확인용임.
  console.log("socket_list length: " + Object.keys(socket_list).length); 
  console.log('socket_list : ' + JSON.stringify(socket_list));
  console.log('new socket : ' + socket.id);

  // 클라에서 총 접속 소켓 확인하기 용
  app.io.emit('hihi', socket_list);



  // 카드 요청 > 전달 이벤트
  socket.on('show_me_the_card', () => {
    var match = false;

    if(idx == 0) {// 첫 카드
      var card_one = shuffled_card_list[0];
      // 만약 최초가 5인데 상대가 종을 친 경우는?? 첫카드는 종 못치게 해야할거같은디...
      app.io.to(room_for_1p).emit('gift_card', card_one, idx, match);
      idx++;
    } else if(idx != 0 && idx < shuffled_card_list.length) {
      // 바로 전 카드와 비교
      var card_before = shuffled_card_list[idx-1];
      var card_one = shuffled_card_list[idx];

      var is_five = Number(card_one.substring(1,2)) + Number(card_before.substring(1,2));
  
      if(Number(card_one.substring(1,2)) == 5 || is_five == 5 ) match = true;
  
      app.io.to(room_for_1p).emit('gift_card', card_one, idx, match);
      idx++;
    } else {
      console.log("카드 다 줬음. 엔딩은 1P 2P 카운트 비교해서");
    }
  })

  .on('count', (count) => {
    
    if(player_one == 0 || player_two == 0 || count == 0) {
      console.log("게임 끝. (player_one)"+player_one+" 대 (player_two)"+player_two);
    }
  })

  .on('client_message', (msg) => {
    console.log("클라에게서 온 메시지: ", msg);

  })

  // .on() 엔딩. 
  /* 승패 판별 방법.
   1p 2p 각각 28 부여해서 차감하는 방식으로, (제출시 -1, 종 잘못치면 -1)
   0에 먼저 도달하면 패배
   무승부도 생각해 봐야함.
  */


  .on('disconnect', () => {
    app.io.emit('clear', socket.id);
    console.log('연결해제: ' + socket.id);
    delete socket_list[socket.id];
  })




});




module.exports = app;

import express from "express";
import socketIO from "socket.io";
import logger from "morgan";
import { makeCardDeck } from "./makeDeck";
import { handler } from "./handleEmit";
const app = express();
const PORT = 4000;

app.set("view engine", "pug");
app.set("views", `${__dirname}/views`);

app.use(logger("dev"));
app.use(express.static(`${__dirname}/static`));

app.get("/", (req, res) => res.render("index"));

const server = app.listen(PORT, () =>
  console.log(`Server is running... PORT:${PORT}`)
);

const io = socketIO.listen(server);

// 카드 생성

const { cardDeck, shuffledDeck } = makeCardDeck();
console.log(`기존 덱: ${cardDeck}`);
console.log(`셔플 덱: ${shuffledDeck}`);
// 준비물 ========================================================================

let socket_list = [];

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

// 소켓 통신 =====================================================================

io.on("connection", (socket) => {
  socket_list.push(socket.id);

  // Messasge Zone
  const wait_msg = "1P 입장해서 2P 기다리는 중...";

  /* room 배치
    아래는 처음 입장자 소켓명으로 방을 생성해서 이후 접속자를 1P방에 입장시키는 방식임. 오직 두 사람 용.
    방이 여러개일 때, 중간에 빵꾸나면 그 다음 입장자는 빈 곳을 어떻게 찾아 들어가는지 등등 예외에 대한 생각이 좀 필요함.
    방 배열을 미리 만들어 놓고 들락날락할 때 자리 인덱스를 갱신하여 순차 배치하는 방법이 괜찮을 것 같음.
  */
  socket.on("go", (socket) => {
    console.log(socket);
    handler.go(socket);
  });

  // 종종 첫 번 째 접속에 소켓이 두 개 연결돼서 확인용임.
  console.log("socket_list length: " + Object.keys(socket_list).length);
  console.log("socket_list : " + JSON.stringify(socket_list));
  console.log("new socket : " + socket.id);

  // 클라에서 총 접속 소켓 확인하기 용
  io.emit("hihi", socket_list);

  // 카드 요청 > 전달 이벤트
  socket.on("show_me_the_card", (socket) =>
    handler.show_me_the_card(socket, shuffledDeck)
  );

  socket.on("count", (socket) => handler.count(socket));
  socket.on("client_message", (socket) => handler.client_message(socket));

  // .on() 엔딩.
  /* 승패 판별 방법.
   1p 2p 각각 28 부여해서 차감하는 방식으로, (제출시 -1, 종 잘못치면 -1) / 0에 먼저 도달하면 패배 / 무승부도 생각해 봐야함.
  */
  socket.on("disconnect", () => {
    socket.emit("clear", (socket) => socket.id);
    console.log("연결해제: " + socket.id);
    delete socket_list[socket.id];
  });
});

// 플레이어 생성자. [ roll: 1p인지 2p인지 / id: socket.id / life: 남은 카드 갯수 ]
class player {
  constructor(roll, name, turn, socketId, life) {
    this.roll = roll;
    this.name = name;
    this.turn = turn;
    this.socketId = socketId;
    this.life = 28; // 1:1만 할거라 일단 28로 고정. 여러명은 나중에 생각
    this.info = () => {
      console.log("	======== " + roll + "player info =======");
      console.log("	name: " + name);
      console.log("	turn: " + turn);
      console.log("	socket.id: " + socketId);
      console.log("	소지 카드: " + life);
    };
  }
}

export default player;

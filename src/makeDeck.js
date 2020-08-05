const makeCardDeck = () => {
  // 카드 생성
  const alpha_list = ["A", "B", "C", "D"]; // 종류
  const num_list = [1, 2, 3, 4, 5]; // 숫자
  const card_list = [];

  for (let i = 0; i < alpha_list.length; i++) {
    for (let j = 0; j < num_list.length; j++) {
      let k;
      if (j == "1") {
        k = 2;
      } else {
        k = j;
      } // 5 3 3 2 1 되기 위해
      while (k < 5) {
        card_list.push(alpha_list[i] + num_list[j]);
        k++;
      }
    }
  }

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

  let shuffled_card_list = card_list.shuffle();
  return shuffled_card_list;
};

export default makeCardDeck;

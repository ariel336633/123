let video;
let handPose;
let hands = [];
let gameState = "loading"; // loading / playing / result
let playerGesture = -1; // -1: 未偵測, 0:石頭,1:剪刀,2:布
let aiGesture = -1;
let resultText = "";
let score = { win:0, lose:0, draw:0 };

// 初始化攝影機與模型
function preload() {
  handPose = ml5.handPose({ flipped: true });
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO, { flipped: true });
  video.size(640, 480);
  video.hide();
  handPose.detectStart(video, gotHands);
  document.getElementById("status").textContent = "請允許攝影機存取";
}

// 接收手部偵測結果
function gotHands(results) {
  hands = results;
  if (hands.length > 0 && gameState === "loading") {
    gameState = "playing";
    document.getElementById("status").textContent = "";
  }
}

function draw() {
  background(20);
  if (video.loadedmetadata) {
    image(video, 0, 0, width, height);
  }

  // 畫出手部骨架
  drawHandSkeleton();

  if (gameState === "playing") {
    playerGesture = detectGesture();
    if (playerGesture !== -1) {
      // 玩家出手後，AI 出拳並判斷結果
      aiGesture = floor(random(3));
      judgeResult();
      gameState = "result";
    }
  } else if (gameState === "result") {
    drawResultScreen();
    // 按空白鍵繼續下一輪
    if (keyIsPressed && key === ' ') {
      resetRound();
    }
  }

  drawScore();
}

// 畫手部骨架
function drawHandSkeleton() {
  for (let hand of hands) {
    let keypoints = hand.keypoints;
    // 畫關節點
    for (let kp of keypoints) {
      fill(0, 255, 0);
      noStroke();
      circle(kp.x, kp.y, 8);
    }
    // 畫連線
    stroke(0, 255, 0);
    strokeWeight(2);
    for (let i = 0; i < 5; i++) {
      let start = i * 4 + 1;
      line(keypoints[0].x, keypoints[0].y, keypoints[start].x, keypoints[start].y);
      for (let j = 0; j < 3; j++) {
        line(keypoints[start + j].x, keypoints[start + j].y, keypoints[start + j + 1].x, keypoints[start + j + 1].y);
      }
    }
  }
}

// 手勢辨識邏輯
function detectGesture() {
  if (hands.length === 0) return -1;
  let hand = hands[0];
  let kp = hand.keypoints;
  let fingerUp = [];

  // 大拇指
  fingerUp.push(kp[4].x < kp[3].x);
  // 食指、中指、無名指、小指
  for (let i of [8,12,16,20]) {
    fingerUp.push(kp[i].y < kp[i-2].y);
  }

  let count = fingerUp.filter(Boolean).length;
  if (count <= 1) return 0; // 石頭
  else if (count === 2) return 1; // 剪刀
  else return 2; // 布
}

// 判斷輸贏
function judgeResult() {
  let p = playerGesture;
  let a = aiGesture;
  if (p === a) {
    resultText = "平手！";
    score.draw++;
  } else if (
    (p === 0 && a === 1) ||
    (p === 1 && a === 2) ||
    (p === 2 && a === 0)
  ) {
    resultText = "你獲勝！";
    score.win++;
  } else {
    resultText = "你輸了";
    score.lose++;
  }
}

// 顯示結果畫面
function drawResultScreen() {
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);
  textAlign(CENTER, CENTER);
  textSize(32);
  fill(255);
  text("你出：" + getGestureName(playerGesture), width/2, height/2 - 60);
  text("AI 出：" + getGestureName(aiGesture), width/2, height/2);
  fill(255, 0, 0);
  text(resultText, width/2, height/2 + 60);
  textSize(16);
  fill(200);
  text("按空白鍵繼續下一輪", width/2, height - 30);
}

// 顯示分數
function drawScore() {
  textAlign(LEFT, TOP);
  textSize(16);
  fill(0, 255, 0);
  text("勝：" + score.win, 10, 10);
  fill(255, 0, 0);
  text("敗：" + score.lose, 80, 10);
  fill(255, 255, 0);
  text("平：" + score.draw, 150, 10);
}

// 手勢名稱轉換
function getGestureName(g) {
  switch(g) {
    case 0: return "石頭 ✊";
    case 1: return "剪刀 ✌️";
    case 2: return "布 🖐️";
    default: return "";
  }
}

// 重置一輪遊戲
function resetRound() {
  playerGesture = -1;
  aiGesture = -1;
  resultText = "";
  gameState = "playing";
}

let w = (c.width = window.innerWidth),
  h = (c.height = window.innerHeight),
  ctx = c.getContext("2d"),
  hw = w / 2;
(hh = h / 2),
  (opts = {
    strings: ["HAPPY", "BIRTHDAY!", "Hoang Duc"],
    charSize: 30,
    charSpacing: 35,
    lineHeight: 40,

    cx: w / 2,
    cy: h / 2,

    fireworkPrevPoints: 10,
    fireworkBaseLineWidth: 5,
    fireworkAddedLineWidth: 8,
    fireworkSpawnTime: 200,
    fireworkBaseReachTime: 30,
    fireworkAddedReachTime: 30,
    fireworkCircleBaseSize: 20,
    fireworkCircleAddedSize: 10,
    fireworkCircleBaseTime: 30,
    fireworkCircleAddedTime: 30,
    fireworkCircleFadeBaseTime: 10,
    fireworkCircleFadeAddedTime: 5,
    fireworkBaseShards: 5,
    fireworkAddedShards: 5,
    fireworkShardPrevPoints: 3,
    fireworkShardBaseVel: 4,
    fireworkShardAddedVel: 2,
    fireworkShardBaseSize: 3,
    fireworkShardAddedSize: 3,
    gravity: 0.1,
    upFlow: -0.1,
    letterContemplatingWaitTime: 360,
    balloonSpawnTime: 20,
    balloonBaseInflateTime: 10,
    balloonAddedInflateTime: 10,
    balloonBaseSize: 20,
    balloonAddedSize: 20,
    balloonBaseVel: 0.4,
    balloonAddedVel: 0.4,
    balloonBaseRadian: -(Math.PI / 2 - 0.5),
    balloonAddedRadian: -1,

    // new options for falling stars
    starCount: 100,
    starSpeedMin: 2,
    starSpeedMax: 5,
    starSizeMin: 1,
    starSizeMax: 3,
  }),
  (calc = {
    totalWidth:
      opts.charSpacing *
      Math.max(opts.strings[0].length, opts.strings[1].length),
  }),
  (Tau = Math.PI * 2),
  (TauQuarter = Tau / 4),
  (letters = []);

// Flag kiểm soát việc bắt đầu hiệu ứng
let started = false;

// Tạo nút Play ở giữa màn hình
const playBtn = document.createElement("button");
playBtn.textContent = "PLAY";
playBtn.style.position = "fixed";
playBtn.style.top = "50%";
playBtn.style.left = "50%";
playBtn.style.transform = "translate(-50%, -50%)";
playBtn.style.fontSize = "48px";
playBtn.style.padding = "20px 40px";
playBtn.style.cursor = "pointer";
playBtn.style.zIndex = "1000";
document.body.appendChild(playBtn);

// Tạo âm thanh, chỉnh sửa đường dẫn file âm thanh bên dưới
const audio = new Audio('see-you-again-218319.mp3'); // <-- Thay 'sounds/your-sound-file.mp3' thành đường dẫn file âm thanh của bạn
audio.volume = 0.3;
audio.loop = true;

// Mảng sao rơi (falling stars)
const stars = [];
function createStar() {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    size: opts.starSizeMin + Math.random() * (opts.starSizeMax - opts.starSizeMin),
    speed: opts.starSpeedMin + Math.random() * (opts.starSpeedMax - opts.starSpeedMin),
    length: 10 + Math.random() * 20,
  };
}
for (let i = 0; i < opts.starCount; i++) {
  stars.push(createStar());
}

// Hàm vẽ sao rơi
function drawStars() {
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  stars.forEach(star => {
    ctx.beginPath();
    ctx.moveTo(star.x, star.y);
    ctx.lineTo(star.x - star.length * 0.5, star.y + star.length);
    ctx.stroke();

    // Cập nhật vị trí sao rơi
    star.x -= star.speed * 0.5;
    star.y += star.speed;

    // Reset sao khi ra khỏi màn hình
    if (star.x < 0 || star.y > h) {
      star.x = Math.random() * w + w;
      star.y = Math.random() * -20;
      star.size = opts.starSizeMin + Math.random() * (opts.starSizeMax - opts.starSizeMin);
      star.speed = opts.starSpeedMin + Math.random() * (opts.starSpeedMax - opts.starSpeedMin);
      star.length = 10 + Math.random() * 20;
    }
  });
}

// Các phần còn lại của class Letter, Shard, generateBalloonPath ... giữ nguyên, không đổi

ctx.font = opts.charSize + "px Verdana";

function Letter(char, x, y) {
  this.char = char;
  this.x = x;
  this.y = y;

  this.dx = -ctx.measureText(char).width / 2;
  this.dy = +opts.charSize / 2;

  this.fireworkDy = this.y - hh;

  var hue = (x / calc.totalWidth) * 360;

  this.color = "hsl(hue,80%,50%)".replace("hue", hue);
  this.lightAlphaColor = "hsla(hue,80%,light%,alp)".replace("hue", hue);
  this.lightColor = "hsl(hue,80%,light%)".replace("hue", hue);
  this.alphaColor = "hsla(hue,80%,50%,alp)".replace("hue", hue);

  this.reset();
}
Letter.prototype.reset = function () {
  this.phase = "firework";
  this.tick = 0;
  this.spawned = false;
  this.spawningTime = (opts.fireworkSpawnTime * Math.random()) | 0;
  this.reachTime =
    (opts.fireworkBaseReachTime + opts.fireworkAddedReachTime * Math.random()) |
    0;
  this.lineWidth =
    opts.fireworkBaseLineWidth + opts.fireworkAddedLineWidth * Math.random();
  this.prevPoints = [[0, hh, 0]];
};
Letter.prototype.step = function () {
  if (this.phase === "firework") {
    if (!this.spawned) {
      ++this.tick;
      if (this.tick >= this.spawningTime) {
        this.tick = 0;
        this.spawned = true;
      }
    } else {
      ++this.tick;

      var linearProportion = this.tick / this.reachTime,
        armonicProportion = Math.sin(linearProportion * TauQuarter),
        x = linearProportion * this.x,
        y = hh + armonicProportion * this.fireworkDy;

      if (this.prevPoints.length > opts.fireworkPrevPoints)
        this.prevPoints.shift();

      this.prevPoints.push([x, y, linearProportion * this.lineWidth]);

      var lineWidthProportion = 1 / (this.prevPoints.length - 1);

      for (var i = 1; i < this.prevPoints.length; ++i) {
        var point = this.prevPoints[i],
          point2 = this.prevPoints[i - 1];

        ctx.strokeStyle = this.alphaColor.replace(
          "alp",
          i / this.prevPoints.length
        );
        ctx.lineWidth = point[2] * lineWidthProportion * i;
        ctx.beginPath();
        ctx.moveTo(point[0], point[1]);
        ctx.lineTo(point2[0], point2[1]);
        ctx.stroke();
      }

      if (this.tick >= this.reachTime) {
        this.phase = "contemplate";

        this.circleFinalSize =
          opts.fireworkCircleBaseSize +
          opts.fireworkCircleAddedSize * Math.random();
        this.circleCompleteTime =
          (opts.fireworkCircleBaseTime +
            opts.fireworkCircleAddedTime * Math.random()) |
          0;
        this.circleCreating = true;
        this.circleFading = false;

        this.circleFadeTime =
          (opts.fireworkCircleFadeBaseTime +
            opts.fireworkCircleFadeAddedTime * Math.random()) |
          0;
        this.tick = 0;
        this.tick2 = 0;

        this.shards = [];

        var shardCount =
            (opts.fireworkBaseShards +
              opts.fireworkAddedShards * Math.random()) |
            0,
          angle = Tau / shardCount,
          cos = Math.cos(angle),
          sin = Math.sin(angle),
          x = 1,
          y = 0;

        for (var i = 0; i < shardCount; ++i) {
          var x1 = x;
          x = x * cos - y * sin;
          y = y * cos + x1 * sin;

          this.shards.push(new Shard(this.x, this.y, x, y, this.alphaColor));
        }
      }
    }
  } else if (this.phase === "contemplate") {
    ++this.tick;

    if (this.circleCreating) {
      ++this.tick2;
      var proportion = this.tick2 / this.circleCompleteTime,
        armonic = -Math.cos(proportion * Math.PI) / 2 + 0.5;

      ctx.beginPath();
      ctx.fillStyle = this.lightAlphaColor
        .replace("light", 50 + 50 * proportion)
        .replace("alp", proportion);
      ctx.beginPath();
      ctx.arc(this.x, this.y, armonic * this.circleFinalSize, 0, Tau);
      ctx.fill();

      if (this.tick2 > this.circleCompleteTime) {
        this.tick2 = 0;
        this.circleCreating = false;
        this.circleFading = true;
      }
    } else if (this.circleFading) {
      ctx.fillStyle = this.lightColor.replace("light", 70);
      ctx.fillText(this.char, this.x + this.dx, this.y + this.dy);

      ++this.tick2;
      var proportion = this.tick2 / this.circleFadeTime,
        armonic = 1 - (-Math.cos(proportion * Math.PI) / 2 + 0.5);

      ctx.beginPath();
      ctx.fillStyle = this.lightAlphaColor
        .replace("light", 50 + 50 * proportion)
        .replace("alp", armonic);
      ctx.beginPath();
      ctx.arc(this.x, this.y, (1 - armonic) * this.circleFinalSize, 0, Tau);
      ctx.fill();

      if (this.tick2 > this.circleFadeTime) {
        this.tick2 = 0;
        this.circleFading = false;
      }
    } else {
      ctx.fillStyle = this.lightColor.replace("light", 70);
      ctx.fillText(this.char, this.x + this.dx, this.y + this.dy);

      if (this.tick > opts.letterContemplatingWaitTime) {
        this.phase = "done";

        for (var i = 0; i < this.shards.length; ++i) {
          this.shards[i].tick = i * 4;
        }
      }
    }
  } else {
    var allDone = true;

    for (var i = 0; i < this.shards.length; ++i) {
      this.shards[i].step();

      if (!this.shards[i].done) allDone = false;
    }

    if (allDone) {
      this.phase = "done2";
      this.tick = 0;
    }
  }
};
Letter.prototype.done = false;

function Shard(x, y, vx, vy, color) {
  this.x = x;
  this.y = y;
  this.vx = vx;
  this.vy = vy;
  this.color = color;

  this.tick = 0;
  this.prevPoints = [[x, y, 1]];
  this.size =
    opts.fireworkShardBaseSize + opts.fireworkShardAddedSize * Math.random();
  this.vel =
    opts.fireworkShardBaseVel + opts.fireworkShardAddedVel * Math.random();
  this.done = false;
}
Shard.prototype.step = function () {
  if (this.done) return;

  ++this.tick;

  this.vy += opts.gravity;
  this.vx *= 0.98;
  this.vy *= 0.98;

  this.x += this.vx * this.vel;
  this.y += this.vy * this.vel;

  this.prevPoints.push([this.x, this.y, this.size]);

  if (this.prevPoints.length > opts.fireworkShardPrevPoints)
    this.prevPoints.shift();

  var lineWidthProportion = 1 / (this.prevPoints.length - 1);

  for (var i = 1; i < this.prevPoints.length; ++i) {
    var point = this.prevPoints[i],
      point2 = this.prevPoints[i - 1];

    ctx.strokeStyle = this.color.replace("alp", i / this.prevPoints.length);
    ctx.lineWidth = point[2] * lineWidthProportion * i;
    ctx.beginPath();
    ctx.moveTo(point[0], point[1]);
    ctx.lineTo(point2[0], point2[1]);
    ctx.stroke();
  }

  if (this.y > h) {
    this.done = true;
  }
};

function generateBalloonPath(radius, inflation) {
  var inflation = inflation || 0;

  var cp1 = [0, radius / 2],
    cp2 = [radius, radius * 1.5],
    cp3 = [radius, radius * 2 + inflation],
    cp4 = [0, radius * 2 + inflation],
    cp5 = [radius / 2, radius * 1.5],
    cp6 = [0, radius];

  var path = new Path2D();

  path.moveTo(0, 0);
  path.bezierCurveTo(cp1[0], cp1[1], cp2[0], cp2[1], cp3[0], cp3[1]);
  path.bezierCurveTo(cp4[0], cp4[1], cp5[0], cp5[1], cp6[0], cp6[1]);
  path.closePath();

  return path;
}

var balloons = [],
  balloonTick = 0;

function Balloon() {
  this.spawned = false;
  this.tick = 0;

  this.inflationTime =
    (opts.balloonBaseInflateTime + opts.balloonAddedInflateTime * Math.random()) |
    0;
  this.radius = opts.balloonBaseSize + opts.balloonAddedSize * Math.random();
  this.vel = opts.balloonBaseVel + opts.balloonAddedVel * Math.random();
  this.radian = opts.balloonBaseRadian + opts.balloonAddedRadian * Math.random();

  this.x = Math.random() * w;
  this.y = h + this.radius * 2;

  this.path = generateBalloonPath(this.radius);

  this.color = "hsl(hue,90%,65%)".replace("hue", Math.random() * 360);
  this.strokeColor = "hsl(hue,90%,55%)".replace("hue", Math.random() * 360);
}
Balloon.prototype.step = function () {
  if (!this.spawned) {
    ++this.tick;
    if (this.tick >= this.inflationTime) {
      this.tick = 0;
      this.spawned = true;
    }
  } else {
    this.x += Math.cos(this.radian) * this.vel;
    this.y += Math.sin(this.radian) * this.vel;

    if (this.y + this.radius < 0) {
      this.spawned = false;
      this.tick = 0;
      this.x = Math.random() * w;
      this.y = h + this.radius * 2;
    }
  }

  ctx.fillStyle = this.color;
  ctx.strokeStyle = this.strokeColor;
  ctx.lineWidth = 2;

  ctx.save();
  ctx.translate(this.x, this.y);
  ctx.fill(this.path);
  ctx.stroke(this.path);
  ctx.restore();
};

function initLetters() {
  letters = [];
  for (var i = 0; i < opts.strings.length; ++i) {
    var str = opts.strings[i],
      y = opts.cy + i * opts.lineHeight - opts.lineHeight;
    for (var j = 0; j < str.length; ++j) {
      letters.push(
        new Letter(
          str[j],
          j * opts.charSpacing -
            (str.length * opts.charSpacing) / 2 +
            opts.charSpacing / 2,
          y
        )
      );
    }
  }
}
initLetters();

function spawnBalloons() {
  balloons.push(new Balloon());
}

function animate() {
  if (!started) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "white";
    ctx.font = "40px Verdana";
    ctx.textAlign = "center";
    ctx.fillText("Click PLAY to start the celebration!", hw, hh);
    requestAnimationFrame(animate);
    return;
  }

  ctx.fillStyle = "#000011";
  ctx.fillRect(0, 0, w, h);

  // Vẽ hiệu ứng sao rơi
  drawStars();

  // Vẽ các bóng bay
  balloonTick++;
  if (balloonTick > opts.balloonSpawnTime) {
    balloonTick = 0;
    spawnBalloons();
  }
  balloons.forEach(b => b.step());

  // Vẽ từng chữ cái pháo hoa
  letters.forEach(l => l.step());

  requestAnimationFrame(animate);
}

animate();

playBtn.addEventListener("click", () => {
  started = true;
  audio.play().catch(() => {}); // Bắt lỗi nếu trình duyệt chặn tự động phát âm thanh
  playBtn.style.display = "none";
});

// Xử lý khi resize màn hình
window.addEventListener("resize", () => {
  w = c.width = window.innerWidth;
  h = c.height = window.innerHeight;
  opts.cx = w / 2;
  opts.cy = h / 2;
  hw = w / 2;
  hh = h / 2;
  calc.totalWidth =
    opts.charSpacing *
    Math.max(opts.strings[0].length, opts.strings[1].length);
  initLetters();
});

const applyScalling = function (parent, children) {
    children.style.transform = 'scale(1, 1)';
    children.style.transformOrigin = '0 0 '
    let { width: cw, height: ch } = children.getBoundingClientRect();
    let { width: ww, height: wh } = parent.getBoundingClientRect();
    let scaleAmtX = Math.max(ww / cw, wh / ch);
    let scaleAmtY = scaleAmtX;
    children.style.transform = `scale(${scaleAmtX}, ${scaleAmtY})`;
}

let sketch = (s) => {
    // let started = false;
    // let paused = false;
    let engine = Matter.Engine.create();
    let world = engine.world;
    class Grid {
        constructor(initRowNo, initColNo, w, h) {
            this.rowNo = initRowNo;
            this.colNo = initColNo;
            this.w = w;
            this.h = h;
            let cellW = s.floor(this.w / this.rowNo);
            let cellH = s.floor(this.h / this.colNo);
            this.cells = [];
            for (let col = 0; col < this.rowNo; col++) {
                let r = [];
                for (let row = 0; row < this.colNo; row++) {
                    let centerX = 10 + (cellW / 2 + col * cellW);
                    let centerY = 10 + (cellH / 2 + row * cellH);
                    r.push(new Cell(centerX, centerY, cellW, cellH, row, col));
                }
                this.cells.push(r);
            }
        }

        init() {
            this.cells.forEach(r => {
                r.forEach(c => {
                    c.init();
                })
            })
        }

        render() {
            this.cells.forEach(r => {
                r.forEach(c => {
                    c.render();
                })
            })
        }
    }

    class Cell {
        constructor(x, y, w, h, row, col) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.rowNo = row;
            this.colNo = col;
            this.mat = [[0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]];
            this.lines = [];
        }

        init() {
            for (let i = 0; i < 4; i++) {
                let x = s.random([0, 1, 2]);
                let y = s.random([0, 1, 2]);
                while (this.mat[x][y] !== 0) {
                    x = s.random([0, 1, 2]);
                    y = s.random([0, 1, 2]);
                }
                this.mat[x][y] = 1;
            }
            let checked = [];
            let lines = [];
            for (let x = 0; x < 3; x++) {
                for (let y = 0; y < 3; y++) {
                    if (this.mat[x][y] === 1) {
                        let has1 = false;
                        // 1
                        if (this.mat[x - 1] !== undefined) {
                            if (this.mat[x - 1][y] === 1 && !checked.includes((x - 1) + "," + y)) {
                                lines.push(x + "," + y + "-" + (x - 1) + "," + (y));
                                has1 = true;
                            }
                        }
                        if (this.mat[x + 1] !== undefined) {
                            if (this.mat[x + 1][y] === 1 && !checked.includes((x + 1) + "," + y)) {
                                lines.push(x + "," + y + "-" + (x + 1) + "," + (y));
                                has1 = true;
                            }
                        }
                        if (this.mat[x][y - 1] !== undefined && this.mat[x][y - 1] === 1 && !checked.includes(x + "," + (y - 1))) {
                            lines.push(x + "," + y + "-" + (x) + "," + (y - 1));
                            has1 = true;
                        }
                        if (this.mat[x][y + 1] !== undefined && this.mat[x][y + 1] === 1 && !checked.includes(x + "," + (y + 1))) {
                            lines.push(x + "," + y + "-" + (x) + "," + (y + 1));
                            has1 = true;
                        }
                        if (has1) continue;
                        // sqrt2
                        if (this.mat[x - 1] !== undefined) {
                            if (this.mat[x - 1][y - 1] !== undefined && this.mat[x - 1][y - 1] === 1 && !checked.includes((x - 1) + "," + (y - 1))) {
                                let cA = lines.includes(x + "," + y + "-" + (x) + "," + (y - 1)) || lines.includes(x + "," + (y - 1) + "-" + (x) + "," + (y));
                                let cB = lines.includes(x + "," + y + "-" + (x - 1) + "," + (y)) || lines.includes((x - 1) + "," + (y) + "-" + (x) + "," + (y));
                                if (!cA || !cB) {
                                    lines.push(x + "," + y + "-" + (x - 1) + "," + (y - 1));
                                }
                            }
                            if (this.mat[x - 1][y + 1] !== undefined && this.mat[x - 1][y + 1] === 1 && !checked.includes((x - 1) + "," + (y + 1))) {
                                let cA = lines.includes(x + "," + y + "-" + (x) + "," + (y + 1)) || lines.includes(x + "," + (y + 1) + "-" + (x) + "," + (y));
                                let cB = lines.includes(x + "," + y + "-" + (x - 1) + "," + (y)) || lines.includes((x - 1) + "," + (y) + "-" + (x) + "," + (y));
                                if (!cA || !cB) {
                                    lines.push(x + "," + y + "-" + (x - 1) + "," + (y + 1));
                                }
                            }
                        }
                        if (this.mat[x + 1] !== undefined) {
                            if (this.mat[x + 1][y - 1] !== undefined && this.mat[x + 1][y - 1] === 1 && !checked.includes((x + 1) + "," + (y - 1))) {
                                let cA = lines.includes(x + "," + y + "-" + (x) + "," + (y - 1)) || lines.includes(x + "," + (y - 1) + "-" + (x) + "," + (y));
                                let cB = lines.includes(x + "," + y + "-" + (x + 1) + "," + (y)) || lines.includes((x + 1) + "," + (y) + "-" + (x) + "," + (y));
                                if (!cA || !cB) {
                                    lines.push(x + "," + y + "-" + (x + 1) + "," + (y - 1));
                                }
                            }
                            if (this.mat[x + 1][y + 1] !== undefined && this.mat[x + 1][y + 1] === 1 && !checked.includes((x + 1) + "," + (y + 1))) {
                                let cA = lines.includes(x + "," + y + "-" + (x) + "," + (y + 1)) || lines.includes(x + "," + (y + 1) + "-" + (x) + "," + (y));
                                let cB = lines.includes(x + "," + y + "-" + (x + 1) + "," + (y)) || lines.includes((x + 1) + "," + (y) + "-" + (x) + "," + (y));
                                if (!cA || !cB) {
                                    lines.push(x + "," + y + "-" + (x + 1) + "," + (y + 1));
                                }
                            }
                        }
                    }
                }
            }
            lines.forEach(lstr => {
                let pstrs = lstr.split('-');
                let p1str = pstrs[0].split(',');
                let p2str = pstrs[1].split(',');
                let p1 = { x: p1str[0], y: p1str[1] };
                let p2 = { x: p2str[0], y: p2str[1] };
                let p1A = {
                    x: this.x + (this.w / 2 - (p1.x * this.w / 2)),
                    y: this.y + (this.h / 2 - (p1.y * this.h / 2)),
                };
                let p2A = {
                    x: this.x + (this.w / 2 - (p2.x * this.w / 2)),
                    y: this.y + (this.h / 2 - (p2.y * this.h / 2)),
                };
                this.lines.push({ p1: p1A, p2: p2A });
                let d = s.dist(p1A.x, p1A.y, p2A.x, p2A.y);
                let centerX = (p2A.x + p1A.x) / 2;
                let centerY = (p2A.y + p1A.y) / 2;
                let v = s.createVector(p2A.x - p1A.x, p2A.y - p1A.y);
                let rigidBody = Matter.Bodies.rectangle(centerX, centerY, d, 5, { isStatic: true, restitution: 1, friction: 0, angle: v.heading() });
                Matter.World.add(world, rigidBody);
            });
        }

        render() {
            this.lines.forEach(o => {
                let d = s.dist(o.p1.x, o.p1.y, o.p2.x, o.p2.y);
                let centerX = (o.p2.x + o.p1.x) / 2;
                let centerY = (o.p2.y + o.p1.y) / 2;
                let v = s.createVector(o.p2.x - o.p1.x, o.p2.y - o.p1.y);
                s.push();
                s.noStroke();
                s.fill(50);
                s.translate(centerX, centerY);
                s.rotate(v.heading());
                s.rect(0, 0, d, 5);
                s.pop();
            });
        }
    }
    class Item {
        constructor(x, y) {
            this.rigidBody = undefined;
            this.c = s.random(70, 150);
            let dice = s.random([0, 3, 4, 5, 6, 7, 8]);
            this.r = s.random(5, 10);
            if (dice === 0) {
                this.rigidBody = Matter.Bodies.circle(x, y, this.r, { restitution: 1, friction: 0 });
            } else {
                this.rigidBody = Matter.Bodies.polygon(x, y, dice, this.r, { restitution: 1, friction: 0 });
            }
            this.sides = dice;
            Matter.World.add(world, this.rigidBody);
            this.lastPos = { x: undefined, y: undefined };
        }

        render() {
            s.push();
            s.strokeWeight(0.8);
            s.stroke(s.map(this.r, 5, 10, 50, 150));
            s.point(this.rigidBody.position.x, this.rigidBody.position.y);
            if (this.lastPos.x === undefined) {

            } else {
                let d = s.dist(this.lastPos.x, this.lastPos.y, this.rigidBody.position.x, this.rigidBody.position.y);
                s.stroke(s.map(this.r, 5, 10, 25, 50) + s.map(d, 0, 100, 25, 100), 16);
                s.line(this.lastPos.x, this.lastPos.y, this.rigidBody.position.x, this.rigidBody.position.y);
            }
            // s.noStroke();
            // s.fill(this.c);
            // s.translate(this.rigidBody.position.x, this.rigidBody.position.y);
            // s.rotate(this.rigidBody.angle);
            // if(this.sides ===0){
            //   s.ellipse(0,0, 2*this.r);
            // } else {
            //   polygon(0,0, this.r, this.sides);
            // }
            s.pop();
            this.lastPos.x = this.rigidBody.position.x;
            this.lastPos.y = this.rigidBody.position.y;
        }
    }
    let grid;
    const itemNo = 50;
    let newWaveTime = 1;
    let items = [];
    let counter = 1;
    let div = window.document.getElementsByClassName("subC")[0];
    let canvas;
    let displaceTime = 0;
    s.setup = function () {
        canvas = s.createCanvas(600, 600);
        s.background(250);
        s.rectMode(s.CENTER);
        //s.frameRate(2);
        grid = new Grid(10, 10, s.width - 20, s.height - 20);
        grid.init();
        //grid.render();
        for (let i = 0; i < itemNo; i++) {
            items.push(new Item(s.random(20, s.width - 20), -50));
        }
        s.frameRate(30);
        applyScalling(div, canvas.canvas);
    }

    s.draw = function () {
        //s.background(250,150);
        //grid.render();
        items.forEach(it => it.render());
        Matter.Engine.update(engine);
        if (newWaveTime < 8) {
            if (counter % (30 * 15) === 0) {
                newWave();
                newWaveTime++;
            }
        } else {
            if (counter % (30 * 15) === 0) {
                s.noLoop();
                setTimeout(reset, 5000)
            }
        }
        counter++;
    }

    // s.mouseClicked = function () {
    //     if (!(s.mouseX > 0 && s.mouseX < s.width && s.mouseY > 0 && s.mouseY < s.height)) return;
    //     console.log("c")
    //     reset();
    //     return false;
    // }

    const reset = () => {
        console.log("r");
        s.background(250);
        Matter.World.clear(world);
        //world = engine.world;
        grid = new Grid(10, 10, s.width - 20, s.height - 20);
        grid.init();
        engine.gravity.x = 1;
        engine.gravity.y = 0;
        newWave();
        newWaveTime = 1;
        counter = 1;
        s.loop();
    }

    const newWave = function () {
        Matter.World.clear(world, true);
        items.length = 0;

        if (engine.gravity.y === 1) {
            engine.gravity.y = 0;
            engine.gravity.x = -1;
            for (let i = 0; i < itemNo; i++) {
                items.push(new Item(s.width + 50, s.random(s.height)));
            }
        } else if (engine.gravity.x == -1) {
            engine.gravity.y = -1;
            engine.gravity.x = 0;
            for (let i = 0; i < itemNo; i++) {
                items.push(new Item(s.random(s.width), s.height + 50));
            }
        } else if (engine.gravity.y === -1) {
            engine.gravity.y = 0;
            engine.gravity.x = 1;
            for (let i = 0; i < itemNo; i++) {
                items.push(new Item(-50, s.random(s.height)));
            }
        } else {
            engine.gravity.y = 1;
            engine.gravity.x = 0;
            for (let i = 0; i < itemNo; i++) {
                items.push(new Item(s.random(s.width), -50));
            }
        }
    }

    s.windowResized = function () {
        applyScalling(div, canvas.canvas);
    }
}
const applyScalling = function (parent, children) {
    children.style.transform = 'scale(1, 1)';
    children.style.transformOrigin = '0 0'
    let { width: cw, height: ch } = children.getBoundingClientRect();
    let { width: ww, height: wh } = parent.getBoundingClientRect();
    let scaleAmtX = Math.max(ww / cw, wh / ch);
    let scaleAmtY = scaleAmtX;
    children.style.transform = `scale(${scaleAmtX}, ${scaleAmtY})`;
}

let sketch = function (s) {
    const ctc = [0.1];
    const rule = [3, 4, 3, 4, 0.1];
    let div = window.document.getElementsByClassName("sketchcontainer")[0];
    let canvas;

    let cols = 320, rows = 200;
    let grid = (() => {
        let tem = new Array(cols);
        for (let i = 0; i < tem.length; i++) {
            tem[i] = new Array(rows);
        }
        return tem;
    })()
    let size = 5;

    s.setup = function () {
        canvas = s.createCanvas(1600, 1000);
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[i].length; j++) {
                let coin = s.random(1);
                if (coin < rule[4]) {
                    grid[i][j] = 1;
                } else {
                    grid[i][j] = 0;
                }
            }
        }
        applyScalling(div, canvas.canvas);
        s.frameRate(15);
    }

    s.draw = function () {
        s.background(255, 8);
        s.noFill();
        s.strokeWeight(0.5);
        let alive = []
        grid.forEach((col, x) => {
            col.forEach((c, y) => {
                if (c) {
                    alive.push({ x: x * size + size / 2, y: y * size + size / 2 });
                }
            });
        });
        if (alive.length >= parseFloat(ctc[0]) * cols * rows) {
            reset();
        }
        let aliveDelaunay = d3.Delaunay.from(alive.map(o => [o.x, o.y]));
        let aliveVor = aliveDelaunay.voronoi([-1, -1, s.width + 1, s.height + 1]);
        for (let i = 0, n = aliveDelaunay.halfedges.length; i < n; i++) {
            let j = aliveDelaunay.halfedges[i];
            if (i < j) continue;
            let vi = Math.floor(i / 3) * 2;
            let vj = Math.floor(j / 3) * 2;
            let d = s.dist(aliveVor.circumcenters[vi], aliveVor.circumcenters[vi + 1], aliveVor.circumcenters[vj], aliveVor.circumcenters[vj + 1]);
            s.stroke(s.map(d, 10, 400, 50, 150), s.map(d, 10, 400, 200, 100));
            s.line(aliveVor.circumcenters[vi], aliveVor.circumcenters[vi + 1], aliveVor.circumcenters[vj], aliveVor.circumcenters[vj + 1]);
        }
        updateGrid();
        //s.noLoop();

    }

    const updateGrid = function () {
        let next = (() => {
            let tem = new Array(cols);
            for (let i = 0; i < tem.length; i++) {
                tem[i] = new Array(rows);
            }
            return tem;
        })()
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                let pre = grid[i][j];
                let sum = count(grid, i, j);
                if (pre) sum--;
                let nxt;
                if (pre) {
                    if (sum >= rule[0] && sum <= rule[1]) {
                        nxt = 1;
                    } else {
                        nxt = 0;
                    }
                } else {
                    if (sum >= rule[2] && sum <= rule[3]) {
                        nxt = 1;
                    } else {
                        nxt = 0;
                    }
                }
                next[i][j] = nxt;
            }
        }
        grid = next;
    }

    const count = function (grid, i, j) {
        let sum = 0;
        for (let k = -1; k < 2; k++) {
            for (let l = -1; l < 2; l++) {
                let x = (i + k + cols) % cols;
                let y = (j + l + rows) % rows;
                sum += grid[x][y];
            }
        }
        return sum;
    }

    s.windowResized = function () {
        applyScalling(div, canvas.canvas);
    }

    // s.mouseClicked = function () {
    //     if (s.mouseX > s.width || s.mouseX < 0 || s.mouseY > s.height || s.mouseY < 0) return;
    //     s.loop();
    //     reset();
    // }

    reset = () => {
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[i].length; j++) {
                let coin = s.random(1);
                if (coin < rule[4]) {
                    grid[i][j] = 1;
                } else {
                    grid[i][j] = 0;
                }
            }
        }
    }
}
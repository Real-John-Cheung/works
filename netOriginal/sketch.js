const applyScalling = function (parent, children) {
    children.style.transform = 'scale(1, 1)';
    children.style.transformOrigin = '0 0 '
    let { width: cw, height: ch } = children.getBoundingClientRect();
    let { width: ww, height: wh } = parent.getBoundingClientRect();
    let scaleAmtX = Math.max(ww / cw, wh / ch);
    let scaleAmtY = scaleAmtX;
    children.style.transform = `scale(${scaleAmtX}, ${scaleAmtY})`;
}

const fromAngle = function (ang, mag) {
    return ({ x: Math.cos(ang) * mag, y: Math.sin(ang) * mag })
}

let sketch = s => {

    const pointNo = 20;
    const holeNo = 4;
    const pointMovesStep = 0.5;
    const maxLv = 3;
    const changeFadeFrames = 30;

    class Polygon {
        constructor(depth, maxDepth, noOfSides) {
            this.depth = depth;
            this.maxDepth = maxDepth;
            this.sideNo = noOfSides;
            this.outerVertices = new Array(this.sideNo);
            for (let i = 0; i < this.outerVertices.length; ++i) {
                this.outerVertices[i] = s.createVector(0, 0);
            }
            this.outerEdgesMiddle = new Array(this.sideNo);
            for (let i = 0; i < this.outerEdgesMiddle.length; ++i) {
                this.outerEdgesMiddle[i] = s.createVector(0, 0);
            }
            this.controlPoints = new Array(this.sideNo);
            for (let i = 0; i < this.controlPoints.length; ++i) {
                this.controlPoints[i] = s.createVector(0, 0);
            }
            this.innerCenter = s.createVector(0, 0);
            if (this.depth < this.maxDepth) {
                this.children = new Array(this.sideNo + 1);
                for (let i = 0; i < this.sideNo; ++i) {
                    this.children[i] = new Polygon(this.depth + 1, this.maxDepth, 5);
                }
                this.children[this.sideNo] = new Polygon(this.depth + 1, this.maxDepth, this.sideNo);
            }
        }

        update(outerVs, para) {
            this.outerVertices = outerVs;
            //outer edges middle with offset
            for (let i = 0; i < this.outerVertices.length; i++) {
                let j = (i + 1 + this.outerVertices.length) % this.outerVertices.length;
                let ratio = 0.5 + (0.5 - s.noise(para)) * 0.25;
                this.setInBetweenPoint(this.outerEdgesMiddle[i], this.outerVertices[i], this.outerVertices[j], ratio);
                para += 0.1;
            }
            // inner center (average center)
            this.setInnerCenter(this.innerCenter, this.outerVertices);
            // controlPoints
            for (let i = 0; i < this.controlPoints.length; i++) {
                let ratio = 1 - s.noise(para) * 0.9;
                this.setInBetweenPoint(this.controlPoints[i], this.outerEdgesMiddle[i], this.innerCenter, ratio);
            }
            if (this.depth < this.maxDepth) {
                para++;
                this.children[this.sideNo].update(this.controlPoints, para);
                para += 0.1;
                for (let i = 0; i < this.sideNo; i++) {
                    let j = (i - 1 + this.sideNo) % this.sideNo;
                    let group = [this.outerVertices[i], this.outerEdgesMiddle[i], this.controlPoints[i], this.controlPoints[j], this.outerEdgesMiddle[j]];
                    this.children[i].update(group, para);
                    para += 0.1;
                }
            }
        }

        display() {
            //this.render();
            this.renderChildren();
        }

        render() {
            s.beginShape();
            for (const p of this.outerVertices) {
                s.vertex(p.x, p.y);
            }
            s.endShape(s.CLOSE);
        }

        renderChildren() {
            s.beginShape();
            for (const p of this.controlPoints) {
                s.vertex(p.x, p.y);
            }
            s.endShape(s.CLOSE);
            for (let i = 0; i < this.sideNo; i++) {
                let j = (i - 1 + this.sideNo) % this.sideNo
                s.beginShape();
                s.vertex(this.outerVertices[i].x, this.outerVertices[i].y);
                s.vertex(this.outerEdgesMiddle[i].x, this.outerEdgesMiddle[i].y);
                s.vertex(this.controlPoints[i].x, this.controlPoints[i].y);
                s.vertex(this.controlPoints[j].x, this.controlPoints[j].y);
                s.vertex(this.outerEdgesMiddle[j].x, this.outerEdgesMiddle[j].y);
                s.endShape(s.CLOSE);
            }
            if (this.depth < this.maxDepth) {
                for (const child of this.children) {
                    child.renderChildren();
                }
            }
        }

        setInBetweenPoint(target, sourceA, sourceB, ratio) {
            try {
                target.set(sourceA.x * ratio + sourceB.x * (1 - ratio), sourceA.y * ratio + sourceB.y * (1 - ratio));
            } catch (e) {
                console.error(e, target, ratio);
            }
        }

        setInnerCenter(target, vertices) {
            let sumX = 0, sumY = 0;
            for (const p of vertices) {
                sumX += p.x;
                sumY += p.y;
            }
            target.set(sumX / vertices.length, sumY / vertices.length);
        }
    }

    let playing = false;
    let noiseFPointsMove;
    let points = new Array(pointNo);
    let pointsRef = new Array(pointNo);
    let voronoi;
    let polygons = new Array(holeNo);
    let selectedIndex = new Array(holeNo);
    let noiseFPolygons = new Array(holeNo);
    let changeAfterNextNFrame = s.floor(s.random(10, 15)) * 30;
    let lastchangeFrame = 2;
    let toChange = undefined, newIdx = undefined, toChangeIdx = undefined, lastChanged;
    s.setup = function () {
        s.createCanvas(1080, 720);
        s.background(0);
        for (let i = 0; i < points.length; i++) {
            let x = s.random(s.width);
            let y = s.random(s.height)
            points[i] = [x, y];
            pointsRef[i] = [x, y];
        }
        for (let i = 0; i < holeNo; ++i) {
            selectedIndex[i] = undefined;
            polygons[i] = undefined;
            noiseFPolygons[i] = s.random(100, 300);
        }
        voronoi = d3.Delaunay.from(points).voronoi([0, 0, s.width, s.height]);
        noiseFPointsMove = s.random(100);
        s.noFill();
        s.stroke(250);
        s.strokeWeight(0.5);
        s.noLoop();
        s.frameRate(30);
    }

    s.draw = function () {
        s.background(0);
        if (!selectedIndex[0]) {
            // init
            for (let i = 0; i < selectedIndex.length; ++i) {
                let randomIdx = s.floor(s.random(points.length))
                while (selectedIndex.includes(randomIdx)) {
                    randomIdx = s.floor(s.random(points.length))
                }
                selectedIndex[i] = randomIdx;
            }
            //console.log("initSI", selectedIndex);
        }
        //draw voronoi graph
        for (let i = 0; i < points.length; i++) {
            const cell = voronoi.cellPolygon(i);
            s.push();
            // if (selectedIndex.includes(i)){
            //   s.stroke(0,255,0);
            //   s.strokeWeight(5);
            // }
            s.strokeWeight(2);
            s.beginShape();
            //let midx = 0, midy = 0;
            for (const point of cell) {
                s.vertex(point[0], point[1]);
                // midx += point[0];
                //midy += point[1];
            }
            s.endShape();
            s.pop();
            // s.push();
            // s.fill(255);
            // s.text(i, midx/cell.length, midy/cell.length)
            // s.pop();
        }

        for (let i = 0; i < selectedIndex.length; ++i) {
            const idx = selectedIndex[i];
            let cell = voronoi.cellPolygon(idx);
            if (!cell) continue;
            // s.push();
            // s.stroke(255,0,0);
            // s.strokeWeight(2);
            // s.beginShape();
            // for (const point of cell) {
            //   s.vertex(point[0],point[1]);
            // }
            // s.endShape();
            // s.pop();
            let sides = cell.length - 1;
            cell.pop();
            cell = cell.map(p => { return s.createVector(p[0], p[1]) });
            polygons[i] = new Polygon(0, maxLv, sides);
            polygons[i].update(cell, noiseFPolygons[i]);
            s.push();
            if (toChangeIdx && toChangeIdx === idx) {
                s.stroke(250, s.map(changeAfterNextNFrame - (s.frameCount - lastchangeFrame), changeFadeFrames, 0, 255, 0));
            } else if (newIdx && newIdx === idx) {
                s.stroke(250, s.map(s.frameCount - lastchangeFrame, 0, changeFadeFrames, 0, 255));
            }
            polygons[i].display();
            s.pop();
        }
        if (!toChange && s.frameCount - lastchangeFrame > changeAfterNextNFrame - changeFadeFrames) {
            //decide which cell to be changed
            toChange = s.floor(s.random(selectedIndex.length));
            while (toChange === lastChanged) {
                toChange = s.floor(s.random(selectedIndex.length));
            }
            toChangeIdx = selectedIndex[toChange];
            lastChanged = toChange;
            //console.log("tc",toChangeIdx)
        } else if (s.frameCount - lastchangeFrame > changeAfterNextNFrame) {
            //pick new cell
            let neighbors = [...voronoi.neighbors(toChangeIdx)];
            newIdx = s.random(neighbors);
            let tries = 1;
            while (selectedIndex.includes(newIdx) && tries < 10) {
                newIdx = s.random(neighbors);
            }
            if (tries >= 10) {
                newIdx = s.floor(s.random(points.length));
                while (selectedIndex.includes(newIdx)) {
                    newIdx = s.floor(s.random(points.length));
                }
            }
            selectedIndex[toChange] = newIdx;
            toChange = undefined;
            toChangeIdx = undefined;
            lastchangeFrame = s.frameCount;
            changeAfterNextNFrame = s.floor(s.random(10, 15)) * 30;
            //console.log("new",newIdx)
        } else if (s.frameCount - lastchangeFrame > changeFadeFrames && newIdx) {
            //for fading in
            newIdx = undefined;
        }

        //points move
        for (let i = 0; i < points.length; i++) {
            let p = points[i];
            p[0] = s.constrain(p[0] + (0.5 - s.noise(noiseFPointsMove + i)) * pointMovesStep, pointsRef[i][0] - 15, pointsRef[i][0] + 15);
            p[1] = s.constrain(p[1] + (0.5 - s.noise(noiseFPointsMove + 100 + i)) * pointMovesStep, pointsRef[i][1] - 15, pointsRef[i][1] + 15);
        }
        //update voronoi
        voronoi = d3.Delaunay.from(points).voronoi([0, 0, s.width, s.height]);
        //update noise
        noiseFPointsMove += 0.01;
        for (let i = 0; i < noiseFPolygons.length; ++i) {
            noiseFPolygons[i] += 0.01;
        }
    }

    s.mouseClicked = function () {
        if (s.mouseX < 0 || s.mouseX > s.width || s.mouseY < 0 || s.mouseY > s.height) return;
        if (!playing) {
            s.loop();
            playing = true;
        } else {
            s.noLoop();
            playing = false;
        }
    }

    s.windowResized = function () {
        applyScalling(div, canvas.canvas);
    }
}
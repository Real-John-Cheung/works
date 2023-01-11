const applyScalling = function (parent, children) {
    children.style.transform = 'scale(1, 1)';
    children.style.transformOrigin = '0 0 '
    let { width: cw, height: ch } = children.getBoundingClientRect();
    let { width: ww, height: wh } = parent.getBoundingClientRect();
    let scaleAmtX = Math.max(ww / cw, wh / ch);
    let scaleAmtY = scaleAmtX;
    children.style.transform = `scale(${scaleAmtX}, ${scaleAmtY})`;
}

const findPointOnLine = function (from, to, ratioFF) {
    return [(from[0] * ratioFF + to[0] * (1 - ratioFF)), (from[1] * ratioFF + to[1] * (1 - ratioFF))];
}

const scaleLine = function (of, ot, ratio) {
    return [findPointOnLine(ot, of, (1 - ratio) / 2), findPointOnLine(of, ot, (1 - ratio) / 2)];
}

const getRandomInt = function (min, max) {
    return min + Math.floor(Math.random() * (max - min));
}

const psedoProjectToLine = function (points, lineFrom, lineTo) {
    let res = [];
    points.forEach((p, i) => {
        res.push(findPointOnLine(lineTo, lineFrom, (i + 1) / points.length));
    });
    return res;
}

let sketch = s => {
    const drawingThings = function (cps, inn, cor, inc) {
        s.beginShape();
        cps.forEach(p => s.vertex(p[0], p[1]));
        s.endShape(s.CLOSE);
        s.beginShape();
        inn.forEach(p => s.vertex(p[0], p[1]));
        s.endShape(s.CLOSE);
        s.push();
        s.fill(0);
        s.noStroke();
        s.beginShape();
        inc.forEach(p => s.vertex(p[0], p[1]));
        s.endShape(s.CLOSE);
        s.pop();

        inn.forEach((p, i) => {
            //s.line(p[0], p[1], inn[i][0], inn[i][1]);
            for (let k = 0; k < 3; k++) {
                s.line(p[0], p[1], cor[((i - (k + 1)) + (inn.length)) % inn.length][0], cor[((i - (k + 1)) + (inn.length)) % inn.length][1]);
                s.line(p[0], p[1], cor[((i + (k + 1)) + (inn.length)) % inn.length][0], cor[((i + (k + 1)) + (inn.length)) % inn.length][1]);
            }
            // let im1 = i - 1 < 0 ? inn.length - 1 : i - 1;
            // let ip1 = i + 1 > inn.length - 1 ? 0 : i + 1;
            // let im2 = i - 2 < 0 ? (i - 2 < -1 ? inn.length - 2 : inn.length - 1) : i - 2;
            // let ip2 = i + 2 > inn.length - 1 ? (i + 2 > inn.length ? 1 : 0) : i + 2;
            // let im3 = ((i - 3) + (inn.length)) % inn.length;
            // let ip3 = ((i + 3) + (inn.length)) % inn.length;
            // s.line(p[0], p[1], cor[im1][0], cor[im1][1]);
            // s.line(p[0], p[1], cor[ip1][0], cor[ip1][1]);
            // s.line(p[0], p[1], cor[im2][0], cor[im2][1]);
            // s.line(p[0], p[1], cor[ip2][0], cor[ip2][1]);
        });
    }

    class DMControl {
        constructor(target) {
            this.noiseP = Math.random() * 144000;
            this.noiseStep = 0.003;
            this.step = 0.0005;
            this.lastValue;
            this.x = 0;
            this.direction;

            //
            this.counter = Math.floor(Math.random() * 36000);
            this.target = target;
            this.threads = [];
            for (let i = 0; i < 4; i++) {
                this.threads.push({
                    lastAction: 0,
                    tillNextAction: Math.floor(Math.random() * 90 + 60),
                });
            }
        }

        setTarget(target) {
            this.target = target;
        }

        update(init) {
            if (init) return this.get(this.counter).value;
            this.counter++;
            let ob = this.get(this.counter)
            let dire = ob.direction;
            let tv = ob.value * 64;
            for (let index = 0; index < this.threads.length; index++) {
                const t = this.threads[index];
                if (this.counter - t.lastAction < t.tillNextAction) continue;
                let absu = Math.abs(tv - this.target.cellNo)
                if (tv > this.target.cellNo) {
                    if (Math.random() > s.map(absu, 0, 64, 0.2, 0.01)) {
                        this.target.divide();
                    } else {
                        this.target.merge();
                    }
                } else {
                    if (Math.random() > s.map(absu, 0, 64, 0.2, 0.01)) {
                        this.target.merge();
                    } else {
                        this.target.divide();
                    }
                }
                t.lastAction = this.counter;
                t.tillNextAction = Math.floor(Math.random() * s.map(absu, 0, 64, 90, 5) + Math.random() * s.map(absu, 0, 64, 60, 5));
            }
        }

        get(inp) {
            this.noiseP += this.noiseStep;
            let toreturn;
            toreturn = (Math.sin(inp * (this.step * (1 - (1 - s.noise(this.noiseP)) * 0.4))) + 1) / 2;
            this.direction = toreturn - this.lastValue
            this.lastValue = toreturn;
            return { value: toreturn, direction: this.direction }; // 0 - 1 
        }

        debug() {
            s.push();
            s.stroke(0);
            s.strokeWeight(5);
            let xx = 0;
            let yy = s.height - s.map(this.lastValue, 0, 1, 0, s.height);
            let x2 = 10;
            let y2 = s.height - s.map(this.target.cellNo, 0, 64, 0, s.height);
            s.point(xx, yy);
            s.point(x2, y2);
            s.pop();
            //console.log(xx,yy);
        }

    }

    class KdTree {
        constructor(rr) {
            this.root = new CellNode(rr, getRandomInt(0, 2) % 2 === 0, null, 0);
            this.leaves = [this.root];
            this.cellNo = 1;
        }

        merge(leave) {
            if (!leave) {
                leave = this.leaves[Math.floor(Math.random() * this.leaves.length)];
            }
            if (!leave) return;
            let parent = leave.parent;
            if (!parent) return;
            if (!parent.leftOrTop.isLeave || !parent.rightOrBottom.isLeave) return;
            this.leaves.splice(this.leaves.findIndex(n => n === parent.leftOrTop), 1);
            this.leaves.splice(this.leaves.findIndex(n => n === parent.rightOrBottom), 1);

            //transition
            parent.acting = 1;
            parent.actionFrameCount = 0;
            parent.displayedCps = [];
            let pidxsLT, pidxsRB, trFrom, trTo;
            if (!parent.splitDirection) {
                trFrom = [6, 7];
                trTo = [22, 23];
                pidxsLT = [6, 5, 4, 3, 2, 1, 0, 31, 30, 29, 28, 27, 26, 25, 24, 23];
                pidxsRB = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
            } else {
                trFrom = [14, 15];
                trTo = [31, 30];
                pidxsLT = [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
                pidxsRB = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 31];
            }
            parent.displayedCps[0] = parent.leftOrTop.cps;
            parent.displayedCps[1] = parent.rightOrBottom.cps;
            parent.displayedInnerBound[0] = parent.leftOrTop.innerBound;
            parent.displayedInnerBound[1] = parent.rightOrBottom.innerBound;
            parent.displayedCore[0] = parent.leftOrTop.core;
            parent.displayedCore[1] = parent.rightOrBottom.core;
            parent.displayedInnerCore[0] = parent.leftOrTop.innerCore;
            parent.displayedInnerCore[1] = parent.rightOrBottom.innerCore;
            parent.merge = {
                pidxs: [pidxsLT, pidxsRB],
                tr: [trFrom, trTo],
            }

            //wrap
            delete parent.leftOrTop;
            delete parent.rightOrBottom;
            parent.leftOrTop = null;
            parent.rightOrBottom = null;
            parent.isLeave = true;
            parent.r1 = -1;
            parent.r2 = -1;
            this.leaves.push(parent);
            this.cellNo--;
        }

        divide() {
            const maxLevel = 6;
            let canUse = this.leaves.filter(node => node.level < maxLevel);
            if (!canUse.length) return;
            let chosen = canUse[Math.floor(Math.random() * canUse.length)];
            let newLeaves = chosen.divide(Math.random() * 144000, Math.random() * 144000);
            this.leaves.splice(this.leaves.findIndex(n => n == chosen), 1);
            this.leaves = this.leaves.concat(newLeaves)
            this.cellNo++;
        }

        render(db) {
            this.leaves.forEach(l => l.display(db));
            //TODO: add paras
        }

        update() {
            this.root.updateChildren();
            this.root.update(this.root.corners);
        }
    }
    class CellNode {
        constructor(corners, lastSplitDirection, parent, level, pos) {
            // pos: 0 leftOrTop, 1 rightOrBottom
            if (pos !== undefined) this.pos = pos;
            if (parent === null) this.corners = corners;
            this.merge = {};
            this.leftTop = corners[0];
            this.rightTop = corners[1];
            this.rightBottom = corners[2];
            this.leftBottom = corners[3];
            this.splitDirection = !lastSplitDirection;
            // splitDirection: 0 horizontal, 1 vertical
            this.parent = parent;
            this.leftOrTop = null;
            this.rightOrBottom = null;
            this.level = level;
            this.isLeave = true;

            //for display
            this.r1 = -1;
            this.r2 = -1;
            this.top = this.leftTop[1];
            this.left = this.leftTop[0];
            this.right = this.rightBottom[0];
            this.bottom = this.rightBottom[1];
            this.innerPerlinCounter = Math.random() * 144000;
            this.innerTimerForCore = getRandomInt(0, 500);
            this.center = [(this.right + this.left) / 2, (this.top + this.bottom) / 2];
            this.const1F = 0.2;
            this.const1 = this.const1F + (s.noise(this.innerPerlinCounter + 400) - 0.5) * 0.4;
            //
            //this.const1F = 0.5;
            //this.const1 = this.const1F + (s.noise(this.innerPerlinCounter + 400) - 0.5);
            this.const2F = 0.5;
            this.const2 = this.const2F + (s.noise(this.innerPerlinCounter + 800) - 0.5);
            this.cps = [this.leftTop, this.rightTop, this.rightBottom, this.leftBottom];
            for (let i = 0; i < 3; i++) {
                let newCps = [];
                for (let j = 0; j < this.cps.length; j++) {
                    let rl = this.const1;
                    let rr = this.const1;
                    let pa = this.cps[j];
                    let pb = j === 0 ? this.cps[this.cps.length - 1] : this.cps[j - 1];
                    newCps.push(findPointOnLine(pa, pb, rl));
                    newCps.push(findPointOnLine(pb, pa, rr));
                }
                this.cps = newCps;
            }
            this.innerBound = [];
            let closeToA = this.innerTimerForCore % this.cps.length;
            this.cps.forEach((p, i) => {
                let d = Math.min(Math.abs(i - closeToA), Math.min(closeToA + this.cps.length - i, i + this.cps.length - closeToA));
                this.innerBound.push(findPointOnLine(this.center, p, this.const2 * s.map(d, 0, Math.ceil(this.cps.length / 2), 0.1, 1)));
            });
            let closeToB = (closeToA + Math.ceil(this.innerBound.length / 2)) % this.innerBound.length;
            this.core = [];
            this.innerBound.forEach((p, i) => {
                let d = Math.min(Math.abs(i - closeToB), Math.min(closeToB + this.innerBound.length - i, i + this.innerBound.length - closeToB));
                this.core.push(findPointOnLine(p, this.center, s.map(d, 0, Math.ceil(this.innerBound.length / 2), 1, 0.4)));
            });
            this.innerCore = [];
            this.core.forEach((p, i) => {
                let d = Math.min(Math.abs(i - closeToA), Math.min(closeToA + this.core.length - i, i + this.core.length - closeToA));
                this.innerCore.push(findPointOnLine(p, this.center, s.map(d, 0, Math.ceil(this.core.length / 2), 0.6, 0.4)));
            });

            this.displayedCps = [];
            this.displayedInnerBound = [];
            this.displayedCore = [];
            this.displayedInnerCore = [];
            this.acting = -1;
            this.actionFrameCount = -1;
            if (parent) {
                //divide animation
                let pidxs, dvFrom, dvTo;
                if (lastSplitDirection && this.pos) {
                    pidxs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
                    dvFrom = this.leftBottom;
                    dvTo = this.leftTop
                } else if (!lastSplitDirection && this.pos) {
                    pidxs = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
                    dvFrom = this.leftTop;
                    dvTo = this.rightTop;
                } else if (lastSplitDirection && !this.pos) {
                    pidxs = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29];
                    dvFrom = this.rightTop;
                    dvTo = this.rightBottom;
                } else {
                    pidxs = [24, 25, 26, 27, 28, 29, 30, 31, 0, 1, 2, 3, 4, 5];
                    dvFrom = this.rightBottom;
                    dvTo = this.leftBottom
                }
                let pstarts = psedoProjectToLine(pidxs, dvFrom, dvTo);
                for (let i = 0; i < this.cps.length; i++) {
                    if (pidxs.includes(i)) {
                        let ii = pidxs.indexOf(i);
                        this.displayedCps[i] = pstarts[ii];
                        this.displayedInnerBound[i] = pstarts[ii];
                        this.displayedCore[i] = pstarts[ii];
                        this.displayedInnerCore[i] = pstarts[ii]
                    } else {
                        this.displayedCps[i] = this.cps[i];
                        this.displayedInnerBound[i] = this.innerBound[i];
                        this.displayedCore[i] = this.core[i];
                        this.displayedInnerCore[i] = this.innerCore[i];
                    }
                }
                this.acting = 0;
                this.actionFrameCount = 0;
            }
        }

        divide(r1, r2) {
            // r1 r2 ratio from left/top
            let rr1 = 0.1 + s.noise(r1) * 0.8;
            let rr2 = 0.1 + s.noise(r2) * 0.8;
            if (this.splitDirection) {
                //vertical
                let p1 = findPointOnLine(this.leftTop, this.rightTop, rr1);
                let p2 = findPointOnLine(this.leftBottom, this.rightBottom, rr2)
                this.leftOrTop = new CellNode([this.leftTop, p1, p2, this.leftBottom], this.splitDirection, this, this.level + 1, false);
                this.rightOrBottom = new CellNode([p1, this.rightTop, this.rightBottom, p2], this.splitDirection, this, this.level + 1, true);
            } else {
                let p1 = findPointOnLine(this.leftTop, this.leftBottom, rr1);
                let p2 = findPointOnLine(this.rightTop, this.rightBottom, rr2);
                this.leftOrTop = new CellNode([this.leftTop, this.rightTop, p2, p1], this.splitDirection, this, this.level + 1, false);
                this.rightOrBottom = new CellNode([p1, p2, this.rightBottom, this.leftBottom], this.splitDirection, this, this.level + 1, true);
            }
            this.isLeave = false;
            this.r1 = r1;
            this.r2 = r2;
            return [this.leftOrTop, this.rightOrBottom];
        }

        updateChildren() {
            if (!this.leftOrTop || !this.rightOrBottom) return;
            const step = 0.001;
            this.r1 += step;
            this.r2 += step;
            let rr1 = s.noise(this.r1);
            let rr2 = s.noise(this.r2);
            if (this.splitDirection) {
                //vertical
                let p1 = findPointOnLine(this.leftTop, this.rightTop, rr1);
                let p2 = findPointOnLine(this.leftBottom, this.rightBottom, rr2)
                this.leftOrTop.update([this.leftTop, p1, p2, this.leftBottom]);
                this.rightOrBottom.update([p1, this.rightTop, this.rightBottom, p2]);
            } else {
                let p1 = findPointOnLine(this.leftTop, this.leftBottom, rr1);
                let p2 = findPointOnLine(this.rightTop, this.rightBottom, rr2);
                this.leftOrTop.update([this.leftTop, this.rightTop, p2, p1]);
                this.rightOrBottom.update([p1, p2, this.rightBottom, this.leftBottom]);
            }
            if (!this.leftOrTop.isLeave) this.leftOrTop.updateChildren();
            if (!this.rightOrBottom.isLeave) this.rightOrBottom.updateChildren();
        }

        update(corners) {
            this.innerTimerForCore += 0.1;
            this.innerPerlinCounter += 0.003;
            this.const1 = this.const1F + (s.noise(this.innerPerlinCounter + 400) - 0.5) * 0.4;
            //this.const1 = this.const1F + (s.noise(this.innerPerlinCounter + 400) - 0.5);
            this.const2 = this.const2F + (s.noise(this.innerPerlinCounter + 800) - 0.5);
            this.leftTop = corners[0];
            this.rightTop = corners[1];
            this.rightBottom = corners[2];
            this.leftBottom = corners[3];
            this.top = this.leftTop[1];
            this.left = this.leftTop[0];
            this.right = this.rightBottom[0];
            this.bottom = this.rightBottom[1];
            this.center = [(this.right + this.left) / 2, (this.top + this.bottom) / 2];
            let co2 = this.const2 + (s.noise(this.innerPerlinCounter)) * 0.06
            this.cps = [this.leftTop, this.rightTop, this.rightBottom, this.leftBottom];
            for (let i = 0; i < 3; i++) {
                let newCps = [];
                for (let j = 0; j < this.cps.length; j++) {
                    let rl = this.const1 //+ Math.random() * 0.1;
                    let rr = this.const1 //+ Math.random() * 0.1;
                    let pa = this.cps[j];
                    let pb = j === 0 ? this.cps[this.cps.length - 1] : this.cps[j - 1];
                    newCps.push(findPointOnLine(pa, pb, rl));
                    newCps.push(findPointOnLine(pb, pa, rr));
                }
                this.cps = newCps;
            }
            this.innerBound = [];
            let closeToA = this.innerTimerForCore % this.cps.length;
            this.cps.forEach((p, i) => {
                let d = Math.min(Math.abs(i - closeToA), Math.min(closeToA + this.cps.length - i, i + this.cps.length - closeToA));
                this.innerBound.push(findPointOnLine(this.center, p, this.const2 * s.map(d, 0, Math.ceil(this.cps.length / 2), 0.5, 1)));
            });
            let closeToB = (closeToA + Math.ceil(this.innerBound.length / 2)) % this.innerBound.length;
            this.core = [];
            this.innerBound.forEach((p, i) => {
                let d = Math.min(Math.abs(i - closeToB), Math.min(closeToB + this.innerBound.length - i, i + this.innerBound.length - closeToB));
                this.core.push(findPointOnLine(p, this.center, s.map(d, 0, Math.ceil(this.innerBound.length / 2), 1, 0.4)));
            });
            this.innerCore = [];
            this.core.forEach((p, i) => {
                let d = Math.min(Math.abs(i - closeToA), Math.min(closeToA + this.core.length - i, i + this.core.length - closeToA));
                this.innerCore.push(findPointOnLine(p, this.center, s.map(d, 0, Math.ceil(this.core.length / 2), 0.6, 0.4)));
            });

            if (this.acting > -1) {
                this.actionFrameCount++;
                if (this.acting === 0) {
                    for (let i = 0; i < this.cps.length; i++) {
                        this.displayedCps[i] = findPointOnLine(this.displayedCps[i], this.cps[i], s.map(this.actionFrameCount, 0, 120, 0.92, 0.1));
                        this.displayedInnerBound[i] = findPointOnLine(this.displayedInnerBound[i], this.innerBound[i], s.map(this.actionFrameCount, 0, 120, 0.92, 0.1));
                        this.displayedCore[i] = findPointOnLine(this.displayedCore[i], this.core[i], s.map(this.actionFrameCount, 0, 120, 0.92, 0.1));
                        this.displayedInnerCore[i] = findPointOnLine(this.displayedInnerCore[i], this.innerCore[i], s.map(this.actionFrameCount, 0, 120, 0.92, 0.1));
                    }
                    if (this.actionFrameCount > 120) {
                        this.acting = -1;
                        this.actionFrameCount = -1;
                        this.displayedCps = [];
                        this.displayedInnerBound = [];
                        this.displayedCore = [];
                        this.displayedInnerCore = [];
                    }
                } else {
                    let tr = this.merge.tr;
                    let trp = [findPointOnLine(this.cps[tr[0][0]], this.cps[tr[0][1]], 0.5), findPointOnLine(this.cps[tr[1][0]], this.cps[tr[1][1]], 0.5)]
                    let tri = [findPointOnLine(this.innerBound[tr[0][0]], this.innerBound[tr[0][1]], 0.5), findPointOnLine(this.innerBound[tr[1][0]], this.innerBound[tr[1][1]], 0.5)]
                    let trc = [findPointOnLine(this.core[tr[0][0]], this.core[tr[0][1]], 0.5), findPointOnLine(this.core[tr[1][0]], this.core[tr[1][1]], 0.5)]
                    let tric = [findPointOnLine(this.innerCore[tr[0][0]], this.innerCore[tr[0][1]], 0.5), findPointOnLine(this.innerCore[tr[1][0]], this.innerCore[tr[1][1]], 0.5)]
                    let pidxs = this.merge.pidxs;
                    for (let i = 0; i < this.cps.length; i++) {
                        if (pidxs[0].includes(i)) {
                            if (pidxs[0].indexOf(i) < pidxs[0].length / 2) {
                                this.displayedCps[0][i] = findPointOnLine(this.displayedCps[0][i], trp[0], s.map(this.actionFrameCount, 0, 120, 0.8, 0.1));
                                this.displayedInnerBound[0][i] = findPointOnLine(this.displayedInnerBound[0][i], tri[0], s.map(this.actionFrameCount, 0, 120, 0.92, 0.1));
                                this.displayedCore[0][i] = findPointOnLine(this.displayedCore[0][i], trc[0], s.map(this.actionFrameCount, 0, 120, 0.92, 0.1));
                                this.displayedInnerCore[0][i] = findPointOnLine(this.displayedInnerCore[0][i], tric[0], s.map(this.actionFrameCount, 0, 120, 0.92, 0.1));
                            } else {
                                this.displayedCps[0][i] = findPointOnLine(this.displayedCps[0][i], trp[1], s.map(this.actionFrameCount, 0, 120, 0.8, 0.1));
                                this.displayedInnerBound[0][i] = findPointOnLine(this.displayedInnerBound[0][i], tri[1], s.map(this.actionFrameCount, 0, 120, 0.92, 0.1));
                                this.displayedCore[0][i] = findPointOnLine(this.displayedCore[0][i], trc[1], s.map(this.actionFrameCount, 0, 120, 0.92, 0.1));
                                this.displayedInnerCore[0][i] = findPointOnLine(this.displayedInnerCore[0][i], tric[1], s.map(this.actionFrameCount, 0, 120, 0.92, 0.1));
                            }
                        } else {
                            this.displayedCps[0][i] = findPointOnLine(this.displayedCps[0][i], this.cps[i], s.map(this.actionFrameCount, 0, 120, 0.8, 0.1));
                            this.displayedInnerBound[0][i] = findPointOnLine(this.displayedInnerBound[0][i], this.innerBound[i], s.map(this.actionFrameCount, 0, 120, 0.92, 0.1));
                            this.displayedCore[0][i] = findPointOnLine(this.displayedCore[0][i], this.core[i], s.map(this.actionFrameCount, 0, 120, 0.92, 0.1));
                            this.displayedInnerCore[0][i] = findPointOnLine(this.displayedInnerCore[0][i], this.innerCore[i], s.map(this.actionFrameCount, 0, 120, 0.92, 0.1));
                        }

                        if (pidxs[1].includes(i)) {
                            if (pidxs[1].indexOf(i) < pidxs[1].length / 2) {
                                this.displayedCps[1][i] = findPointOnLine(this.displayedCps[1][i], trp[0], s.map(this.actionFrameCount, 0, 120, 0.8, 0.1));
                                this.displayedInnerBound[1][i] = findPointOnLine(this.displayedInnerBound[1][i], tri[0], s.map(this.actionFrameCount, 0, 120, 0.92, 0.1));
                                this.displayedCore[1][i] = findPointOnLine(this.displayedCore[1][i], trc[0], s.map(this.actionFrameCount, 0, 120, 0.92, 0.1));
                                this.displayedInnerCore[1][i] = findPointOnLine(this.displayedInnerCore[1][i], tric[0], s.map(this.actionFrameCount, 0, 120, 0.92, 0.1));
                            } else {
                                this.displayedCps[1][i] = findPointOnLine(this.displayedCps[1][i], trp[1], s.map(this.actionFrameCount, 0, 120, 0.8, 0.1));
                                this.displayedInnerBound[1][i] = findPointOnLine(this.displayedInnerBound[1][i], tri[1], s.map(this.actionFrameCount, 0, 120, 0.92, 0.1));
                                this.displayedCore[1][i] = findPointOnLine(this.displayedCore[1][i], trc[1], s.map(this.actionFrameCount, 0, 120, 0.92, 0.1));
                                this.displayedInnerCore[1][i] = findPointOnLine(this.displayedInnerCore[1][i], tric[1], s.map(this.actionFrameCount, 0, 120, 0.92, 0.1));
                            }
                        } else {
                            this.displayedCps[1][i] = findPointOnLine(this.displayedCps[1][i], this.cps[i], s.map(this.actionFrameCount, 0, 120, 0.8, 0.1));
                            this.displayedInnerBound[1][i] = findPointOnLine(this.displayedInnerBound[1][i], this.innerBound[i], s.map(this.actionFrameCount, 0, 120, 0.92, 0.1));
                            this.displayedCore[1][i] = findPointOnLine(this.displayedCore[1][i], this.core[i], s.map(this.actionFrameCount, 0, 120, 0.92, 0.1));
                            this.displayedInnerCore[1][i] = findPointOnLine(this.displayedInnerCore[1][i], this.innerCore[i], s.map(this.actionFrameCount, 0, 120, 0.92, 0.1));
                        }

                    }
                    if (this.actionFrameCount > 30) {
                        this.acting = -1;
                        this.actionFrameCount = -1;
                        this.displayedCps = [];
                        this.displayedInnerBound = [];
                        this.displayedCore = [];
                        this.displayedInnerCore = [];
                        this.merge = {};
                    }
                }
            }
        }

        display(db) {
            this._drawInside();
            if (db) this._debug();
        }

        _debug() {
            this._drawOutBound();
            s.push();
            s.fill(0);
            s.noStroke();
            if (this.acting) {
                if (this.displayedCps.length === 2) {
                    this.displayedCps.forEach(g => {
                        g.forEach((p, i) => {
                            s.text(i, p[0], p[1])
                        })
                    })
                    this.displayedInnerBound.forEach(g => {
                        g.forEach((p, i) => {
                            s.text(i, p[0], p[1])
                        })
                    })
                } else {
                    this.displayedCps.forEach((p, i) => {
                        s.text(i, p[0], p[1])
                    });
                    this.displayedInnerBound.forEach((p, i) => {
                        s.text(i, p[0], p[1])
                    });
                }
            } else {
                this.cps.forEach((p, i) => {
                    s.text(i, p[0], p[1])
                });
                this.innerBound.forEach((p, i) => {
                    s.text(i, p[0], p[1])
                });
            }
            s.pop();
        }

        _drawOutBound() {
            s.push();
            //s.fill(this.level * 20)
            s.quad(this.leftTop[0], this.leftTop[1], this.rightTop[0], this.rightTop[1], this.rightBottom[0], this.rightBottom[1], this.leftBottom[0], this.leftBottom[1]);
            s.pop();
        }

        _drawInside(para = []) {
            if (this.acting === 0) {
                drawingThings(this.displayedCps, this.displayedInnerBound, this.displayedCore, this.displayedInnerCore)
            } else if (this.acting === 1) {
                if (this.displayedCps.length === 2) {
                    drawingThings(this.displayedCps[0], this.displayedInnerBound[0], this.displayedCore[0], this.displayedInnerCore[0]);
                    drawingThings(this.displayedCps[1], this.displayedInnerBound[1], this.displayedCore[1], this.displayedInnerCore[1]);
                } else {
                    drawingThings(this.displayedCps, this.displayedInnerBound, this.displayedCore, this.displayedInnerCore)
                }
            } else {
                drawingThings(this.cps, this.innerBound, this.core, this.innerCore);
            }
            //end db
        }
    }

    let canvas;
    const div = window.document.getElementsByClassName("subC")[0];

    let tree, dmc, d = new Date();

    s.setup = function () {
        canvas = s.createCanvas(1000, 1000);
        s.noFill();
        s.stroke(50);
        s.frameRate(30);
        s.background(250);
        s.angleMode(s.RADIANS);
        applyScalling(div, canvas.canvas);
        // s.bezierDetail(5);
        tree = new KdTree([[50, 50], [s.width - 50, 50], [s.width - 50, s.height - 50], [50, s.height - 50]]);
        dmc = new DMControl();
        dmc.setTarget(tree);

        let ti = Math.floor(s.map(dmc.update(true), 0, 1, 0, 64));
        for (let i = 0; i < ti; i++) {
            tree.divide();
        }
        tree.render();

    }

    s.draw = function () {
        tree.update();
        s.background(250, 150);
        tree.render();
        dmc.update();
        //dev

        // console.log(lt.get(d.getTime()).direction);
        // .get(s.frameCount)
        // dmc.debug();
        // s.text(s.frameRate(), 10, 10);
    }

    // s.mouseClicked = function () {
    //     s.noLoop();
    // }

    // s.keyPressed = function () {
    //     if (s.keyCode === s.UP_ARROW) tree.divide();
    //     if (s.keyCode === s.DOWN_ARROW) tree.merge();
    //     s.loop();
    //     s.background(250);
    //     tree.render();
    // }

    s.windowResized = function () {
        applyScalling(div, canvas.canvas);
    }
}
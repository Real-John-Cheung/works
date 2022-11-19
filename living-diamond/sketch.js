const applyScalling = function (parent, children) {
    children.style.transform = 'scale(1, 1)';
    children.style.transformOrigin = '0 0 '
    let { width: cw, height: ch } = children.getBoundingClientRect();
    let { width: ww, height: wh } = parent.getBoundingClientRect();
    let scaleAmtX = Math.max(ww / cw, wh / ch);
    let scaleAmtY = scaleAmtX;
    children.style.transform = `scale(${scaleAmtX}, ${scaleAmtY})`;
}

const fromAngle = function(ang, mag) {
    return ({x: Math.cos(ang) * mag, y: Math.sin(ang) * mag})
}

let sketch = s => {
    class Dia {
        constructor(center, size) {
            this.cx = center.x;
            this.cy = center.y;
            this.radius = size;

            this.outerVertices = new Array(10);
            // [mag0.5~1, angle -PI/10~PI/10degree] => [noiseP0, noiseP1];
            let tem0 = Math.random() * 14400;
            let tem1 = Math.random() * 14400;
            for (let i = 0; i < this.outerVertices.length; i++) {
                this.outerVertices[i] = [tem0 + i * 400, tem1 + i * 400];
            }
        }

        get() {
            //return absolute x,y
            let cooked = [];
            this.outerVertices.forEach((v, i) => {
                let mag = 0.9 + s.noise(v[0]) * 0.1;
                let beta = -(Math.PI / 20) + s.noise(v[1]) * (Math.PI / 10);
                let rv = fromAngle(i * (Math.PI / 5) + beta, this.radius * mag);
                cooked.push({ x: this.cx + rv.x, y: this.cy + rv.y});
            })
            return cooked;
        }

        update() {
            const step = 0.006;
            for (let i = 0; i < this.outerVertices.length; i++) {
                this.outerVertices[i][0] += step;
                this.outerVertices[i][1] += step;
            }
        }
    }

    class Polygon {
        constructor(depth, maxDepth, noOfSides) {
            this.depth = depth;
            this.maxDepth = maxDepth;
            this.sideNo = noOfSides;
            this.outerVertices = new Array(this.sideNo);
            for (let i = 0; i < this.outerVertices.length; ++i) {
                this.outerVertices[i] = {x:0,y:0};
            }
            this.outerEdgesMiddle = new Array(this.sideNo);
            for (let i = 0; i < this.outerEdgesMiddle.length; ++i) {
                this.outerEdgesMiddle[i] = {x:0,y:0};
            }
            this.controlPoints = new Array(this.sideNo);
            for (let i = 0; i < this.controlPoints.length; ++i) {
                this.controlPoints[i] = {x:0,y:0};
            }
            this.innerCenter = {x:0,y:0};
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
            this.render();
            this.renderChildren();
        }

        render() {
            s.push();
            s.beginShape();
            for (const p of this.outerVertices) {
                s.vertex(p.x, p.y);
            }
            s.endShape(s.CLOSE);
            s.pop();
        }

        renderChildren() {
            const fac = 0.018;
            //todo
            // s.beginShape();
            // for (const p of this.controlPoints) {
            //     s.vertex(p.x, p.y);
            // }
            // s.endShape(s.CLOSE);
            const cvm1 = 100 / (Math.pow(this.depth, 2) + 1);
            let cvm2 = -1000 / (Math.pow(this.depth, 3) + 1);
            for (let i = 0; i < this.sideNo; i++) {
                let j = (i - 1 + this.sideNo) % this.sideNo

                let cvA, cvB, mid, lesq, mfa = 1, k, cv;
                // s.line(this.outerEdgesMiddle[i].x, this.outerEdgesMiddle[i].y, this.controlPoints[i].x, this.controlPoints[i].y);
                mid = { x: (this.outerEdgesMiddle[i].x + this.controlPoints[i].x) / 2, y: (this.outerEdgesMiddle[i].y + this.controlPoints[i].y) / 2 }
                lesq = (this.outerEdgesMiddle[i].x - this.controlPoints[i].x) * (this.outerEdgesMiddle[i].x - this.controlPoints[i].x) + (this.outerEdgesMiddle[i].y - this.controlPoints[i].y) * (this.outerEdgesMiddle[i].y - this.controlPoints[i].y)
                mfa = s.map(lesq, 0, 10000, 1, 0.3, true);
                k = Math.atan2(this.controlPoints[i].y - this.outerEdgesMiddle[i].y, this.controlPoints[i].x - this.outerEdgesMiddle[i].x);
                k += (s.noise(s.frameCount * fac) - 0.5) * Math.PI * 2
                k += Math.PI / 2;
                cv = p5.Vector.fromAngle(k, cvm1 * mfa);
                cvA = { x: mid.x + cv.x, y: mid.y + cv.y };
                k -= Math.PI;
                cv = p5.Vector.fromAngle(k, cvm1 * mfa);
                cvB = { x: mid.x + cv.x, y: mid.y + cv.y };
                s.strokeWeight(s.map(lesq, 0, 10000, 0.15, 0.01, true));
                s.bezier(this.outerEdgesMiddle[i].x, this.outerEdgesMiddle[i].y, cvA.x, cvA.y, cvB.x, cvB.y, this.controlPoints[i].x, this.controlPoints[i].y);

                // s.line(this.controlPoints[i].x, this.controlPoints[i].y, this.controlPoints[j].x, this.controlPoints[j].y);
                mid = { x: (this.controlPoints[i].x + this.controlPoints[j].x) / 2, y: (this.controlPoints[i].y + this.controlPoints[j].y) / 2 };
                lesq = (this.controlPoints[i].x - this.controlPoints[j].x) * (this.controlPoints[i].x - this.controlPoints[j].x) + (this.controlPoints[i].y - this.controlPoints[j].y) * (this.controlPoints[i].y - this.controlPoints[j].y);
                mfa = s.map(lesq, 0, 10000, 1, 0, true);
                k = Math.atan2(this.controlPoints[j].y - this.controlPoints[i].y, this.controlPoints[j].x - this.controlPoints[i].x);
                k += (s.noise(s.frameCount * fac) - 0.5) * Math.PI * 2
                k += Math.PI / 2;
                cv = p5.Vector.fromAngle(k, cvm1);
                cvA = { x: mid.x + cv.x, y: mid.y + cv.y };
                k -= Math.PI;
                cv = p5.Vector.fromAngle(k, cvm1);
                cvB = { x: mid.x + cv.x, y: mid.y + cv.y };
                s.strokeWeight(s.map(lesq, 0, 10000, 0.15, 0.01, true));
                s.bezier(this.controlPoints[i].x, this.controlPoints[i].y, cvA.x, cvA.y, cvB.x, cvB.y, this.controlPoints[j].x, this.controlPoints[j].y);
            }
            if (this.depth < this.maxDepth) {
                for (const child of this.children) {
                    child.renderChildren();
                }
            }
        }

        setInBetweenPoint(target, sourceA, sourceB, ratio) {
            try {
                target.x = sourceA.x * ratio + sourceB.x * (1 - ratio);
                target.y = sourceA.y * ratio + sourceB.y * (1 - ratio);
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
            target.x = sumX / vertices.length;
            target.y = sumY / vertices.length;
        }
    }

    let canvas;
    let dia, poly, noiseP = Math.random() * 14400;
    const div = window.document.getElementsByClassName("subC")[0];
    let f1;

    s.setup = function () {
        canvas = s.createCanvas(400, 400);
        s.noFill();
        s.stroke(50);
        // s.frameRate(12)
        s.background(250);
        s.angleMode(s.RADIANS);
        applyScalling(div, canvas.canvas);
        s.bezierDetail(1);
        f1 = canvas.parent().classList.contains("f1");
        dia = new Dia({ x: s.width / 2, y: s.height / 2 }, s.width / 2);
        poly = new Polygon(0, 4, 10);
        poly.update(dia.get(), noiseP);
        poly.display();
    }

    s.draw = function () {
        s.background(250);
        //s.text(s.frameRate(),20,20)
        noiseP += 0.01;
        dia.update();
        poly.update(dia.get(), noiseP);
        poly.display();
    }

    s.windowResized = function () {
        applyScalling(div, canvas.canvas);
    }
}
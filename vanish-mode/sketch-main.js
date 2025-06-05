const hanziSize = 100;
const latinLetterSize = 100;
const strokeTransform = getTransform(hanziSize, hanziSize);


const theP5 = new p5(s => {
    const strokesMap = {}, bodies = [];
    let sentences = [];
    // matter.js alias
    let Engine = Matter.Engine,
        World = Matter.World,
        Bodies = Matter.Bodies;
    // matter.js vars
    let engine;
    // prefabs
    let latinLetters, latinFont, hanziFont;
    Matter.Common.setDecomp(decomp);
    s.preload = function () {
        latinFont = s.loadFont("./Diphylleia-Regular.ttf");
        hanziFont = s.loadFont("./zh.ttf");
        s.loadFromFile("./test.txt");
        s.loadLatinLetterJSON();
    }

    s.setup = function () {
        s.createCanvas(s.windowWidth, s.windowHeight);
        s.background(0);
        engine = Engine.create();
        world = engine.world;
        console.log(strokesMap, latinLetters);
        // ground
        const ground = Bodies.rectangle(-100, s.windowHeight, s.windowWidth + 200, 50, { isStatic: true });
        bodies.push(ground);
        World.add(world, ground);
        //s.debugRender();
    }

    s.draw = function () {
        
    }

    /**
     * 
     * @param {number} alignment 0 bottom left 1 top left 2 center
     */
    s.createBodyChar = function (char, pos, alignment = 2) {
        
    }

    /**
     * 
     * @param {number} alignment 0 bottom left 1 top left 2 center
     */
    s.createBoxBody = function (c, pos, alignment = 0) {
        
    }

    s.debugRender = function () {
        const charToSee = "個";
        s.translate(100, 100);
        // bound box
        s.stroke(255, 0, 0);
        s.noFill()
        s.rect(0, 0, 100, 100);
        const strokes = strokesMap[charToSee];
        strokes.forEach((stroke, i) => {
            bodies.push(s.createBodyFromShape(stroke, true));
        });
        const A = latinLetters["A"];
        bodies.push(s.createBodyFromShape(A));

        bodies.forEach((body, i) => {
            Matter.Body.setPosition(body, { x: i * 50, y: 0 })
            // outline collision box
            s.noFill();
            s.stroke(255, 255, 0);
            s.beginShape();
            body.vertices.forEach(p => s.vertex(p.x, p.y));
            s.endShape(s.CLOSE);
            // display
            s.fill(255, 0, 0);
            s.fillSVGPath(body.displayPath, body.position, body.angle, body.displayOffset, body.isChineseStroke);
        })
    }

    s.parseStrokes = function (dStrArr) {
        let res = []
        const shape = [];
        dStrArr.forEach(dStr => {
            const o = {};
            const vertices = s.svgPath2Vertices(dStr);
            const hitBox = simplify(vertices, 1, false);
            let maxX = -Infinity, maxY = -Infinity, minX = Infinity, minY = Infinity
            hitBox.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            })
            o.path = new Path2D(dStr);
            o.hitBox = hitBox;
            o.bounds = {
                max: { x: maxX, y: maxY },
                min: { x: minX, y: minY }
            };
            res.push(o);
        });
        return res;
    }

    s.svgPath2Vertices = function (dStr, sampleRate = 1) {
        const props = new svgPathProperties.svgPathProperties(dStr);
        const length = props.getTotalLength();
        const points = [];
        for (let i = 0; i <= length; i += sampleRate) {
            let { x, y } = props.getPointAtLength(i);
            x *= strokeTransform.scale.x;
            y *= strokeTransform.scale.y;
            x += strokeTransform.translate.x;
            y += strokeTransform.translate.y;

            points.push({ x, y });
        }
        return points;
    }

    s.windowResized = function () {
        s.resizeCanvas(s.windowWidth, s.windowHeight);
    }

    s.loadLatinLetterJSON = function () {
        latinLetters = s.loadJSON("./latinLetters.json");
    }

    s.loadFromFile = function (path) {
        // should not use
        s.loadStrings(path, (arr) => {
            sentences = arr;
            for (let i = 0; i < sentences.length; i++) {
                sentences[i] = sentences[i].split('|');
                for (let j = 0; j < sentences[i].length; j++) {
                    sentences[i][j] = [...sentences[i][j]];
                    for (let k = 0; k < sentences.length; k++) {
                        const char = sentences[i][j][k];
                        if (char) {
                            if (!strokesMap.hasOwnProperty(char)) {
                                const url = "https://cdn.jsdelivr.net/npm/hanzi-writer-data@latest/" + char + ".json";
                                s.loadJSON(url, data => {
                                    strokesMap[char] = s.parseStrokes(data.strokes);
                                });
                            }
                        }
                    }
                }
            }
        });
    }

    s.fillSVGPath = function (path, position = { x: 0, y: 0 }, angle = 0, offset = { x: 0, y: 0 }, isStroke = false) {
        const ctx = s.drawingContext;
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(angle);
        ctx.translate(-offset.x, -offset.y);
        if (isStroke) {
            ctx.translate(strokeTransform.translate.x, strokeTransform.translate.y);
            ctx.scale(strokeTransform.scale.x, strokeTransform.scale.y);
        }
        ctx.fill(path, "evenodd");
        ctx.restore();
    }

    s.createBodyFromShape = function (shape, isChineseStroke = false, position = { x: 0, y: 0 }) {
        const body = Matter.Bodies.fromVertices(0, 0, shape.hitBox);
        const offset = {
            x: shape.bounds.min.x - body.bounds.min.x,
            y: shape.bounds.min.y - body.bounds.min.y
        }
        body.displayOffset = offset;
        body.displayPath = shape.path;
        if (typeof body.displayPath === 'string') body.displayPath = new Path2D(body.displayPath);
        body.isChineseStroke = isChineseStroke;
        Matter.Body.setPosition(body, position);
        return body;
    }

    s.loadFromString = function (str) {
        // todo
    }

}, "c")
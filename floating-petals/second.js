const poem_ch_ori = "我們是時代的孩子|這個時代是一個政治的時代|所有你的我們的你們的|日常和夜間事務|都是政治的事務|不管你想不想要|你的基因有政治的過去|你的皮膚有政治的色彩|你的眼裏有政治的神情|你說的話有政治的回音|你的沉默訴說著許多話語|橫著看豎著看都是政治性的|甚至當你走入森林|你也踏著政治的步伐|走在政治的地面上|非政治的詩也是政治的|天空中懸掛著月亮|那已經不只是月球|活著或是死亡這是個問題|什麼樣的問題回答吧親愛的|這是個政治的問題|你甚至不必身而為人|才能具有政治的意義|你可以只是石油|糧草或是再生原料就已足夠|或者是舉行會議的那張桌子|他們為了它的形狀吵了好幾個月|到底要在方桌還是圓桌旁邊|進行攸關生死的談判|在此同時人們橫死|動物暴斃|房屋燃燒|就像在久遠以前|不那麼政治化的時代"
const poem_en_ori = "We are children of our age |it is a political age |All day long all through the night |all affairs—yours, ours, theirs—are political affairs |Whether you like it or not |your genes have a political past |your skin a political cast |your eyes a political slant |Whatever you say reverberates |whatever you do not say speaks for itself |So either way you are talking politics |Even when you take to the woods |you are taking political steps |on political grounds |Apolitical poems are also political |and above us shines a moon |no longer purely lunar |To be or not to be, that is the question |and though it troubles the digestion |it is a question as always of politics |To acquire a political meaning |you do not even have to be human |Raw material will do |or protein feed or crude oil |or a conference table whose shape |was quarreled over for months |Should we arbitrate life and death |at a round table or a square one |Meanwhile people perished |animals died |houses burned |and the fields ran wild |just as in times immemorial |and less political"
const poem_ch = "我們|是|時代|的|孩子|這個|時代|是|一個|政治的|時代|所有|你的|我們的|你們的|日常|和|夜間|事務|都是|政治的|事務|你的|基因|有|政治的|過去|你的|皮膚|有|政治的|色彩|你的|眼裏|有|政治的|神情|你|說的|話|有|政治的|回音|橫著|看|豎著|看|都是|政治性|的|甚至|當|你|走入|森林|你|也|踏著|政治的|步伐|走|在|政治的|地面|上|非|政治的|詩|也是|政治的|活著|或是|死亡|這是|個|問題|什麼樣|的|問題|回答|吧|親愛的|這是|個|政治的|問題|你|甚至|不必|身而為人|才能|具有|政治的|意義|你|可以|只是|石油|或者|是|舉行|會議|的|那|張|桌子|人們|橫死|動物|暴斃|房屋|燃燒|就像|在|久遠|以前|不|那麼|政治化|的|時代";
const poem_en = "We |are |children |of |our |age |it |is |a |political |age |all |affairs |yours |ours |theirs |are |political |affairs |your |genes |have |a |political |past |your |skin |a |political |cast |your |eyes |a |political |slant |So |either |way |you |are |talking |politics |Even |when |you |take |to |the |woods |you |are |taking |political |steps |on |political |grounds |Apolitical |poems |are |also |political |To |be |or |not |to |be |that |is |the |question |it |is |a |question |as |always |of |politics |To |acquire |a |political |meaning |you |do |not |even |have |to |be |human |Raw |material |will |do |or |a |conference |table |People |perished |animals |died |houses |burned |just |as |in |times |immemorial |and |less |political ";

const applyScaling = (parent, children) => { 
    children.style.transform = 'scale(1, 1)';
    children.style.transformOrigin = '0 0 '
    let { width: cw, height: ch } = children.getBoundingClientRect();
    let { width: ww, height: wh } = parent.getBoundingClientRect();
    let scaleAmtX = Math.max(ww / cw, wh / ch);
    let scaleAmtY = scaleAmtX;
    children.style.transform = `scale(${scaleAmtX}, ${scaleAmtY})`;
}
let sketch = s => {
    const container = document.getElementById("p5-container");
    let canvas;
    const noCharacterPerLine = 49;
    const noLetterPerLine = 90;
    const noLine = 60;
    let fontSizeCh, fontSizeEn, lineHeight, chTextCursor = 0, enTextCursor = 0, chRoundCount = 0, enRoundCount = 0, chXStep, enXStep, maskAlpha = 0; // int
    let chCursor = [], enCursor = [], chxc = 0, chyc = 0, enxc = 0, enyc = 0;
    let chChaotic = 0, enChaotic = 0, engPadding; // float
    let chFont, enFont;
    let chWarr, enWarr, chWarrCursor = 0, enWarrCursor = 0;
    let comingCh, nextCh, comingEn, nextEn;
    let ok = false;

    let chls = [], enls = [];

    s.preload = () => {
        //chFont = s.loadFont("modified.ttf");
        chFont = s.loadFont("genyoelmin.ttf");
        enFont = s.loadFont("NimbusMono-Regular.otf");
        // chFont = s.loadFont("modifiedRe.ttf");
        // enFont = s.loadFont("CourierPrime-Regular.ttf");
    }

    s.setup = () => {
        chWarr = poem_ch.split("|");
        enWarr = poem_en.split("|");
        canvas = s.createCanvas(container.clientWidth, Math.round(9 * container.clientWidth / 16));
        chXStep = (s.width / 2) / (noCharacterPerLine + 1.5);
        enXStep = (s.width / 2) / (noLetterPerLine + 1.5);
        fontSizeCh = (s.width / 2) / (noCharacterPerLine + 1.5);
        fontSizeEn = fontSizeCh * 1;
        lineHeight = s.height / (noLine);
        engPadding = lineHeight * 0.15;
        s.fill(0);
        s.noStroke();
        s.textAlign(s.LEFT, s.TOP);
        chCursor = [0, 0], enCursor = [s.width / 2, engPadding];
        //s.frameRate(3.5);
        s.frameRate(60);
        // s.ellipse(0, 0, 5, 5);
        // s.ellipse(s.width/2, 0, 5, 5);
        //applyScaling(container, canvas.canvas);
    }

    s.mouseClicked = () => {
        if (!ok) {
            s.frameRate(3.5);
            ok = true;
        } else {
            s.save(canvas, s.frameCount + ".png");
        }
    }

    // s.windowResized = () => {
    //     applyScaling(container, canvas.canvas);
    // }

    s.draw = () => {
        s.textAlign(s.LEFT, s.TOP);
        let chToWrite = [];
        let enToWrite = [];
        // let chn = Math.floor(1 + Math.random() * 2);
        // let enn = Math.floor(2 + Math.random() * 4);

        // let chToWrite = [];
        // for (let i = 0; i < chn; i++) {
        //     let thisCh = poem_ch[chTextCursor];
        //     chTextCursor++;
        //     while (thisCh == '|') {
        //         thisCh = poem_ch[chTextCursor];
        //         chTextCursor++;
        //     }
        //     if (chTextCursor >= poem_ch.length) {
        //         chTextCursor = 0;
        //         chRoundCount++;
        //         console.log("chRC: " + chRoundCount);
        //     }
        //     chToWrite.push(thisCh);
        // }

        // let enToWrite = []
        // for (let i = 0; i < enn; i++) {
        //     let thisEn = poem_en[enTextCursor];
        //     enTextCursor++;
        //     while (thisEn == '|') {
        //         thisEn = poem_en[enTextCursor];
        //         enTextCursor++;
        //     }
        //     if (enTextCursor >= poem_en.length) {
        //         enTextCursor = 0;
        //         enRoundCount++;
        //         console.log("enC: " + enRoundCount);
        //     }
        //     enToWrite.push(thisEn);
        // }

        comingCh = chWarr[chWarrCursor];
        chls.push(comingCh);
        if (chls.length > 30) chls.shift();
        chToWrite = comingCh.split("");
        chWarrCursor++;

        

        if (s.frameCount % 3 != 0) {
            if (nextEn) {
                comingEn = nextEn;
                nextEn = undefined;
            } else {
                comingEn = enWarr[enWarrCursor];
                if (comingEn.length > 10) {
                    let first = comingEn.substring(0, Math.floor(comingEn.length / 2));
                    let second = comingEn.substring(Math.floor(comingEn.length / 2));
                    comingEn = first;
                    nextEn = second;
                } else {
                    nextEn = undefined;
                }
                enWarrCursor++;
            }
            enToWrite = comingEn.split("");
            enls.push(comingEn);
            if (enls.length > 30) enls.shift();
        }
        
        if (chWarrCursor >= chWarr.length) {
            chWarrCursor = 0;
            chRoundCount++;
            console.log("CH: " + chRoundCount);
        }
        if (enWarrCursor >= enWarr.length) {
            enWarrCursor = 0;
            enRoundCount++;
            console.log("EN: " + enRoundCount);
        }

        //ch chaotic
        if (chChaotic >= 0.2 && chChaotic < 0.5) {
            if (Math.random() < chChaotic / 5 ) {
                chWarrCursor += Math.floor(-3 + Math.random() * 6);
                if (chWarrCursor >= chWarr.length) {
                    chWarrCursor -= chWarr.length;
                    chRoundCount++;
                } else if (chWarrCursor < 0) {
                    chWarrCursor += chWarr.length;
                }
            }
        } else if (chChaotic >= 0.5) {
            if (Math.random() < chChaotic) {
                chWarrCursor = Math.floor(Math.random() * chWarr.length);
            }
        }

        //en chaotic
        if (enChaotic >= 0.16 && enChaotic < .5) {
            if (Math.random() < enChaotic / 5) {
                enWarrCursor += Math.floor(-3 + Math.random() * 6);
                if (enWarrCursor >= enWarr.length) {
                    enWarrCursor -= enWarr.length;
                    enRoundCount++;
                } else if (enWarrCursor < 0) {
                    enWarrCursor += enWarr.length;
                }
            }
        } else if (enChaotic >= .5) {
            if (Math.random() < enChaotic) {
                enWarrCursor = Math.floor(Math.random() * enWarr.length);
            }
        }
        

        //console.log(enToWrite, chToWrite);

        s.textFont(chFont);
        chToWrite.forEach(c => {
            s.push();
            s.textSize(fontSizeCh);
            if (maskAlpha > 0) {
                s.fill(255, maskAlpha);
                s.rect(enCursor[0], enCursor[1], enXStep, lineHeight);
            }
            s.fill(0)
            s.text(c, chCursor[0], chCursor[1]);
            chCursor[0] += chXStep;
            chxc++;
            if (chxc > noCharacterPerLine) {
                chCursor[0] = 0;
                chCursor[1] += lineHeight;
                //console.log(chyc);
                // if (chyc === 29) chCursor[1] += lineHeight * 4;
                chxc = 0;
                chyc++;
            }
            if (chyc >= noLine) {
                chCursor[1] = 0;
                chyc = 0
            }
            s.pop();
        });

        s.textFont(enFont);
        enToWrite.forEach(l => {
            s.push();
            s.textSize(fontSizeEn);
            if (maskAlpha > 0) {
                s.fill(255, maskAlpha);
                s.rect(enCursor[0], enCursor[1], enXStep, lineHeight);
            }
            s.fill(0)
            s.text(l, enCursor[0], enCursor[1]);
            enCursor[0] += enXStep;
            enxc++
            if (enxc > noLetterPerLine) {
                enxc = 0;
                enCursor[0] = s.width / 2;
                enCursor[1] += lineHeight;
                // if (enyc === 29) enCursor[1] += lineHeight * 4;
                enyc++
            }
            if (enyc >= noLine) {
                enCursor[1] = engPadding;
                enyc = 0;
            }
            s.pop();
        });

        chChaotic = chRoundCount  / 100;
        enChaotic = enRoundCount  / 100;

        // renderCurrent();
    }

    renderCurrent = () => { 

        s.push();
        

        s.fill(255);
        s.rectMode(s.CENTER);
        s.rect(s.width * 3 / 4, s.height / 2, s.width/2, lineHeight * 4);
        s.fill(0);
        s.textAlign(s.RIGHT, s.CENTER);
        s.textFont(enFont);
        s.textSize(fontSizeEn * 2)
        s.text(enls.join("").trim(), s.width / 2 + enXStep * (noLetterPerLine + 1), s.height / 2);

        s.fill(255);
        s.rectMode(s.CENTER);
        s.rect(s.width / 4, s.height / 2, s.width/2, lineHeight * 4);
        s.fill(0);
        s.textAlign(s.RIGHT, s.CENTER);
        s.textFont(chFont);
        s.textSize(fontSizeCh * 2)
        s.text(chls.join(""), chXStep * (noCharacterPerLine + 1), s.height / 2);
        //console.log(comingCh);
        s.pop();
    }
};
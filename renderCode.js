function docReady(fn) {
    // see if DOM is already available
    if (document.readyState === "complete" || document.readyState === "interactive") {
        // call on next available tick
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

function adjustFontSize() {
    const maxAttampts = 999;
    let attampts = 0;
    const jsHeightStr = window.getComputedStyle(document.getElementById("js")).height;
    const jsHeight = parseFloat(jsHeightStr.replace("px", ""));
    const wrapper = document.getElementById("wrapper");
    const codeContainer = document.getElementsByClassName("language-javascript")[0]
    let wh = wrapper.clientHeight;
    let currentFs = parseInt(window.getComputedStyle(codeContainer).fontSize.replace("px", ""));
    if (wh > jsHeight) {
        while (attampts < maxAttampts && wh > jsHeight) {
            attampts++;
            currentFs -= 0.05;
            wrapper.style.fontSize = (currentFs) + "px";
            wh = wrapper.clientHeight;
        }
    } else {
        while (attampts < maxAttampts && wh <= jsHeight) {
            attampts++;
            currentFs += 0.05;
            wrapper.style.fontSize = (currentFs) + "px";
            wh = wrapper.clientHeight;
        }
    }
}

go = async function () {
    let ht = await fetch("./index.html").then(resp => resp.text());
    tf = ht.match(/<script.*?src="(.*?)"/gmi);
    for (let i = 0; i < tf.length; i++) {
        if (!tf[i].includes("src") || tf[i].includes("https:") || tf[i].includes("utils.js")) {
            tf.splice(i, 1);
            i--
            continue;
        } 
        tf[i] = tf[i].replace(/<script.*?src="(.*?)"/gi, "$1").trim();
    }
    let rc = {};
    let fileno = 1;
    for (let i = 0; i < tf.length; i++) {
        let c = await fetch(tf[i]).then(rep => rep.text());
        let fileName = "file" + fileno;
        rc[fileName] = c;
        fileno++;
    }
    console.log(tf);
    let text = minify(rc, {compress: {passes: 2}}).code;
    //console.log(text);
    const codeContainer = document.getElementsByClassName("language-javascript")[0]
    codeContainer.textContent = text;
    hljs.highlightElement(codeContainer);
    codeContainer.style.wordBreak = "break-all";
    adjustFontSize();
    window.onresize = adjustFontSize;
}

docReady(go);
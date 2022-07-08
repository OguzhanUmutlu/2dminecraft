(async () => {
    let resolveMain;
    window.mainReady = new Promise(r => resolveMain = r);
    window.CONSTANTS = {
        PLAYER_ATTACK_REACH: 3,
        PLAYER_BUILDING_REACH: 4.5,
        PLAYER_ACCELERATION_BASE: 0.098,
        PLAYER_ACCELERATION_SPRINTING_FACTOR: 1.3,
        PLAYER_ACCELERATION_TICK: 1,
        PLAYER_FRICTION_DEFAULT: 0.546,
    };
    window.RADIAN = Math.PI / 180;
    window.canvas = document.createElement("canvas");
    window.ctx = canvas.getContext("2d");
    window.canvasDIV = document.getElementById("canvas");
    if (canvasDIV) canvasDIV.appendChild(canvas);
    window.ASSET_DICTIONARY = {
        break_1: "break_1.png",
        break_2: "break_2.png",
        break_3: "break_3.png",
        break_4: "break_4.png",
        break_5: "break_5.png",
        break_6: "break_6.png",
        break_7: "break_7.png",
        break_8: "break_8.png",
        break_9: "break_9.png",
        break_10: "break_10.png",
        widgets: "textures/minecraft/textures/gui/widgets.png",
    };
    window.ASSET_PREFIX = "./assets/";
    window.assets = {};
    window.assetsCropped = {};
    for (let i = 0; i < Object.keys(ASSET_DICTIONARY).length; i++) {
        const key = Object.keys(ASSET_DICTIONARY)[i];
        const img = assets[key] = new Image();
        img.src = ASSET_PREFIX + ASSET_DICTIONARY[key];
        await new Promise(resolve => img.onload = resolve);
    }
    window.updateCanvasSize = () => {
        if (canvas.width === window.innerWidth && canvas.height === window.innerHeight) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    window.requestAnimationFramePromise = () => new Promise((resolve) => requestAnimationFrame(resolve));
    let __c = {};
    window.actClassOnCanvas = async (cl, r) => {
        if (__c[cl]) clearInterval(__c[cl]);
        canvasDIV.classList.remove(cl);
        await requestAnimationFramePromise();
        if (__c[cl]) clearInterval(__c[cl]);
        canvasDIV.classList.add(cl);
        if (r) __c[cl] = setTimeout(() => canvasDIV.classList.remove(cl), 300);
    }
    window.shakeCanvas = async () => await actClassOnCanvas("shakeEffect", false);
    window.readImagePart = (img, x, y, w, h) => {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const l = c.getContext("2d");
        l.drawImage(img, x, y, w, h, 0, 0, w, h);
        return c;
    };
    window.assetsCropped.widgets = {
        inventory: readImagePart(assets.widgets, 0, 0, 182, 22),
        inventory_selected: readImagePart(assets.widgets, 0, 22, 24, 24),
        button_disabled: readImagePart(assets.widgets, 0, 46, 200, 20),
        button_enabled: readImagePart(assets.widgets, 0, 66, 200, 20),
        button_hover: readImagePart(assets.widgets, 0, 86, 200, 20),
    };
    window.searchSkinNameMc = async name => {
        return await new Promise(resolve => {
            const url = `https://namemc.com/search?q=${name}`;
            fetch(url).then(res => {
                res.text().then(html => {
                    const dom = new DOMParser().parseFromString(html, "text/html");
                    const el = Array.from(dom.querySelectorAll("body > main > div > div")).find(i => Array.from(i.classList).includes("order-md-0"));
                    el.querySelector("div").remove();
                    el.querySelector("div").remove();
                    el.querySelector("h6").remove();
                    Array.from(el.children).forEach(child => child.querySelector(".card-body")?.remove());
                    el.children[el.children.length - 1].remove();
                    el.innerHTML = Array.from(el.children).map(child => child.children[0].innerHTML).join("");
                    resolve(Array.from(el.children).map(c => {
                        const skinId = c.querySelector("img").src.split("s.namemc.com/2d/skin/face.png?id=")[1].split("&")[0];
                        return {
                            face: c.querySelector("img").src,
                            skinId, skin: `https://s.namemc.com/i/${skinId}.png`,
                            name: c.querySelector("a").innerHTML
                                .replaceAll(" ", "")
                                .replaceAll("\n", "")
                                .replaceAll("\r", "")
                        };
                    }));
                }).catch(() => resolve([]));
            }).catch(() => resolve([]));
        });
    };

    window.searchSkinNameMcExact = async name => {
        const result = await searchSkinNameMc(name);
        return result.find(r => r.name === name);
    };
    resolveMain();
})();
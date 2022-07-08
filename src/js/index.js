(async () => {
    const RADIAN = Math.PI / 180;
    window.canvas = document.createElement("canvas");
    window.ctx = canvas.getContext("2d");
    const canvasDIV = document.getElementById("canvas");
    canvasDIV.appendChild(canvas);
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
        break_10: "break_10.png"
    };
    window.ASSET_PREFIX = "./assets/";
    window.assets = {};
    for (let i = 0; i < Object.keys(ASSET_DICTIONARY).length; i++) {
        const key = Object.keys(ASSET_DICTIONARY)[i];
        const img = assets[key] = new Image();
        img.src = ASSET_PREFIX + ASSET_DICTIONARY[key];
        await new Promise(resolve => img.onload = resolve);
    }
    const updateCanvasSize = () => {
        if (canvas.width === window.innerWidth && canvas.height === window.innerHeight) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    const requestAnimationFramePromise = () => new Promise((resolve) => requestAnimationFrame(resolve));
    let __c = {};
    const actClassOnCanvas = async (cl, r) => {
        if (__c[cl]) clearInterval(__c[cl]);
        canvasDIV.classList.remove(cl);
        await requestAnimationFramePromise();
        if (__c[cl]) clearInterval(__c[cl]);
        canvasDIV.classList.add(cl);
        if (r) __c[cl] = setTimeout(() => canvasDIV.classList.remove(cl), 300);
    }
    window.shakeCanvas = async () => await actClassOnCanvas("shakeEffect", false);
    const readImagePart = (img, x, y, w, h) => {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const l = c.getContext("2d");
        l.drawImage(img, x, y, w, h, 0, 0, w, h);
        return c;
    };
    const searchSkinNameMc = async name => {
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

    const searchSkinNameMcExact = async name => {
        const result = await searchSkinNameMc(name);
        return result.find(r => r.name === name);
    };

    const playerSkinFromNameMc = async name => {
        const res = await searchSkinNameMcExact(name);
        if (!res) return;
        return new HumanSkin(res.skin);
    };

    class Skin {
        constructor(url) {
            this.url = url;
            this.loaded = false;
        }

        /*** @return {Promise<Skin>} */
        async load() {
            throw new Error("Not implemented");
        }
    }

    class HumanSkin extends Skin {
        constructor(url) {
            super(url);
            this.heads = null;
            this.bodies = null;
            this.arms = null;
            this.legs = null;
        }

        /*** @return {Promise<HumanSkin>} */
        async load() {
            if (this.loaded) return this;
            const img = new Image();
            img.src = this.url;
            await new Promise(r => img.onload = r);
            const sw = img.width / 64;
            const sh = img.height / 64;
            const t = (x, y, w, h) => readImagePart(img, x * sw, y * sh, w * sw, h * sh);
            const heads = [t(16, 8, 8, 8), t(0, 8, 8, 8)];
            const bodies = [t(28, 20, 4, 12), t(16, 20, 4, 12)];
            const arms = [t(40, 52, 4, 12), t(40, 20, 4, 12)];
            const legs = [t(24, 52, 4, 12), t(0, 20, 4, 12)];
            const mkFunc = obj => ({
                                       ctx, x = 0, y = 0, middle = false, width, height,
                                       rotation = 0, transformRotation = true
                                   } = {}) => {
                if (middle) {
                    x = x + ctx.canvas.width / 2;
                    y = y + ctx.canvas.height / 2;
                }
                ctx.save();
                if (transformRotation) {
                    ctx.setTransform(1, 0, 0, 1, x, y);
                    //ctx.setTransform(height / obj.height, 0, 0, width / obj.width, x, y);
                    ctx.rotate(rotation);
                    //ctx.drawImage(obj, (transformRotation ? 0 : x) - obj.width / 2, (transformRotation ? 0 : y) - obj.height / 2, transformRotation ? obj.width : width, transformRotation ? obj.height : height);
                    //ctx.drawImage(obj, -obj.width / 2, -obj.height / 2, obj.width, obj.height);
                    ctx.drawImage(obj, -width / 2, -height / 2, width, height);
                } else {
                    ctx.translate(x + width / 2, y);
                    ctx.rotate(rotation);
                    ctx.translate(-x - width / 2, -y);
                    ctx.drawImage(obj, x, y, width, height);
                }
                ctx.restore();
            }

            this.heads = {heads, draw: {left: mkFunc(heads[0]), right: mkFunc(heads[1])}};
            this.bodies = {bodies, draw: {left: mkFunc(bodies[0]), right: mkFunc(bodies[1])}};
            this.arms = {arms, draw: {left: mkFunc(arms[0]), right: mkFunc(arms[1])}};
            this.legs = {legs, draw: {left: mkFunc(legs[0]), right: mkFunc(legs[1])}};
            // TODO: second level of the skin isn't being loaded or rendered
            this.loaded = true;
            return this;
        }
    }

    let __uuid = 0;

    class Entity {
        constructor(x, y, skin) {
            this.x = x;
            this.y = y;
            this.skin = skin;
            this.uuid = __uuid++;
        }

        /*** @return {Entity} */
        drawSkin() {
            throw new Error("Not implemented");
        }
    }

    class Human extends Entity {
        headYaw = 0; // 0 - 360
        leftHandYaw = 0; // 0 - 90
        leftHandYawVelTarget = 0;
        rightHandYaw = 0; // 0 - 90
        rightHandYawVelTarget = 0;
        legYaw = 0; // 0 - 90
        legYawVelTarget = 0;
        handFullyUp = false;
        handUp = false;
        walkingLegWay = 1;
        walkingOn = false;

        /**
         * @param {number} x
         * @param {number} y
         * @param {HumanSkin} skin
         */
        constructor(x, y, skin) {
            super(x, y, skin);
        }

        drawSkin() {
            if (!this.skin.loaded) return;
            if (!Math.floor(this.rightHandYaw)) this.rightHandYaw = 0;
            if (!Math.floor(this.leftHandYaw)) this.leftHandYaw = 0;
            if (!Math.floor(this.headYaw)) this.headYaw = 0;
            if (!Math.floor(this.legYaw)) this.legYaw = 0;
            const rightHandYawDiff = this.rightHandYawVelTarget - this.rightHandYaw;
            if (Math.abs(rightHandYawDiff) > 0) {
                this.rightHandYaw += rightHandYawDiff / 10;
                if (this.handUp) {
                    if (this.handFullyUp) this.rightHandYawVelTarget = 29;
                    else this.rightHandYawVelTarget = 90;
                }
            }
            if (this.rightHandYaw < 42) this.handFullyUp = false;
            else if (this.rightHandYaw > 80) this.handFullyUp = true;
            const leftHandYawDiff = this.leftHandYawVelTarget - this.leftHandYaw;
            if (Math.abs(leftHandYawDiff) > 0) this.leftHandYaw += leftHandYawDiff / 10;
            if (!this.handUp && this.walkingOn) {
                if (this.walkingLegWay === 1) {
                    this.leftHandYawVelTarget = -90;
                    this.rightHandYawVelTarget = 90;
                } else {
                    this.leftHandYawVelTarget = 90;
                    this.rightHandYawVelTarget = -90;
                }
            }
            if (!this.walkingOn || (this.handUp && this.walkingOn)) this.leftHandYawVelTarget = 0;
            if (!this.handUp && !this.walkingOn) this.rightHandYawVelTarget = 0;
            const legYawDiff = this.legYawVelTarget - this.legYaw;
            if (Math.abs(legYawDiff) > 0) {
                this.legYaw += legYawDiff > 0 ? 5 : -5;
                if (this.walkingOn) {
                    if (this.walkingLegWay === 1) this.legYawVelTarget = 90;
                    else this.legYawVelTarget = 0;
                }
            }
            if (this.legYaw < 6) this.walkingLegWay = 1;
            else if (this.legYaw > 60) this.walkingLegWay = -1;
            const x = this.x + camera.x;
            const y = this.y + camera.y;
            this.headYaw = this.headYaw % 360;
            const isRight = (this.headYaw > -90 && this.headYaw < 90);
            this.skin.arms.draw[isRight ? "left" : "right"]({
                ctx, middle: true, x: x - 8, y: y + 22, width: 16, height: 48, // 4 12
                rotation: RADIAN * (isRight ? -this.leftHandYaw : this.leftHandYaw),
                transformRotation: false
            });
            this.skin.bodies.draw[isRight ? "right" : "left"]({
                ctx, middle: true, x, y: y + 40, width: 20, height: 60 // 4 12
            });
            this.skin.legs.draw[isRight ? "left" : "right"]({
                ctx, middle: true, x: x - 8, y: y + 70, width: 16, height: 48, // 4 12
                rotation: RADIAN * (isRight ? this.legYaw : -this.legYaw),
                transformRotation: false
            });
            this.skin.legs.draw[isRight ? "right" : "left"]({
                ctx, middle: true, x: x - 8, y: y + 70, width: 16, height: 48, // 4 12
                rotation: RADIAN * (isRight ? -this.legYaw : this.legYaw),
                transformRotation: false
            });
            this.skin.arms.draw[isRight ? "right" : "left"]({
                ctx, middle: true, x: x - 8, y: y + 22, width: 16, height: 48, // 4 12
                rotation: RADIAN * (isRight ? -this.rightHandYaw : this.rightHandYaw),
                transformRotation: false
            });
            let headYaw = this.headYaw;
            /*if (headYaw > 30 && headYaw < 90) headYaw = 30;
            if (headYaw < 160 && headYaw > 90) headYaw = 160;*/
            this.skin.heads.draw[isRight ? "right" : "left"]({
                ctx, middle: true, x, y, width: 32, height: 32, // 8 8
                rotation: RADIAN * (isRight ? headYaw : headYaw + 180)
            });
            return this;
        }

        lookAt(x, y) {
            const X = this.skin.loaded ? canvas.width / 2 - this.skin.heads.heads[0].width / 2 : this.x;
            const Y = this.skin.loaded ? canvas.height / 2 - this.skin.heads.heads[0].height / 2 : this.y;
            this.headYaw = Math.atan2(y - Y, x - X) * 180 / Math.PI;
            return this;
        }
    }

    class Player extends Human {
    }

    let mouse = {x: 0, y: 0};
    const skin = await playerSkinFromNameMc("Technoblade");
    await skin.load();
    const player = new Player(0, 0, skin);
    const camera = {x: 0, y: 0};
    new (function () {
        updateCanvasSize();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillRect(canvas.width / 2, 0, 1, canvas.height);
        ctx.fillRect(0, canvas.height / 2, canvas.width, 1);
        player.lookAt(mouse.x, mouse.y);
        player.drawSkin();
        requestAnimationFrame(() => this.constructor());
    })();
    addEventListener("contextmenu", ev => ev.preventDefault());
    addEventListener("mousemove", ev => [mouse.x = ev.clientX, mouse.y = ev.clientY]);
    addEventListener("mousedown", ev => {
        if (ev.button === 0) {
            player.handUp = true;
            player.rightHandYawVelTarget = 90;
        } else if (ev.button === 1) {
            player.walkingOn = true;
            player.legYawVelTarget = 90;
        }
    });
    addEventListener("mouseup", ev => {
        if (ev.button === 0) {
            player.handUp = false;
            player.rightHandYawVelTarget = 0;
        } else if (ev.button === 1) {
            player.walkingOn = false;
            player.legYawVelTarget = 0;
        }
    });
    addEventListener("blur", () => {
        player.handUp = false;
        player.rightHandYawVelTarget = 0;
        player.walkingOn = false;
        player.legYawVelTarget = 0;
    });

    setInterval(() => {
        document.getElementById("info").innerHTML = `Is walking: ${player.walkingOn}<br>Is hand up: ${player.handUp}<br>Head yawn: ${player.headYaw}<br>Right hand yaw: ${player.rightHandYaw}<br>Left hand yaw: ${player.leftHandYaw}<br>Leg yaw: ${player.legYaw}`;
    });
})();
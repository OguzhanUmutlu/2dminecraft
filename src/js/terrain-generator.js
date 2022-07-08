(async () => {
    class Generator {
        constructor({seed, detalization = 100, minHeight, maxHeight, unrenderChunks = true} = {}) {
            this.minHeight = minHeight;
            this.maxHeight = maxHeight;
            this.detalization = detalization;
            this.unrenderChunks = unrenderChunks;
            this.noise = new Noise(seed);
            this.map = {};
        }

        _setMap({x, z, value, force}) {
            if (!this.map[x]) this.map[x] = {};
            if (!this.map[x][z] || force) {
                this.map[x][z] = value;
                return true;
            }
            return false;
        }

        _generateNoise({x, z}) {
            return ((this.noise.perlin2(x / this.detalization, z / this.detalization) + 1) * 0.5) * (this.maxHeight - this.minHeight) + this.minHeight;
        }

        _unrenderChunksOutRange({userX, userZ, renderDistance, unrenderOffset}) {
            const deleted = {};
            const unrenderDistance = renderDistance + unrenderOffset;
            Object.keys(this.map).forEach(x => {
                Object.keys(this.map[x]).forEach(z => {
                    const minX = userX - unrenderDistance;
                    const maxX = userX + unrenderDistance;
                    const minZ = userZ - unrenderDistance;
                    const maxZ = userZ + unrenderDistance;
                    if (x < minX || x > maxX) {
                        if (this.map[x]) {
                            Object.keys(this.map[x]).forEach(z => {
                                if (!deleted[x]) deleted[x] = {};
                                deleted[x][z] = this.map[x][z];
                            });
                            delete this.map[x];
                        }
                    } else if (z < minZ || z > maxZ) {
                        if (!deleted[x]) deleted[x] = {};
                        deleted[x][z] = this.map[x][z];
                        delete this.map[x][z];
                    }
                });
            });
            return deleted;
        }

        updateMap({userPosition, renderDistance, unrenderOffset}) {
            const [userX, userY, userZ] = userPosition.map(o => Number(o));
            const deleted = this.unrenderChunks ? this._unrenderChunksOutRange({
                userX, userZ, renderDistance, unrenderOffset
            }) : undefined;
            const added = {};
            for (let x = -renderDistance + userX; x < renderDistance + userX + 1; x++) for (let z = -renderDistance + userZ; z < renderDistance + userZ + 1; z++) if (this._setMap({
                x, z, value: this._generateNoise({x, z})
            })) added[x] = {...(added[x] || {}), [z]: this.map[x][z]}
            return {map: this.map, added, deleted};
        }
    }

    const mapObjectToArray = object => Object.keys(object).map(key => {
        if (typeof object[key] === "object") return mapObjectToArray(object[key]);
        if (typeof object[key] === "number") return object[key];
        throw new Error(`Mapping element type ${typeof object[key]} is not supported`);
    });
    Generator.mapObjectToArray = mapObjectToArray;
    window.Generator = Generator;
})();
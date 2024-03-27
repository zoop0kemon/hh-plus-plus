const MULTIPLIERS = {
    starting: 1,
    common: 1,
    rare: 1.2,
    epic: 1.4,
    legendary: 1.6,
    mythic: 4
}

const buildCumulativeXPForRarity = (multiplier) => {
    const {GIRL_MAX_LEVEL, HH_MAX_LEVEL} = window
    return Array((GIRL_MAX_LEVEL || HH_MAX_LEVEL) - 1).fill().map((_,i) => Math.ceil(10*multiplier*(Math.pow(1.0075,i)))).reduce((a,x,i) => {a.push(x + (i===0?0:a[a.length-1]));return a}, [])
}

class GirlXP {
    constructor () {
        this.cache = {}
    }

    getCachedForRarity (rarity) {
        if (!this.cache[rarity]) {
            this.cache[rarity] = buildCumulativeXPForRarity(MULTIPLIERS[rarity])
        }
        return this.cache[rarity]
    }

    get starting () {return this.getCachedForRarity('starting')}
    get common () {return this.getCachedForRarity('common')}
    get rare () {return this.getCachedForRarity('rare')}
    get epic () {return this.getCachedForRarity('epic')}
    get legendary () {return this.getCachedForRarity('legendary')}
    get mythic () {return this.getCachedForRarity('mythic')}
}

export default new GirlXP()

import { lsKeys } from './Constants'

let isHH
let isGH
let isCxH
let isPSH
let isHoH
let isTPSH
let isGPSH
let isNutakuKobans
let cdnHost
let girlDictionaryPromise
let teamsDictionary
let platform

const deferred = []

class Helpers {
    static getHost() {
        return window.location.host
    }
    static getCDNHost () {
        if (!cdnHost) {
            const {IMAGES_URL} = window
            cdnHost = IMAGES_URL
        }
        return cdnHost
    }
    static getPathname() {
        return window.location.pathname
    }
    static isCurrentPage(matcher) {
        return Helpers.getPathname().includes(matcher)
    }
    static hasSearch(matcher) {
        return window.location.search.includes(matcher)
    }

    static isHH() {
        if (isHH === undefined) {
            isHH = !(Helpers.isGH() || Helpers.isCxH() || Helpers.isPSH() || Helpers.isHoH() || Helpers.isTPSH() || Helpers.isGPSH())
        }
        return isHH
    }
    static isGH() {
        if (isGH === undefined) {
            isGH = [
                'www.gayharem.com',
                'nutaku.gayharem.com'
            ].includes(Helpers.getHost())
        }
        return isGH
    }
    static isCxH() {
        if (isCxH === undefined) {
            isCxH = [
                'www.comixharem.com',
                'nutaku.comixharem.com'
            ].includes(Helpers.getHost())
        }
        return isCxH
    }
    static isPSH() {
        if (isPSH === undefined) {
            isPSH = [
                'www.pornstarharem.com',
                'nutaku.pornstarharem.com'
            ].includes(Helpers.getHost())
        }
        return isPSH
    }
    static isHoH() {
        if (isHoH === undefined) {
            isHoH = [
                'www.hornyheroes.com'
            ].includes(Helpers.getHost())
        }
        return isHoH
    }
    static isTPSH() {
        if (isTPSH === undefined) {
            isTPSH = [
                'www.transpornstarharem.com',
                'nutaku.transpornstarharem.com'
            ].includes(Helpers.getHost())
        }
        return isTPSH
    }
    static isGPSH() {
        if (isGPSH === undefined) {
            isGPSH = [
                'www.gaypornstarharem.com',
                'nutaku.gaypornstarharem.com'
            ].includes(Helpers.getHost())
        }
        return isGPSH
    }
    static getGameKey () {
        if (Helpers.isHH()) {
            return 'HH'
        }
        if (Helpers.isGH()) {
            return 'GH'
        }
        if (Helpers.isCxH()) {
            return 'CxH'
        }
        if (Helpers.isPSH()) {
            return 'PSH'
        }
        if (Helpers.isHoH()) {
            return 'HoH'
        }
        if (Helpers.isTPSH()) {
            return 'TPSH'
        }
        if (Helpers.isGPSH()) {
            return 'GPSH'
        }
    }

    static getPlatform () {
        if (!platform) {
            const host = Helpers.getHost()
            if (host.includes('nutaku')) {
                platform = 'nutaku'
            } else if (host.includes('erogames')) {
                platform = 'erogames'
            } else if (host.includes('thrixxx')) {
                platform = 'thrixxx'
            } else {
                platform = '.com'
            }
        }
        return platform
    }

    static isNutakuKobans () {
        if (typeof isNutakuKobans === 'undefined') {
            const {HH_UNIVERSE} = window
            isNutakuKobans = HH_UNIVERSE === 'nutaku'
        }
        return isNutakuKobans
    }

    static $ (formattedHtml) {
        if (typeof formattedHtml === 'string') {
            return window.$(formattedHtml.replace(/\n/g, '').replace(/ {4}/g, ''))
        }
        return window.$(formattedHtml)
    }

    static mediaMobile (rule) {
        return `@media only screen and (max-width: 1025px) {${rule}}`
    }
    static mediaDesktop (rule) {
        return `@media only screen and (min-width: 1026px) {${rule}}`
    }

    static b64encode (buffer) {
        const bytes = new Uint8Array(buffer)
        let binary = ''
        for (let i=0;i<bytes.byteLength;i++) {
            binary += String.fromCharCode(bytes[i])
        }
        return window.btoa(binary)
    }
    static b64decode (str) {
        const binary_string = window.atob(str)
        const len = binary_string.length
        const bytes = new Uint8Array(new ArrayBuffer(len))
        for (let i=0;i<len;i++) {
            bytes[i] = binary_string.charCodeAt(i)
        }

        return bytes
    }
    static async loadGirlDictionary () {
        const rawDict = Helpers.lsGetRaw(lsKeys.GIRL_DICTIONARY)

        if (rawDict == null) {
            return new Map()
        } else if (rawDict[0] === '[') {
            // old version
            const girlDictArray = JSON.parse(rawDict)
            return girlDictArray ? new Map(girlDictArray) : new Map()
        } else {
            // new compressed version
            const stream = new Blob([Helpers.b64decode(rawDict)], {type: 'application/json'}).stream()
            return await new Response(stream.pipeThrough(new DecompressionStream('gzip'))).blob().then(blob => blob.text().then(blob_text => {
                const girlDictArray = JSON.parse(blob_text)
                return girlDictArray ? new Map(girlDictArray) : new Map()
            }))
        }
    }

    static async getGirlDictionary () {
        if (!girlDictionaryPromise) {
            girlDictionaryPromise = this.loadGirlDictionary()
        }
        return await girlDictionaryPromise
    }
    static async setGirlDictionary (girlDictionary ) {
        await girlDictionaryPromise
        // Clean up for an old error
        girlDictionary.forEach((girl, girl_id) => {
            if (typeof girl_id !== 'string') {
                girlDictionary.delete(girl_id)
            }
        })
        girlDictionaryPromise = new Promise(resolve => resolve(girlDictionary))
        const girlDictJSON = JSON.stringify(Array.from(girlDictionary))

        // Helpers.lsSetRaw(lsKeys.GIRL_DICTIONARY, girlDictJSON)
        // $(document).trigger('girl-dictionary:updated')

        const stream = new Blob([girlDictJSON], {type: 'application/json'}).stream()
        new Response(stream.pipeThrough(new CompressionStream('gzip'))).blob().then(blob => blob.arrayBuffer()).then(buffer => {
            const compressedBase64 = Helpers.b64encode(buffer)
            // const old_size = (girlDictJSON.length * 2)/1024
            // const new_size = (compressedBase64.length * 2)/1024
            // console.log(`${old_size} -> ${new_size}`)

            Helpers.lsSetRaw(lsKeys.GIRL_DICTIONARY, compressedBase64)
            $(document).trigger('girl-dictionary:updated')
        })
    }

    static getTeamsDictionary() {
        if (!teamsDictionary) {
            teamsDictionary = Helpers.lsGet(lsKeys.TEAMS_DICTIONARY)
        }
        return teamsDictionary
    }
    static setTeamsDictionary(updated) {
        teamsDictionary = updated
        Helpers.lsSet(lsKeys.TEAMS_DICTIONARY, teamsDictionary)
    }

    static onAjaxResponse (pattern, callback) {
        $(document).ajaxComplete((evt, xhr, opt) => {
            if(opt && opt.data && opt.data.search && ~opt.data.search(pattern)) {
                if(!xhr || !xhr.responseText || !xhr.responseText.length) {
                    return
                }
                const responseData = JSON.parse(xhr.responseText)
                if(!responseData || !responseData.success) {
                    return
                }
                return callback(responseData, opt, xhr, evt)
            }
        })
    }

    static lsGetRaw(key) {
        return localStorage.getItem(key)
    }
    static lsGet(key) {
        return JSON.parse(Helpers.lsGetRaw(key))
    }
    static lsSetRaw(key, value) {
        return localStorage.setItem(key, value)
    }
    static lsSet(key, value) {
        return Helpers.lsSetRaw(key, JSON.stringify(value))
    }
    static lsRm(key) {
        return localStorage.removeItem(key)
    }

    static getWikiLink (name, id, lang) {
        name = name.replaceAll('/', '-')
        name = name.replaceAll('’', '')
        let wikiLink

        if (Helpers.isGH()) {
            wikiLink = `https://harem-battle.club/wiki/Gay-Harem/GH:${name}`
        } else if (Helpers.isHH()) {
            if (lang === 'en') {
                wikiLink = `https://harem-battle.club/wiki/Harem-Heroes/HH:${name}`
            } else {
                wikiLink = `http://hentaiheroes.go.yj.fr/?id=${id}`
            }
        }
        // undefined if doesn't have a wiki, will include link to the spreadsheet elsewhere
        return wikiLink
    }

    static getAwakeningThreshold () {
        const {girls_requirement_amount, high_level_girl_owned, awakening_requirements} = window
        let awakeningThreshold
        let currentThreshold
        let currentThresholdOwned
        let currentThresholdMin
        let awakeningLevel

        if (girls_requirement_amount) {
            const thresholds = Object.keys(girls_requirement_amount)
            currentThreshold = thresholds.find(threshold => girls_requirement_amount[threshold] > high_level_girl_owned[threshold])
            if (currentThreshold) {
                currentThresholdOwned = high_level_girl_owned[currentThreshold]
                currentThresholdMin = girls_requirement_amount[currentThreshold]
            }
        } else if (awakening_requirements) {
            const thresholdIndex = awakening_requirements.findIndex(({girls_required}, i) => girls_required > high_level_girl_owned[i])
            if (thresholdIndex > 0) {
                currentThreshold = awakening_requirements[thresholdIndex-1].cap_level
                currentThresholdOwned = high_level_girl_owned[thresholdIndex]
                currentThresholdMin = awakening_requirements[thresholdIndex].girls_required
                awakeningLevel = thresholdIndex
            }
        }

        if (currentThreshold) {
            awakeningThreshold = {
                currentThreshold,
                currentThresholdOwned,
                currentThresholdMin,
                awakeningLevel
            }
        }
        return awakeningThreshold
    }

    static defer (callback) {
        deferred.push(callback)
    }

    static runDeferred () {
        $(document).ready(() => {
            // temp fix for style load order issues
            $('style.script-styles').parent().eq(0).append($('style.script-styles'))

            deferred.forEach(callback => {
                try {
                    callback()
                } catch (e) {
                    console.error('Error in deferred function', e)
                }
            })

            deferred.splice(0, deferred.length)
        })
    }

    static doWhenSelectorAvailable (selector, callback) {
        if ($(selector).length) {
            callback()
        } else {
            const observer = new MutationObserver(() => {
                if ($(selector).length) {
                    observer.disconnect()
                    callback()
                }
            })
            observer.observe(document.documentElement, {childList: true, subtree: true})
        }
    }

    static isInClub () {
        return window.Chat_vars && (window.Chat_vars.CLUB_ID || (window.Chat_vars.CLUB_INFO && window.Chat_vars.CLUB_INFO.id_club))
    }

    static getHref (url) {
        if (Helpers.getPlatform() === 'nutaku' && (url.includes(Helpers.getHost()) ||  !url.includes("http")) && !url.includes("sess=")) {
            const {PLATFORM_SESS} = window
            const searchParams = new URLSearchParams(window.location.search)
            const sess = typeof PLATFORM_SESS === "string" ?  PLATFORM_SESS : searchParams.get("sess")

            if (sess) {
                return url.includes('?') ? `${url}&sess=${sess}` : `${url}?sess=${sess}`
            }
        }

        return url
    }

    static calculateGirlStats (girl, sum=true) {
        const {caracs, rarity, level, graded, equips, class: g_class, skills} = girl
        const blessings = Helpers.lsGet(lsKeys.BLESSINGS) || {}
        const blessing_bonuses = blessings?.current?.blessings?.map(({key, value, bonus}) => girl?.[key] === value ? bonus : 0) || []

        const stats = caracs.map((carac, index) => {
            const from_equips = equips?.reduce((a, equip) => a+equip.caracs[`carac${index+1}`], 0) || 0
            const skills_flat = skills?.[index+1 === g_class ? 3 : 5]?.flat_value || 0

            let carac_stat = carac/10 * (level || 1) * (1 + 0.3*(graded || 0)) + from_equips + skills_flat
            if (index+1 === g_class && skills?.[4]) {
                carac_stat *= 1 + skills[4].percentage_value/100
            }

            return blessing_bonuses.reduce((a, bonus) => a*(1 + bonus/100), carac_stat)
        })
        return sum ? stats.reduce((a,b) => a+b) : stats
        // what to do if no base caracs found...
        const baseSum = caracs?.reduce((a, b) => a+b, 0) || DEFAULT_BASE_SUM[rarity] || 100
        return baseSum * (level || 1) * (10 + 3*(graded || 0))
    }
}

export default Helpers
window.HHPlusPlus.Helpers = Helpers

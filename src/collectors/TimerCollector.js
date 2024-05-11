import { lsKeys } from '../common/Constants'
import Helpers from '../common/Helpers'

const defaultTimes = {
    pop: 0,
    popDuration: 0,
    champs: {},
    clubChamp: 0,
    gp: 0,
}

const loadTimes = () => {
    return Helpers.lsGet(lsKeys.TRACKED_TIMES) || defaultTimes
}

const saveTimes = (times) => {
    Helpers.lsSet(lsKeys.TRACKED_TIMES, times)
}

class TimerCollector {
    static collect() {
        Helpers.defer(() => {
            if (Helpers.isCurrentPage('activities')) {
                TimerCollector.collectPoPTime()
            }
            if (Helpers.isCurrentPage('pachinko')) {
                TimerCollector.collectPachinkoTime()
                TimerCollector.collectRealtimePachinkoUpdateFromAjax()
            }
            if (Helpers.isCurrentPage('club-champion') || Helpers.isCurrentPage('clubs')) {
                TimerCollector.collectClubChampionTime()
                TimerCollector.collectRealtimeClubChampionUpdateFromAjax()
            }
            if (Helpers.isCurrentPage('champions-map')) {
                TimerCollector.collectChampionTimesFromMap()
            }
            if (Helpers.isCurrentPage('champions/')) {
                TimerCollector.collectChampionTime()
                TimerCollector.collectRealtimeChampionUpdateFromAjax()
            }
        })
    }

    static collectPoPTime() {
        const times = loadTimes()

        const {server_now_ts, pop_data} = window
        if (!pop_data) {return}

        const endingsIn = Object.values(pop_data)
            .map(({remaining_time, time_to_finish})=>({endAt: parseInt(remaining_time), duration: parseInt(time_to_finish)}))
            .filter(({endAt})=>endAt)
            .sort((a,b)=>a.endAt > b.endAt?1:-1)

        const soonest = endingsIn[0] || {endAt:0,duration:0}

        times.pop = server_now_ts + soonest.endAt
        times.popDuration = soonest.duration

        saveTimes(times)
    }

    static collectPachinkoTime() {
        const times = loadTimes()

        const {server_now_ts, pachinkoVar} = window
        const {next_game} = pachinkoVar

        if (next_game <= 86400) {// (Old behavior) When updated in real time, it's set to a full millisecond timestamp instead of seconds until...
            times.gp = server_now_ts + next_game
        }

        saveTimes(times)
    }
    static collectRealtimePachinkoUpdateFromAjax() {
        Helpers.onAjaxResponse(/action=play/, (response, opt) => {
            if (response.success) {
                const searchParams = new URLSearchParams(opt.data)
                const {pachinkoDef} = window
                const type = pachinkoDef.find(o => o.id == searchParams.get('what').slice(-1)).type
                const games = searchParams.get('how_many')

                if (type == 'great' && games == 1 && response.next_game) {
                    const times = loadTimes()
                    
                    times.gp = Math.round(new Date().getTime()/1000) + response.next_game

                    saveTimes(times)
                }
            }
        })
    }

    static collectClubChampionTime () {
        const times = loadTimes()

        const {championData, club_champion_data, server_now_ts} = window;

        [championData, club_champion_data].forEach(data => {
            if (data && data.timers && (data.timers.teamRest || data.timers.championRest)) {
                times.clubChamp = server_now_ts + parseInt(data.timers.teamRest || data.timers.championRest)
            }
        })

        saveTimes(times)
    }
    static collectRealtimeClubChampionUpdateFromAjax() {
        Helpers.onAjaxResponse(/battle_type=club_champion/, (response) => {
            if (!response.success) {return}

            const times = loadTimes()
            const {server_now_ts} = window

            if (response.final.attacker_ego > 0) {
                times.clubChamp = server_now_ts + (24*60*60)
            } else {
                times.clubChamp = server_now_ts + (15*60)
            }

            saveTimes(times)
        })
    }

    static collectChampionTimesFromMap () {
        const times = loadTimes()
        const {server_now_ts} = window
        const idExtractRegex = /champions\/(?<id>\d+)/

        $('a.champion-lair').each((i, el) => {
            const $el = $(el)
            const href = $el.attr('href')
            const matches = href.match(idExtractRegex)
            if (!matches || !matches.groups) {return}
            const {groups: {id}} = matches
            const $timer = $el.find('.champion-rest-timer')
            const time = $timer.length ? parseInt($timer.attr('data-time')) : 0

            const champ = {
                available: times.champs[id] ? times.champs[id].available : time < 15*60
            }
            if (time > 0) {
                champ.time = server_now_ts + time
            }

            times.champs[id] = champ
        })

        saveTimes(times)
    }
    static collectChampionTime () {
        const times = loadTimes()

        const {championData, server_now_ts} = window

        if (championData && championData.timers && championData.timers && !Array.isArray(championData.timers)) {
            const {champion: {id}, timers: {teamRest, championRest}} = championData
            const champ = {
                available: !championRest
            }

            if (teamRest) {
                champ.time = server_now_ts + parseInt(teamRest)
            } else if (championRest) {
                champ.time = server_now_ts + parseInt(championRest)
            }

            times.champs[id] = champ
        }

        saveTimes(times)
    }
    static collectRealtimeChampionUpdateFromAjax() {
        Helpers.onAjaxResponse(/battle_type=champion/, (response) => {
            if (!response.success) {return}

            const times = loadTimes()
            const {server_now_ts} = window
            const {defender: {id}, final: {attacker_ego}} = response

            times.champs[id] = {
                available: !(attacker_ego > 0),
                time: server_now_ts + (attacker_ego > 0 ? (24*60*60) : (15*60))
            }

            saveTimes(times)
        })
    }
}

export default TimerCollector

import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import CoreModule from '../CoreModule'

const MODULE_KEY = 'battleEndstate'
class BattleEndstateModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
    }

    shouldRun () {
        return Helpers.isCurrentPage('battle') && !Helpers.isCurrentPage('pre-battle')
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        Helpers.onAjaxResponse(/action=do_battles_(leagues|seasons|troll|pantheon|boss_bang)/i, (respBattleData) => {
            //We already spent some combativity, let's show this to the player:
            if (~location.search.search(/number_of_battles=\d+/i)) {
                const nBattlesCount = parseInt(location.search.match(/number_of_battles=(\d+)/i)[1], 10)
                if ($.isNumeric(nBattlesCount)) {
                    const {shared: {Hero}} = window
                    if (Helpers.isCurrentPage('troll-battle')) {
                        Hero.update('energy_fight', Hero.energies.fight.amount - nBattlesCount, false)
                    }
                    if (Helpers.isCurrentPage('season-battle')) {
                        Hero.update('energy_kiss', Hero.energies.kiss.amount - nBattlesCount, false)
                    }
                    if (Helpers.isCurrentPage('league-battle')) {
                        Hero.update('energy_challenge', Hero.energies.challenge.amount - nBattlesCount, false)
                    }
                    if (Helpers.isCurrentPage('pantheon-battle')) {
                        Hero.update('energy_worship', Hero.energies.worship.amount - nBattlesCount, false)
                    }
                }
            }

            const arrRounds = respBattleData.rounds

            const nPlayerInitialEgo = $('.new-battle-player .new-battle-hero-ego-value').data('total-ego')
            const nOpponentInitialEgo = $('.new-battle-opponent .new-battle-hero-ego-value').data('total-ego')
            let nPlayerFinalEgo = 0
            let nOpponentFinalEgo = 0

            const nRoundsLen = arrRounds.length
            if (nRoundsLen >= 2) {
                let arrLastRounds = [arrRounds[nRoundsLen - 2], arrRounds[nRoundsLen - 1]]
                if (!arrLastRounds[1].opponent_hit) {
                    nPlayerFinalEgo = arrLastRounds[0].opponent_hit.defender.remaining_ego
                    nOpponentFinalEgo = arrLastRounds[1].hero_hit.defender.remaining_ego
                } else if (!arrLastRounds[1].hero_hit) {
                    nPlayerFinalEgo = arrLastRounds[1].opponent_hit.defender.remaining_ego
                    nOpponentFinalEgo = arrLastRounds[0].hero_hit.defender.remaining_ego
                } else {
                    nPlayerFinalEgo = arrRounds[nRoundsLen - 1].opponent_hit.defender.remaining_ego
                    nOpponentFinalEgo = arrRounds[nRoundsLen - 1].hero_hit.defender.remaining_ego
                }
            } else {
                if (nRoundsLen === 1) {
                    if (!arrRounds[0].opponent_hit) {
                        nPlayerFinalEgo = nPlayerInitialEgo
                        nOpponentFinalEgo = arrRounds[0].hero_hit.defender.remaining_ego
                    } else if (!arrRounds[0].hero_hit) {
                        nPlayerFinalEgo = arrRounds[0].opponent_hit.defender.remaining_ego
                        nOpponentFinalEgo = nOpponentInitialEgo
                    } else {
                        nPlayerFinalEgo = arrRounds[0].opponent_hit.defender.remaining_ego
                        nOpponentFinalEgo = arrRounds[0].hero_hit.defender.remaining_ego
                    }
                } else {
                    throw new Error('incorrect amount of rounds')
                }
            }

            $('#new-battle-skip-btn').on('click', function() {
                const {GT} = window
                const $playerBar = $('.new-battle-player .new-battle-hero-ego-initial-bar')
                const $playerDamageBar = $('.new-battle-player .new-battle-hero-ego-damage-bar')
                const $playerHealBar = $('.new-battle-player .new-battle-hero-ego-heal-bar')
                const $opponentBar = $('.new-battle-opponent .new-battle-hero-ego-initial-bar')
                const $opponentDamageBar = $('.new-battle-opponent .new-battle-hero-ego-damage-bar')
                const $opponentHealBar = $('.new-battle-opponent .new-battle-hero-ego-heal-bar')

                const $playerEgo = $('.new-battle-player .new-battle-hero-ego-value')
                const $opponentEgo = $('.new-battle-opponent .new-battle-hero-ego-value')
                const $playerDamageDone = $('.new-battle-opponent .new-battle-hero-damage-taken-text')
                const $opponentDamageDone = $('.new-battle-player .new-battle-hero-damage-taken-text')
                const $criticalDamageIndicator = $('.new-battle-hero-container .new-battle-hero-critical-text')

                $playerDamageDone.css('opacity', '0')
                $opponentDamageDone.css('opacity', '0')
                $criticalDamageIndicator.css('opacity', '0')
                $playerHealBar.css('opacity', '0')
                $opponentHealBar.css('opacity', '0')

                const strPlayerCurEgo = $playerEgo.text().split(GT.ego)[1].replace(/[, ]/g, '')
                let nPlayerCurEgo = nPlayerInitialEgo
                if ($.isNumeric(strPlayerCurEgo)) {
                    nPlayerCurEgo = parseInt(strPlayerCurEgo)
                }
                const strOpponentCurEgo = $opponentEgo.text().split(GT.ego)[1].replace(/[, ]/g, '')
                let nOpponentCurEgo = nOpponentInitialEgo
                if ($.isNumeric(strOpponentCurEgo)) {
                    nOpponentCurEgo = parseInt(strOpponentCurEgo)
                }
                const nPlayerCompleteAtk = nOpponentCurEgo - nOpponentFinalEgo
                const nOpponentCompleteAtk = nPlayerCurEgo - nPlayerFinalEgo
                $playerDamageDone.text(nPlayerCompleteAtk.toString())
                $opponentDamageDone.text(nOpponentCompleteAtk.toString())

                const fPlayerEgoBarWidth = nPlayerFinalEgo <= 0 ? 0 : nPlayerFinalEgo / nPlayerInitialEgo * 100.0
                const fOpponentEgoBarWidth = nOpponentFinalEgo <= 0 ? 0 : nOpponentFinalEgo / nOpponentInitialEgo * 100.0

                const arrPlayerAnimationSequence = [
                    {e: $playerBar, p: {width: fPlayerEgoBarWidth.toFixed(2) + '%'}, o: {duration: 200}},
                    {e: $playerDamageBar, p: {width: fPlayerEgoBarWidth.toFixed(2) + '%'}, o: {duration: 200}},
                    {e: $playerDamageDone, p: {opacity: [0, 1], translateY: -20, translateZ: 0}, o: {
                            duration: 300,
                            sequenceQueue: false,
                            complete: function(elm) {
                                $playerEgo.text(GT.ego + ' ' + nPlayerFinalEgo.toString())
                                $(elm).velocity({translateY: 0}, 0)
                            }
                        }
                    }
                ]
                const arrOpponentAnimationSequence = [
                    {e: $opponentBar, p: {width: fOpponentEgoBarWidth.toFixed(2) + '%'}, o: {duration: 200}},
                    {e: $opponentDamageBar, p: {width: fOpponentEgoBarWidth.toFixed(2) + '%'}, o: {duration: 200}},
                    {e: $opponentDamageDone, p: {opacity: [0, 1], translateY: -20, translateZ: 0}, o: {
                            duration: 300,
                            sequenceQueue: false,
                            complete: function(elm) {
                                $opponentEgo.text(GT.ego + ' ' + nOpponentFinalEgo.toString())
                                $(elm).velocity({translateY: 0}, 0)
                            }
                        }
                    }
                ]

                $('.velocity-animating').velocity('stop', true)
                //FIX LATTER IDK
                // setRounds([])
                $.Velocity.RunSequence(arrPlayerAnimationSequence)
                $.Velocity.RunSequence(arrOpponentAnimationSequence)
            })
            $('#new-battle-skip-btn').show()
        })

        this.hasRun = true
    }
}

export default BattleEndstateModule

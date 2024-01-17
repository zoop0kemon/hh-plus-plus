import { lsKeys } from '../common/Constants'
import Helpers from '../common/Helpers'

class SidequestStatusCollector {
    static collect () {
        SidequestStatusCollector.init()
        if (Helpers.isCurrentPage('side-quests')) {
            Helpers.defer(SidequestStatusCollector.collectFromSidequests)
        } else if (Helpers.isCurrentPage('home')) {
            Helpers.defer(SidequestStatusCollector.collectFromHome)
        } else if (Helpers.isCurrentPage('quest')) {
            Helpers.defer(() => {
                const sidequestStatus = Helpers.lsGet(lsKeys.SIDEQUEST_STATUS)
                if (sidequestStatus && sidequestStatus.continueLink && Helpers.isCurrentPage(sidequestStatus.continueLink)) {
                    SidequestStatusCollector.collectFromActiveSidequest(sidequestStatus)
                }
            })
        }
    }

    static init() {
        const sidequestStatus = Helpers.lsGet(lsKeys.SIDEQUEST_STATUS)
        if (!sidequestStatus) {
            Helpers.lsSet(lsKeys.SIDEQUEST_STATUS, {energySpendAvailable: true})
        }
    }

    static collectFromSidequests () {
        const {quests_data} = window
        let energySpendAvailable = false
        let continueLink
        const availableQuest = quests_data.find(quest => quest.rewards.rewards ? quest.rewards.rewards.find(({type})=>type==='xp') : false)
        if (availableQuest) {
            energySpendAvailable = true
            continueLink = `/quest/${availableQuest.id_quest}`
        }

        Helpers.lsSet(lsKeys.SIDEQUEST_STATUS, {energySpendAvailable, continueLink})
    }

    static collectFromActiveSidequest (sidequestStatus) {
        const checkAtEnd = () => {
            const $controls = $('#controls')
            if ($controls.find('#end_play').length || $controls.find('#archive-back').length || $controls.find('#archive-next').length) {
                sidequestStatus.continueLink = null
                Helpers.lsSet(lsKeys.SIDEQUEST_STATUS, sidequestStatus)
            }
        }

        checkAtEnd()
        new MutationObserver(checkAtEnd).observe(document.getElementById('controls'), {childList: true})
    }

    static collectFromHome () {
        const {notificationData} = window
        if (notificationData.map) {
            const sidequestStatus = Helpers.lsGet(lsKeys.SIDEQUEST_STATUS)
            if (sidequestStatus && !sidequestStatus.energySpendAvailable) {
                sidequestStatus.energySpendAvailable = true
                Helpers.lsSet(lsKeys.SIDEQUEST_STATUS, sidequestStatus)
            }
        }

        Helpers.doWhenSelectorAvailable('.continue-quest-container', () => {
            if (!$('.continue_side_quest_home').length) {
                Helpers.lsSet(lsKeys.SIDEQUEST_STATUS, {energySpendAvailable: false})
            }
        })
    }
}

export default SidequestStatusCollector

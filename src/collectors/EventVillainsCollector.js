import { lsKeys } from '../common/Constants'
import Helpers from '../common/Helpers'

class EventVillainsCollector {
    static collect() {
        Helpers.defer(() => {
            EventVillainsCollector.clean()
            if (Helpers.hasSearch('tab=event')) {
                EventVillainsCollector.collectFromEvent(lsKeys.EVENT_TIME, lsKeys.EVENT_VILLAINS)
            }
            if (Helpers.hasSearch('tab=mythic_event')) {
                EventVillainsCollector.collectFromEvent(lsKeys.MYTHIC_EVENT_TIME, lsKeys.MYTHIC_EVENT_VILLAINS)
            }
        })
    }

    static clean() {
        const {server_now_ts} = window
        const eventEndTime = parseInt(Helpers.lsGetRaw(lsKeys.EVENT_TIME)) || 0
        const mythicEventEndTime = parseInt(Helpers.lsGetRaw(lsKeys.MYTHIC_EVENT_TIME)) || 0

        const now = server_now_ts
        if (now > eventEndTime) {
            Helpers.lsRm(lsKeys.EVENT_VILLAINS)
            Helpers.lsRm(lsKeys.EVENT_TIME)
        }

        if (now > mythicEventEndTime) {
            Helpers.lsRm(lsKeys.MYTHIC_EVENT_VILLAINS)
            Helpers.lsRm(lsKeys.MYTHIC_EVENT_TIME)
        }
    }

    static collectFromEvent(eventTimeKey, eventVillainsKey) {
        const {event_girls, id_event, event_data: {seconds_until_event_end}, server_now_ts} = window
        const eventEndTime = server_now_ts + seconds_until_event_end
        Helpers.lsSetRaw(eventTimeKey, eventEndTime)

        const eventTrolls = []
        event_girls.forEach(girl => {
            const {id_girl: id, source, source_list, rarity} = girl
            const cur_source = source_list?.event_troll?.find(event => event.group.id == id_event) || source
            if (cur_source.name !== 'event_troll') {return}

            const sourceUrl = cur_source.anchor_source.url
            const matches = sourceUrl.match(/id_opponent=([0-9]+)/)
            if (matches) {
                const troll = matches[1]
                eventTrolls.push({id: `${id}`, troll, rarity})
            }
        })
        Helpers.lsSet(eventVillainsKey, eventTrolls)
    }
}

export default EventVillainsCollector

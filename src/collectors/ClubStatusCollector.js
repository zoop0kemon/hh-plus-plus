import { lsKeys } from '../common/Constants'
import Helpers from '../common/Helpers'

class ClubStatusCollector {
    static collect() {
        Helpers.defer(() => {
            if (Helpers.isCurrentPage('clubs') && window.members_list) {
                const {upgrades_information: {upgrades}, members_list} = window
                const clubStatus = {
                    upgrades,
                    memberIds: members_list.map(({id_member}) => id_member)
                }

                Helpers.lsSet(lsKeys.CLUB_STATUS, clubStatus)
            }
        })
    }
}

export default ClubStatusCollector

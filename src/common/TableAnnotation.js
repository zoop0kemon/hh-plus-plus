import Helpers from './Helpers'

class TableAnnotation {
    static run () {
        Helpers.onAjaxResponse(/action=leaderboard/, (response, opt) => {
            const {leaderboard} = response
            const searchParams = new URLSearchParams(opt.data)
            const feature = searchParams.get('feature')

            switch (feature) {
            case 'path_of_valor':
                TableAnnotation.annotateTable('#pov_leaderboard_tab_container #leaderboard_list', leaderboard)
                break
            case 'path_of_glory':
                TableAnnotation.annotateTable('#pog_leaderboard_tab_container #leaderboard_list', leaderboard)
                break
            case 'seasonal_event_percent':
                break
            default:
                TableAnnotation.annotateTable('#leaderboard_list', leaderboard)
            }
        })
    }

    static annotateTable (selector, leaderboard) {
        Helpers.doWhenSelectorAvailable(`${selector} .leaderboard_row`, () => {
            const $leaderboardList = $(selector)

            $leaderboardList.find('.leaderboard_row:not(.build-at-bottom)').each((i, el) => {
                $(el).attr('sorting_id', leaderboard[i].id_member)
            })

            $(document).trigger('leaderboard-annotated', {selector})
        })
    }
}

export default TableAnnotation

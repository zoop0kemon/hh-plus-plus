import Helpers from '../../common/Helpers'
import EquipHelpers from './EquipHelpers'
import FavouritesManager from './FavouritesManager'

const SLOT_CONTAINER_WIDTH = 106 // 90px width + 1rem right margin

class EquipManager {

    constructor($container, name, skipFilter) {
        this.$container = $container
        this.managedEquips = {}
        this.allEquipIdsInOrder = []
        this.visibleEquipIds = []
        this.favouriteKeys = {}
        this.elementCache = {}
        this.keysForIds = {}
        this.name = name
        this.skipFilter = skipFilter

        this.activeFilter = {
            subtype: EquipHelpers.filterDefault,
            rarity: EquipHelpers.filterDefault,
            stats: EquipHelpers.filterDefault,
            favourites: EquipHelpers.filterDefault,
            resonance_class: EquipHelpers.filterDefault,
            resonance_class_bonus: EquipHelpers.filterDefault,
            resonance_theme: EquipHelpers.filterDefault,
            resonance_theme_bonus: EquipHelpers.filterDefault
        }
    }

    get $content() {
        return this.$container.find('.player-inventory-content, .items-container')
    }

    init() {
        const { materials_items, player_inventory } = window

        const initialArmor = materials_items || player_inventory.armor

        initialArmor.forEach(armor => {
            const equipKey = EquipHelpers.makeEquipKey(armor)

            this.managedEquips[equipKey] = armor
            this.allEquipIdsInOrder.push(equipKey)
            this.visibleEquipIds.push(equipKey)
        })

        this.$favouriteToggle = $('<div class="favourite-toggle"></div>')
        this.favouriteToggleCallback = (e) => {
            const $slot = $(e.target).parent()
            const equipKey = `${$slot.data('equip-key')}`
            const favouriteKey = this.favouriteKeys[equipKey]
            const isFavourite = JSON.parse($slot.attr('data-is-favourite'))

            if (isFavourite) {
                FavouritesManager.removeFromFavourites(favouriteKey)
            } else {
                FavouritesManager.addToFavourites(favouriteKey)
            }
            // this.updateVisibleIdsForFilter()
            // this.reconcileElements()
        }

        if (this.$content.length && this.$content.children('div').length) {
            this.annotateEquipsWithKeys()
            this.annotateEquipsWithFavourites()
            this.checkSelection()
            this.setupHooks()
        } else {
            const observer = new MutationObserver(() => {
                if (this.$content.children('div').length) {
                    this.annotateEquipsWithKeys()
                    this.annotateEquipsWithFavourites()
                    this.checkSelection()
                    this.setupHooks()
                    observer.disconnect()
                }
            })
            observer.observe(this.$container[0], { childList: true, subtree: true })
        }

        if (!this.skipFilter) {
            this.attachFilterButtonAndPanel()
        }
    }

    setupHooks() {
        Helpers.onAjaxResponse(/action=market_equip_armor/, (response) => {
            const { unequipped_armor } = response
            const equipped_armor = $('#my-hero-equipement-tab-container .slot.selected').data('d')

            const idToRemove = EquipHelpers.makeEquipKey(equipped_armor)
            const idToAdd = EquipHelpers.makeEquipKey(unequipped_armor)
            const favouriteKeyToAdd = EquipHelpers.makeFavouriteKey(unequipped_armor)

            const lists = [this.allEquipIdsInOrder, this.visibleEquipIds]
            lists.forEach(list => {
                const indexToRemove = list.indexOf(idToRemove)
                if (indexToRemove > -1) {
                    list.splice(indexToRemove, 1)
                }
            })
            this.allEquipIdsInOrder.splice(0, 0, idToAdd)
            if (EquipHelpers.keyMatchesFilter(idToAdd, favouriteKeyToAdd, this.activeFilter)) {
                this.visibleEquipIds.splice(0, 0, idToAdd)
            }

            this.managedEquips[idToAdd] = unequipped_armor
            this.favouriteKeys[idToAdd] = favouriteKeyToAdd
            this.keysForIds[unequipped_armor.id_member_armor] = idToAdd

            this.reconsileAfterNextDOMChange()
        })
        const collectFromLazyLoad = (response, annotateOnly) => {
            const { items } = response

            if (!items || !items.length) { return }

            items.forEach(item => {
                const key = EquipHelpers.makeEquipKey(item)
                const favouriteKey = EquipHelpers.makeFavouriteKey(item)

                this.managedEquips[key] = item
                this.allEquipIdsInOrder.push(key)
                if (EquipHelpers.keyMatchesFilter(key, favouriteKey, this.activeFilter)) {
                    this.visibleEquipIds.push(key)
                }
                this.favouriteKeys[key] = favouriteKey

                this.keysForIds[item.id_member_armor] = key
            })

            this.reconsileAfterNextDOMChange(null, annotateOnly)
        }
        Helpers.onAjaxResponse(/action=market_get_armor/, (response) => collectFromLazyLoad(response, false))
        Helpers.onAjaxResponse(/action=mythic_armor_load_material_items/, (response) => collectFromLazyLoad(response, true))

        Helpers.onAjaxResponse(/action=market_sell/, (response, opt) => {
            const searchParams = new URLSearchParams(opt.data)
            const mappedParams = ['type', 'id_item'].map(key => ({ [key]: searchParams.get(key) })).reduce((a, b) => Object.assign(a, b), {})
            const { type, id_item } = mappedParams

            if (!type === 'armor') { return }

            const key = this.keysForIds[id_item]

            const lists = [this.allEquipIdsInOrder, this.visibleEquipIds]

            lists.forEach(list => {
                const idx = list.indexOf(key)
                if (idx > 0) {
                    list.splice(idx, 1)
                }
            })
            delete this.elementCache[key]

            // this.reconsileAfterNextDOMChange()
            this.doAfterNextDOMChange(() => this.padWithEmptySlots())

        })
        Helpers.onAjaxResponse(/action=market_buy/, (response, opt) => {
            const searchParams = new URLSearchParams(opt.data)
            const mappedParams = ['type', 'id_item'].map(key => ({ [key]: searchParams.get(key) })).reduce((a, b) => Object.assign(a, b), {})
            const { type } = mappedParams
            const { item_ids } = response

            if (!type === 'armor') { return }

            const $slotsToRemove = []

            Object.entries(item_ids).forEach(([index, id_item]) => {
                let $slot = $(`[id_item="${id_item}]`)
                if (!$slot.length) {
                    $('[id_item="null"]').each((i, el) => {
                        const item = $(el).data('d')
                        if (item && `${item.index}` === index) {
                            $slot = $(el)
                            return false
                        }
                    })
                }
                if ($slot.length) {
                    const data = $slot.data('d')
                    if (!data.id_member_armor) {
                        data.id_member_armor = id_item
                        data.id_member = window.Hero.infos.id
                        $slotsToRemove.push($slot)
                    }
                    const key = EquipHelpers.makeEquipKey(data)
                    const favouriteKey = EquipHelpers.makeFavouriteKey(data)

                    this.managedEquips[key] = data
                    this.allEquipIdsInOrder.splice(0, 0, key)
                    if (EquipHelpers.keyMatchesFilter(key, favouriteKey, this.activeFilter)) {
                        this.visibleEquipIds.splice(0, 0, key)
                    }
                    this.favouriteKeys[key] = favouriteKey

                    this.keysForIds[data.id_member_armor] = key
                }
            })

            this.reconsileAfterNextDOMChange(() => {
                $slotsToRemove.forEach($slot => {
                    const $parent = $slot.parent()
                    const $grandparent = $parent.parent()

                    $parent.detach()
                    $grandparent.append('<div class="slot-container empty"><div class="slot empty"></div></div>')
                })
            })
        })

        new MutationObserver(() => {
            this.reconcileElements(this.name === 'upgrade')
            this.checkSelection()
        }).observe(this.$content[0], { subtree: true, attributes: true, attributeFilter: ['class'] })

        FavouritesManager.onUpdate(() => {
            this.updateVisibleIdsForFilter()
            this.reconcileElements(this.name === 'upgrade')
            this.checkSelection()
        })

        if (this.name === 'upgrade') {
            const $upgradeButton = this.$container.find('button#level-up')
            new MutationObserver(() => {
                const disabled = $upgradeButton.prop('disabled')
                if (disabled) { return }

                if (this.$container.find('.selected [data-is-favourite=true]').length) {
                    $upgradeButton.prop('disabled', true)
                }
            }).observe($upgradeButton[0], { attributes: true, attributeFilter: ['disabled'] })
        }
    }

    reconsileAfterNextDOMChange(extraCallback, annotateOnly) {
        this.doAfterNextDOMChange(extraCallback, () => this.reconcileElements(annotateOnly))
    }

    doAfterNextDOMChange(...callbacks) {
        const observer = new MutationObserver(() => {
            if (this.$content.children('.slot-container, .item-container').length) {
                callbacks.forEach(callback => {
                    if (callback && typeof callback === 'function') {
                        callback()
                    }
                })
                observer.disconnect()
            }
        })
        observer.observe(this.$content[0], { childList: true })
    }

    attachFilterButtonAndPanel() {
        const $btn = EquipHelpers.createFilterBtn()
        const $panel = EquipHelpers.createFilterBox(this.name)

        this.$container.append($btn).append($panel)

        $btn.click(() => { $panel.find('.equip_filter_box').toggle() })

        $panel.find('input').each((i, input) => {
            $(input).change((e) => {
                const { value, name } = e.target
                this.activeFilter[name.replace(`${this.name}-`, '')] = value
                this.updateVisibleIdsForFilter()
                this.reconcileElements()
            })
        })
    }

    updateVisibleIdsForFilter() {
        this.visibleEquipIds = this.allEquipIdsInOrder.filter(key => EquipHelpers.keyMatchesFilter(key, this.favouriteKeys[key], this.activeFilter))
    }

    annotateEquipsWithKeys() {
        let changed = false
        this.$container.find('.slot:not(.empty)').each((i, slot) => {
            const $slot = $(slot)

            const { changed: equipChanged } = this.assertEquipAnnotatedWithKey($slot)

            changed |= equipChanged
        })

        if (changed) {
            $(document).trigger('market:equips-annotated')
        }
    }

    assertEquipAnnotatedWithKey($slot) {
        let key = $slot.attr('data-equip-key')
        let changed
        if (!key) {
            const data = $slot.data('d')
            if (!data.id_member_armor) {
                data.id_member_armor = data.id_item
            }
            key = EquipHelpers.makeEquipKey(data)
            const favouriteKey = EquipHelpers.makeFavouriteKey(data)
            $slot.attr('data-equip-key', key)
            this.favouriteKeys[key] = favouriteKey
            this.keysForIds[data.id_member_armor] = key
            changed = true
        }
        return {
            key,
            changed
        }
    }

    annotateEquipsWithFavourites() {
        this.updateFavouritesAnnotationsForKeys(this.visibleEquipIds)
    }

    updateFavouritesAnnotationsForKeys(keys) {
        const favouriteKeys = keys.map(key => ({ [key]: this.favouriteKeys[key] })).reduce((a, b) => Object.assign(a, b), {})
        const favouritesStatus = FavouritesManager.areFavourites(Object.values(favouriteKeys))

        keys.forEach(key => {
            const favouriteKey = favouriteKeys[key]
            const isFavourite = favouritesStatus[favouriteKey]
            const $equip = this.$forKey(key)

            $equip.attr('data-is-favourite', isFavourite)

            const $existingFavouriteToggle = $equip.find('.favourite-toggle')
            if (!$existingFavouriteToggle.length) {
                const $toggle = this.$favouriteToggle.clone()
                $equip.prepend($toggle)
                $toggle.click(this.favouriteToggleCallback)
            }
        })
    }

    $forKey(key) {
        return this.$container.find(`[data-equip-key="${key}"]`)
    }

    reconcileElements(annotateOnly) {
        // const $content = this.$container.find('.player-inventory-content')
        this.$content.find('.slot:not(.empty)').each((i, slot) => {
            const $slot = $(slot)

            const { key } = this.assertEquipAnnotatedWithKey($slot)

            if (!annotateOnly) {
                const $parent = $slot.parent()

                this.elementCache[key] = $parent

                if (!this.visibleEquipIds.includes(key)) {
                    $parent.detach()
                }
            }
        })

        if (!annotateOnly) {
            this.allEquipIdsInOrder.forEach(key => {
                if (!this.visibleEquipIds.includes(key)) { return }
                const $slot = this.elementCache[key]

                if (!$slot || !$slot.length) {
                    console.log('no cache entry for key', key)
                    return
                }

                this.$content.append($slot)
            })

            this.$content.append(this.$content.find('.slot-container.empty'))
            this.padWithEmptySlots()
            this.$content.getNiceScroll().resize()
        }

        this.annotateEquipsWithFavourites()
        this.checkSelection()
    }

    padWithEmptySlots() {
        const rowWidth = this.$content.width()
        const slotsPerRow = Math.round(rowWidth / SLOT_CONTAINER_WIDTH)
        const desiredRows = 4
        const desiredSlots = desiredRows * slotsPerRow
        const currentSlots = this.$content.find('.slot-container').length
        let extraSlots = 0
        if (desiredSlots > currentSlots) {
            extraSlots = desiredSlots - currentSlots
        } else if (desiredSlots < currentSlots && currentSlots % slotsPerRow > 0) {
            const currentEmptySlots = this.$content.find('.slot-container.empty').length
            const nonEmptySlots = this.$content.find('.slot-container:not(.empty)').length
            const lastRowLength = nonEmptySlots % slotsPerRow
            const amountNeededToCompleteRow = (slotsPerRow - lastRowLength) % slotsPerRow

            extraSlots = amountNeededToCompleteRow - currentEmptySlots

            if (currentSlots + extraSlots < desiredSlots) {
                extraSlots += desiredSlots - (currentSlots + extraSlots)
            }
        }

        if (extraSlots > 0) {
            while (extraSlots > 0) {
                this.$content.append('<div class="slot-container empty"><div class="slot empty"></div></div>')
                extraSlots--
            }
        } else if (extraSlots < 0) {
            while (extraSlots < 0) {
                this.$content.find('.slot-container.empty').last().remove()
                extraSlots++
            }
        }
    }

    checkSelection() {
        const $selected = this.$content.find('.slot.selected')

        if (!$selected.length) { return }

        const $sellButton = this.$container.find('button[rel=sell]')
        if (!$sellButton.length) { return }

        if (JSON.parse($selected.attr('data-is-favourite'))) {
            $sellButton.attr('disabled', 'disabled')
        } else {
            $sellButton.removeAttr('disabled')
        }
    }
}

export default EquipManager

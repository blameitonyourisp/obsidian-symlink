import { Setting } from "obsidian"

import { SymlinkSettingListController } from "./List.ts"

import type { SymlinkSettings } from "#types"
import type { Symlink } from "../../main.ts"

class SymlinkSettingDropdownController extends SymlinkSettingListController {
    options!: { value: string, display: string }[]

    constructor(
        { title, description, container, plugin, input, setting, options }: {
            title: string,
            description: string,
            container: HTMLElement,
            plugin: Symlink,
            input: { name: string, description: string }
            setting: keyof Omit<SymlinkSettings, "isWhitelist">,
            options: { value: string, display: string }[]
    }) {
        super({ title, description, container, plugin, input, setting })
        Object.assign(this, { options })
    }

    createController(): HTMLDivElement {
        //
        const wrapper = this.createWrapper()
        this.list = this.createList()
        wrapper.appendChild(this.list)

        //
        for (const pathname of this.plugin.settings[this.setting]) {
            const item = this.createListItem(pathname)
            this.list.appendChild(item)
        }

        //
        this.pathname = this.options[0]?.value
        new Setting(wrapper)
            .setName(this.input.name)
            .setDesc(this.input.description)
            .addDropdown(dropdownComponent => {
                for (const option of this.options) {
                    dropdownComponent.addOption(option.value, option.display)
                }
                dropdownComponent.onChange(dropdownValue => {
                    this.pathname = dropdownValue
                    this.updateButton()
                })
            })
            .addButton(buttonComponent => {
                this.button = buttonComponent
                this.updateButton()
                buttonComponent.setButtonText("Add")
                    .onClick(async () => { await this.mountListItem() })
            })

        return wrapper
    }
}

export { SymlinkSettingDropdownController }
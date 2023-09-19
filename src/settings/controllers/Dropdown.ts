import { Setting } from "obsidian"

import { SymlinkSettingListController } from "./List"

import type { SymlinkSettings } from "../../types"
import type { Symlink } from "../../main"

class SymlinkSettingDropdownController extends SymlinkSettingListController {
    options: { value: string, display: string }[]

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
        // container.appendChild(this.createController())
    }

    createController(): HTMLDivElement {
        //
        const wrapper = this.createWrapper()
        const list = this.createList()
        wrapper.appendChild(list)

        //
        for (const name of this.plugin.settings[this.setting]) {
            const item = this.createListItem(name)
            list.appendChild(item)
        }

        //
        let name = this.options[0]?.value
        new Setting(wrapper)
            .setName(this.input.name)
            .setDesc(this.input.description)
            .addDropdown(dropdown => {
                for (const option of this.options) {
                    dropdown.addOption(option.value, option.display)
                }
                dropdown.onChange(string => name = string)
            })
            .addButton(button => {
                button.setButtonText("Add")
                    .onClick(async () => {
                        await this.mountListItem(name, list)
                    })
            })

        return wrapper
    }
}

export { SymlinkSettingDropdownController }
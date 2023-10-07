// Copyright (c) 2023 James Reid. All rights reserved.
//
// This source code file is licensed under the terms of the MIT license, a copy
// of which may be found in the LICENSE.md file in the root of this repository.
//
// For a template copy of the license see one of the following 3rd party sites:
//      - <https://opensource.org/licenses/MIT>
//      - <https://choosealicense.com/licenses/mit>
//      - <https://spdx.org/licenses/MIT>

/**
 * @file Symlink dropdown settings controller.
 * @author James Reid
 */

// @ts-check

// @@imports-dependencies
import { Setting } from "obsidian"

// @@imports-module
import { SymlinkSettingListController } from "./List.ts"

// @@imports-types
import type { Symlink, SymlinkSettings, SymlinkToggleKeys } from "#types"

// @@body
/**
 *
 */
class SymlinkSettingDropdownController extends SymlinkSettingListController {
    options!: { value: string, display: string }[]

    /**
     *
     * @param param0
     */
    constructor(
        { title, description, container, plugin, input, setting, options }: {
            title: string,
            description: string,
            container: HTMLElement,
            plugin: Symlink,
            input: { name: string, description: string }
            setting: keyof Omit<SymlinkSettings, SymlinkToggleKeys>,
            options: { value: string, display: string }[]
        }
    ) {
        super({ title, description, container, plugin, input, setting })
        Object.assign(this, { options })
    }

    /**
     *
     * @returns
     */
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

// @@exports
export { SymlinkSettingDropdownController }

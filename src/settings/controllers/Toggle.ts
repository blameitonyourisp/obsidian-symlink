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
 * @file Symlink toggle setting controller.
 * @author James Reid
 */

// @ts-check

// @@imports-dependencies
import { Setting } from "obsidian"

// @@imports-module
import { SymlinkSettingController } from "./Base.ts"

// @@imports-types
import type { Symlink, SymlinkSettings, SymlinkToggleKeys } from "#types"

// @@body
/**
 *
 */
class SymlinkSettingToggleController extends SymlinkSettingController {
    input!: { name: string, description: string }
    setting!: keyof Pick<SymlinkSettings, SymlinkToggleKeys>

    /**
     *
     * @param param0
     */
    constructor(
        { title, description, container, plugin, input, setting }: {
            title: string,
            description: string,
            container: HTMLElement,
            plugin: Symlink,
            input: { name: string, description: string }
            setting: keyof Pick<SymlinkSettings, SymlinkToggleKeys>
        }
    ) {
        super({ title, description, container, plugin })
        Object.assign(this, { input, setting })
    }

    /**
     *
     * @returns
     */
    createController(): HTMLDivElement {
        //
        const wrapper = this.createWrapper()

        //
        let isToggled: boolean = this.plugin.settings[this.setting]
        new Setting(wrapper)
            .setName(this.input.name)
            .setDesc(this.input.description)
            .addToggle(toggleComponent => {
                toggleComponent.setValue(isToggled)
                    .onChange(async toggleValue => {
                        isToggled = toggleValue
                        this.plugin.settings[this.setting] = isToggled
                        await this.plugin.saveSettings().then(() => {
                            this.plugin.updateRepos()
                            this.plugin.highlightTree()
                        })
                    })
            })

        return wrapper
    }
}

// @@exports
export { SymlinkSettingToggleController }

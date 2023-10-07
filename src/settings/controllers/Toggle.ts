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
 * Extended settings controller class for viewing and updating toggle settings
 * with an toggle button reflecting the current state of the boolean setting.
 */
class SymlinkSettingToggleController extends SymlinkSettingController {
    // Class properties set in constructor using object assign.
    input!: { name: string, description: string }
    setting!: keyof Pick<SymlinkSettings, SymlinkToggleKeys>

    /**
     * Call super, and assign class properties from provided arguments.
     *
     * @param obj - Class properties required for controller and super.
     * @param obj.title - Title string for rendering controller.
     * @param obj.description - Description string for rendering controller.
     * @param obj.container - Container to append controller to when mounting.
     * @param obj.plugin - Current instance of symlink obsidian plugin.
     * @param obj.input - Name and description shown next to input field.
     * @param obj.setting - Symlink setting key which class instance controls.
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
     * Create toggle setting controller rendering name and description of
     * setting, and a toggle reflecting current state of setting.
     *
     * @returns Div with elements for viewing and updating plugin settings.
     */
    createController(): HTMLDivElement {
        // Initialise returned wrapper with outer title and description values.
        const wrapper = this.createWrapper()

        // Get initial state of toggle.
        let isToggled: boolean = this.plugin.settings[this.setting]

        // Add toggle setting component to controller wrapper.
        new Setting(wrapper)
            .setName(this.input.name) // Set inner name.
            .setDesc(this.input.description) // Set inner description.
            .addToggle(toggleComponent => {
                toggleComponent
                    .setValue(isToggled) // Set initial toggle value.
                    .onChange(async toggleValue => {
                        // Update toggle value locally and in plugin settings.
                        isToggled = toggleValue
                        this.plugin.settings[this.setting] = isToggled

                        // Save plugin settings with updated values, and refresh
                        // plugin repo and file tree state as required.
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

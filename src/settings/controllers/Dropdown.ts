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
 * Extended settings controller class for viewing and updating dropdown settings
 * with a dropdown element, and a list of current settings displayed above the
 * dropdown.
 */
class SymlinkSettingDropdownController extends SymlinkSettingListController {
    // Class properties set in constructor using object assign.
    options!: { value: string, display: string }[]

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
     * @param obj.options - Obsidian dropdown options array for setting values.
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
     * Create dropdown setting controller rendering name and description of
     * setting, a dropdown with available settings, and a list of existing
     * settings above the dropdown.
     *
     * @returns Div with elements for viewing and updating plugin settings.
     */
    createController(): HTMLDivElement {
        // Initialise returned wrapper with outer title and description values,
        // and a list of existing settings.
        const wrapper = this.createWrapper()

        // Get initial path to display in dropdown.
        this.pathname = this.options[0]?.value

        // Add dropdown setting component to controller wrapper.
        new Setting(wrapper)
            .setName(this.input.name) // Set inner name.
            .setDesc(this.input.description) // Set inner description.
            .addDropdown(dropdownComponent => {
                // Add all available options to dropdown input.
                for (const option of this.options) {
                    dropdownComponent.addOption(option.value, option.display)
                }

                // Update pathname and `add` button on each change.
                dropdownComponent.onChange(dropdownValue => {
                    this.pathname = dropdownValue
                    this.updateButton()
                })
            })
            .addButton(buttonComponent => {
                // Save button to class property and update.
                this.button = buttonComponent
                this.updateButton()

                // Add text and onClick callback to mount new list item.
                buttonComponent
                    .setButtonText("Add")
                    .onClick(async () => { await this.mountListItem() })
            })

        return wrapper
    }
}

// @@exports
export { SymlinkSettingDropdownController }

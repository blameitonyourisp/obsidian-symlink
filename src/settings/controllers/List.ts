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
 * @file Symlink list setting controller.
 * @author James Reid
 */

// @ts-check

// @@imports-node
import * as path from "path"

// @@imports-dependencies
import { Setting, setIcon, normalizePath, ButtonComponent } from "obsidian"

// @@imports-module
import { SymlinkSettingController } from "./Base.ts"

// @@imports-types
import type { Symlink, SymlinkSettings, SymlinkToggleKeys } from "#types"

// @@body
/**
 * Extended settings controller class for viewing and updating list settings
 * with an input field and a list of current settings displayed above the input.
 */
class SymlinkSettingListController extends SymlinkSettingController {
    // Class properties set in constructor using object assign.
    input!: { name: string, description: string }
    setting!: keyof Omit<SymlinkSettings, SymlinkToggleKeys>
    settingSet: Set<string>
    list: HTMLDivElement
    // Class properties *not* set in constructor.
    pathname?: string
    button?: ButtonComponent

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
            setting: keyof Omit<SymlinkSettings, SymlinkToggleKeys>
        }
    ) {
        super({ title, description, container, plugin })
        Object.assign(this, { input, setting })

        // Create set from from existing specified user setting array, such that
        // it is easy to check for uniqueness when adding to the array.
        this.settingSet = new Set(this.plugin.settings[this.setting])

        // Create list element for existing added settings, and populate it with
        // generated list item elements from the loaded user settings.
        this.list = this.createList()
        for (const pathname of this.plugin.settings[this.setting]) {
            const item = this.createListItem(pathname)
            this.list.appendChild(item)
        }
    }

    /**
     * Create controller wrapper element with title and description elements,
     * and a list of existing settings.
     *
     * @returns Controller wrapper element.
     */
    createWrapper(): HTMLDivElement {
        // Initialise returned wrapper with outer title and description values.
        const wrapper = super.createWrapper()

        // Append list of existing added settings to wrapper.
        wrapper.appendChild(this.list)

        return wrapper
    }

    /**
     * Create list setting controller rendering name and description of setting,
     * an input field for new settings, and a list of existing settings above
     * the dropdown.
     *
     * @returns Div with elements for viewing and updating plugin settings.
     */
    createController(): HTMLDivElement {
        // Initialise returned wrapper with outer title and description values,
        // and a list of existing settings.
        const wrapper = this.createWrapper()

        // Add list setting component to controller wrapper. See plugin release
        // guidelines, for information on using `normalizePath` function to
        // sanitize use input (see link below).
        // https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
        new Setting(wrapper)
            .setName(this.input.name) // Set inner name.
            .setDesc(this.input.description) // Set inner description.
            .addText(textComponent => {
                textComponent
                    .setPlaceholder("Enter directory name...")
                    .onChange(textValue => {
                        // Update pathname and `add` button on each change. When
                        // `textValue` is <empty string>, reset pathname to
                        // undefined rather than calling `normalizePath` such
                        // that the `getButtonTooltip` method can evaluate the
                        // empty input correctly (`normalizePath` will return
                        // "/" for an empty string, which will not generate the
                        // correct tooltip).
                        this.pathname = textValue
                            ? normalizePath(textValue)
                            : undefined
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

    /**
     * Create wrapper element for list of existing settings.
     *
     * @returns Wrapper element for list of existing settings.
     */
    createList(): HTMLDivElement {
        // Wrapper with symlink class name for adding scoped styles.
        const wrapper = document.createElement("div")
        wrapper.classList.add("symlink-setting-list")

        return wrapper
    }

    /**
     * Create list item element with span of existing setting pathname, and a
     * delete icon for removing each setting from the list and deleting it form
     * the stored plugin settings.
     *
     * @param pathname - Pathname which will be in the span of the list item.
     * @returns List item div.
     */
    createListItem(pathname = this.pathname as string): HTMLDivElement {
        // Span for setting pathname with existing obsidian styled class names.
        const pathnameSpan = document.createElement("span")
        pathnameSpan.classList.add("mobile-option-setting-item-name")
        pathnameSpan.appendChild(document.createTextNode(pathname))

        // Delete icon setting with existing obsidian styled class names.
        const deleteIcon = document.createElement("div")
        deleteIcon.classList.add(
            "clickable-icon",
            "mobile-option-setting-item-option-icon"
        )
        deleteIcon.setAttribute("aria-label", "Delete")
        setIcon(deleteIcon, "x")

        // Returned list item wrapper with existing obsidian styled class names.
        const wrapper = document.createElement("div")
        wrapper.classList.add("mobile-option-setting-item")
        wrapper.append(pathnameSpan, deleteIcon)

        // Add event listener on delete icon for removing the list item and
        // deleting it from the stored settings.
        deleteIcon.addEventListener("click", async () => {
            // Update toggle value locally and in plugin settings.
            this.settingSet.delete(pathname)
            this.plugin.settings[this.setting] = Array.from(this.settingSet)

            // Save plugin settings with updated values.
            await this.plugin.saveSettings().then(() => {
                // Remove mounted list item element from settings tab. Since the
                // deleteIcon is a child of the deleted element, removing
                // `click` event listener is not required.
                wrapper.remove()

                // Refresh settings tab, and plugin repo and file tree state.
                this.updateButton()
                this.plugin.updateRepos()
                this.plugin.highlightTree()
            })
        })

        return wrapper
    }

    /**
     * Update local and plugin settings with pathname in input field. Save this
     * new setting to disk, and then create and mount a new item to the list of
     * existing settings.
     */
    async mountListItem(): Promise<void> {
        // Ignore mount if setting already exists or is invalid.
        const shouldMount = this.shouldMount()
        if (!shouldMount) { return }

        // Update toggle value locally and in plugin settings.
        this.settingSet.add(this.pathname as string)
        this.plugin.settings[this.setting] = Array.from(this.settingSet)

        // Save plugin settings with updated values.
        await this.plugin.saveSettings().then(() => {
            // Create and add list item for new setting.
            const item = this.createListItem()
            this.list.appendChild(item)

            // Refresh settings tab, and plugin repo and file tree state.
            this.updateButton()
            this.plugin.updateRepos()
            this.plugin.highlightTree()
        })
    }

    /**
     * Determine if a given new setting should be saved and mounted to the list
     * element. A setting should not be mounted if it is either invalid, or if
     * the setting already exists in the user settings array.
     *
     * @returns Boolean reflecting if setting should be added to existing list.
     */
    shouldMount(): boolean {
        // Return inverted `getButtonTooltip` method return which will return
        // <empty string> (falsy value) only when the setting is valid.
        return !this.getButtonTooltip()
    }

    /**
     * Updates tooltip and class names for styling of controller `add` button.
     */
    updateButton(): void {
        // Ignore if class property `button` is unset.
        if (!this.button) { return }

        // Force remove both symlink specific button classes, such that the
        // button has no styling set by plugin regardless of existing state.
        this.button.buttonEl.removeClasses([
            "symlink-enabled-button",
            "symlink-disabled-button"
        ])

        // Set button tooltip.
        const tooltip = this.getButtonTooltip()
        this.button.setTooltip(tooltip)

        // Set appropriate class to button to allow plugin styling of button.
        if (tooltip) { this.button.setClass("symlink-disabled-button") }
        else { this.button.setClass("symlink-enabled-button") }
    }

    /**
     * Get tooltip string for setting `add` button. If the setting is valid
     * (i.e. if it is a valid path string, and does not already exist in the
     * user settings array for this setting), then <empty string> will be
     * returned. Obsidian `setTooltip` method on an element will not render
     * anything to the user if the tooltip is <empty string>.
     *
     * @returns Tooltip string.
     */
    getButtonTooltip(): string {
        // Initialise tooltip as empty string.
        let tooltip = ""

        // Set value of tooltip string as required.
        if (!this.pathname) { tooltip = "Enter path" }
        else if (this.settingSet.has(this.pathname)) {
            tooltip = "Already exists"
        }
        else if (path.extname(this.pathname)) {
            tooltip = "Enter a valid directory, not a path to a file"
        }

        return tooltip
    }
}

// @@exports
export { SymlinkSettingListController }

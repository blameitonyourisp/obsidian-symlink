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
 *
 */
class SymlinkSettingListController extends SymlinkSettingController {
    input!: { name: string, description: string }
    setting!: keyof Omit<SymlinkSettings, SymlinkToggleKeys>
    settingSet: Set<string>
    list: HTMLDivElement
    // Class properties *not* set in constructor.
    pathname?: string
    button?: ButtonComponent

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
     * Test
     *
     * @returns test
     */
    createWrapper(): HTMLDivElement {
        // Initialise returned wrapper with outer title and description values.
        const wrapper = super.createWrapper()

        // Append list of existing added settings to wrapper.
        wrapper.appendChild(this.list)

        return wrapper
    }

    /**
     *
     * @returns Div with elements for viewing and updating plugin settings.
     */
    createController(): HTMLDivElement {
        // Initialise returned wrapper with outer title and description values,
        // and a list of existing settings.
        const wrapper = this.createWrapper()

        //
        new Setting(wrapper)
            .setName(this.input.name)
            .setDesc(this.input.description)
            .addText(textComponent => {
                textComponent.setPlaceholder("Enter directory name...")
                    .onChange(textValue => {
                        this.pathname = textValue
                            ? normalizePath(textValue)
                            : undefined
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

    /**
     *
     * @returns
     */
    createList(): HTMLDivElement {
        //
        const wrapper = document.createElement("div")
        wrapper.classList.add("symlink-setting-list")

        return wrapper
    }

    /**
     *
     * @param pathname
     * @returns
     */
    createListItem(pathname = this.pathname as string): HTMLDivElement {
        //
        const pathnameSpan = document.createElement("span")
        pathnameSpan.classList.add("mobile-option-setting-item-name")
        pathnameSpan.appendChild(document.createTextNode(pathname))

        //
        const deleteIcon = document.createElement("div")
        deleteIcon.classList.add(
            "clickable-icon",
            "mobile-option-setting-item-option-icon"
        )
        deleteIcon.setAttribute("aria-label", "Delete")
        setIcon(deleteIcon, "x")

        //
        const wrapper = document.createElement("div")
        wrapper.classList.add("mobile-option-setting-item")
        wrapper.append(pathnameSpan, deleteIcon)

        //
        deleteIcon.addEventListener("click", async () => {
            this.settingSet.delete(pathname)
            this.plugin.settings[this.setting] = Array.from(this.settingSet)
            await this.plugin.saveSettings().then(() => {
                wrapper.remove()
                this.updateButton()
                this.plugin.updateRepos()
                this.plugin.highlightTree()
            })
        })

        return wrapper
    }

    /**
     *
     */
    async mountListItem(): Promise<void> {
        const shouldMount = this.shouldMount()
        if (!shouldMount) { return }

        // Update toggle value locally and in plugin settings.
        this.settingSet.add(this.pathname as string)
        this.plugin.settings[this.setting] = Array.from(this.settingSet)

        // Save plugin settings with updated values, add list item, and refresh
        // plugin repo and file tree state as required.
        await this.plugin.saveSettings().then(() => {
            //
            const item = this.createListItem()
            this.list.appendChild(item)

            //
            this.updateButton()
            this.plugin.updateRepos()
            this.plugin.highlightTree()
        })
    }

    /**
     *
     * @returns
     */
    shouldMount(): boolean { return !this.getButtonTooltip() }

    /**
     *
     * @returns
     */
    updateButton(): void {
        if (!this.button) { return }

        this.button.buttonEl.removeClasses([
            "symlink-enabled-button",
            "symlink-disabled-button"
        ])

        const tooltip = this.getButtonTooltip()
        this.button.setTooltip(tooltip)

        if (tooltip) { this.button.setClass("symlink-disabled-button") }
        else { this.button.setClass("symlink-enabled-button") }
    }

    /**
     *
     * @returns
     */
    getButtonTooltip(): string {
        let tooltip = ""

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

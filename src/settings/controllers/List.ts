import * as path from "path"

import { Setting, setIcon, normalizePath, ButtonComponent } from "obsidian"

import { SymlinkSettingController } from "./Base.ts"

import type { SymlinkSettings } from "#types"
import type { Symlink } from "../../main.ts"

class SymlinkSettingListController extends SymlinkSettingController {
    input!: { name: string, description: string }
    setting!: keyof Omit<SymlinkSettings, "isWhitelist">
    settingSet: Set<string>

    list?: HTMLDivElement
    pathname?: string
    button?: ButtonComponent

    constructor(
        { title, description, container, plugin, input, setting }: {
            title: string,
            description: string,
            container: HTMLElement,
            plugin: Symlink,
            input: { name: string, description: string }
            setting: keyof Omit<SymlinkSettings, "isWhitelist">
    }) {
        super({ title, description, container, plugin })
        Object.assign(this, { input, setting })
        this.settingSet = new Set(this.plugin.settings[this.setting])
    }

    //
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


    //
    createList(): HTMLDivElement {
        //
        const wrapper = document.createElement("div")
        wrapper.classList.add("symlink-setting-list")

        return wrapper
    }

    //
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

    async mountListItem(): Promise<void> {
        const shouldMount = this.shouldMount()
        if (shouldMount) { this.settingSet.add(this.pathname as string) }
        this.plugin.settings[this.setting] = Array.from(this.settingSet)
        await this.plugin.saveSettings().then(() => {
            if (shouldMount) { 
                const item = this.createListItem();
                (this.list as HTMLDivElement).appendChild(item) 
            }
            this.updateButton()
            this.plugin.updateRepos()
            this.plugin.highlightTree()
        })
    }

    shouldMount(): boolean { return !this.getButtonTooltip() }

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

export { SymlinkSettingListController }
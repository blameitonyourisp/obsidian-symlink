import { Setting, setIcon, normalizePath } from "obsidian"

import { SymlinkSettingController } from "./Base"

import type { SymlinkSettings } from "../../types"
import type { Symlink } from "../../main"

class SymlinkSettingListController extends SymlinkSettingController {
    input: { name: string, description: string }
    setting: keyof Omit<SymlinkSettings, "isWhitelist">

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
    }

    //
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
        let name: string
        new Setting(wrapper)
			.setName(this.input.name)
			.setDesc(this.input.description)
            .addText(text => {
                text.setPlaceholder("Enter directory name...")
                    .onChange(string => name = string)
            })
            .addButton(button => {
                button.setButtonText("Add")
                    .onClick(async () => {
                        await this.mountListItem(name, list)
                    })
            })

        return wrapper
    }


    //
    createList(): HTMLDivElement {
        //
        const wrapper = document.createElement("div")
        wrapper.classList.add("obsidian-symlink-setting-list")

        return wrapper
    }

    //
    createListItem(name: string): HTMLDivElement {
        //
        const nameSpan = document.createElement("span")
        nameSpan.classList.add("mobile-option-setting-item-name")
        nameSpan.appendChild(document.createTextNode(name))

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
        wrapper.append(nameSpan, deleteIcon)

        //
        deleteIcon.addEventListener("click", async () => {
            const set = new Set(this.plugin.settings[this.setting])
            set.delete(name)
            this.plugin.settings[this.setting] = Array.from(set)
            await this.plugin.saveSettings().then(() => {
                wrapper.remove()
                this.plugin.updateRepos()
                this.plugin.highlightTree()
            })
        })

        return wrapper
    }

    async mountListItem(name: string, list: HTMLDivElement): Promise<void> {
        if (!name) { return }
        name = normalizePath(name)
        let shouldMount = true
        const item = this.createListItem(name)
        const set = new Set(this.plugin.settings[this.setting])
        if (set.has(name)) { shouldMount = false }
        else { set.add(name) }
        this.plugin.settings[this.setting] = Array.from(set)
        await this.plugin.saveSettings().then(() => {
            if (shouldMount) { list.appendChild(item) }
            this.plugin.updateRepos()
            this.plugin.highlightTree()
        })
    }
}

export { SymlinkSettingListController }
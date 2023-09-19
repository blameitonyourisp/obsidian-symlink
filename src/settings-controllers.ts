import { Setting, setIcon} from "obsidian"

import type { SymlinkSettings } from "./types/SymlinkSettings"
import type { Symlink } from "./main"

class SymlinkSettingController {
    title: string
    description: string
    container: HTMLElement
    plugin: Symlink

    constructor(
        { title, description, container, plugin }: {
            title: string,
            description: string,
            container: HTMLElement,
            plugin: Symlink
    }) {
        Object.assign(this, { title, description, container, plugin })
    }

    createWrapper(): HTMLDivElement {
        const title = document.createElement("div")
        title.classList.add("obsidian-symlink-setting-title")
        title.innerHTML = this.title

        const description = document.createElement("div")
        description.innerHTML = this.description

        const wrapper = document.createElement("div")
        wrapper.classList.add("obsidian-symlink-setting-controller")
        wrapper.append(title, description)

        return wrapper 
    }

    createController(): HTMLDivElement { return this.createWrapper() }

    mount() {
        this.container.appendChild(this.createController())
    }
}

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
        nameSpan.innerHTML = name

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

class SymlinkSettingToggleController extends SymlinkSettingController {
    input: { name: string, description: string }
    setting: keyof Pick<SymlinkSettings, "isWhitelist">

    constructor(
        { title, description, container, plugin, input, setting }: {
            title: string,
            description: string,
            container: HTMLElement,
            plugin: Symlink,
            input: { name: string, description: string }
            setting: keyof Pick<SymlinkSettings, "isWhitelist">
    }) {
        super({ title, description, container, plugin })
        Object.assign(this, { input, setting })
        // container.appendChild(this.createController())
    }

    //
    createController(): HTMLDivElement {        
        //
        const wrapper = this.createWrapper()

        //
        let isToggled: boolean = this.plugin.settings[this.setting]
        new Setting(wrapper)
			.setName(this.input.name)
			.setDesc(this.input.description)
            .addToggle(toggle => {
                toggle.setValue(isToggled)
                    .onChange(async boolean => {
                        isToggled = boolean
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

// @exports
export {
    SymlinkSettingListController,
    SymlinkSettingDropdownController,
    SymlinkSettingToggleController
}
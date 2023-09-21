import type { Symlink } from "../../main.ts"

class SymlinkSettingController {
    title!: string
    description!: string
    container!: HTMLElement
    plugin!: Symlink

    constructor(
        { title, description, container, plugin }: {
            title: string,
            description: string,
            container: HTMLElement,
            plugin: Symlink
    }) {
        // this.title = title
        // this.description = description
        Object.assign(this, { title, description, container, plugin })
    }

    createWrapper(): HTMLDivElement {
        const title = document.createElement("div")
        title.appendChild(document.createTextNode(this.title))
        title.classList.add("symlink-setting-title")

        const description = document.createElement("div")
        description.appendChild(document.createTextNode(this.description))

        const wrapper = document.createElement("div")
        wrapper.classList.add("symlink-setting-controller")
        wrapper.append(title, description)

        return wrapper 
    }

    createController(): HTMLDivElement { return this.createWrapper() }

    mount() { this.container.appendChild(this.createController()) }
}

export { SymlinkSettingController }
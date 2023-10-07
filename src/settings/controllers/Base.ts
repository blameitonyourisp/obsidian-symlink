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
 * @file Symlink base settings controller.
 * @author James Reid
 */

// @ts-check

// @@imports-types
import type { Symlink } from "#types"

// @@body
/**
 *
 */
class SymlinkSettingController {
    title!: string
    description!: string
    container!: HTMLElement
    plugin!: Symlink

    /**
     *
     * @param param0
     */
    constructor(
        { title, description, container, plugin }: {
            title: string,
            description: string,
            container: HTMLElement,
            plugin: Symlink
        }
    ) {
        Object.assign(this, { title, description, container, plugin })
    }

    /**
     *
     * @returns
     */
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

    /**
     *
     * @returns
     */
    createController(): HTMLDivElement { return this.createWrapper() }

    /**
     *
     */
    mount() { this.container.appendChild(this.createController()) }
}

// @@exports
export { SymlinkSettingController }

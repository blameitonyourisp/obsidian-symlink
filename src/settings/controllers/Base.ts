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
 * Base settings controller class providing mount logic and a default controller
 * wrapper with common elements (title, description). Extended classes must
 * implement their own `createController` method.
 */
class SymlinkSettingController {
    // Class properties set in constructor using object assign.
    title!: string
    description!: string
    container!: HTMLElement
    plugin!: Symlink

    /**
     * Assign class properties from provided arguments.
     *
     * @param obj - Class properties required for controller.
     * @param obj.title - Title string for rendering controller.
     * @param obj.description - Description string for rendering controller.
     * @param obj.container - Container to append controller to when mounting.
     * @param obj.plugin - Current instance of symlink obsidian plugin.
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
     * Create default controller wrapper with title and description elements
     * which may be added to by the `createController` method of extended
     * classes.
     *
     * @returns Wrapper containing title and description elements of controller.
     */
    createWrapper(): HTMLDivElement {
        // Title element.
        const title = document.createElement("div")
        title.appendChild(document.createTextNode(this.title))
        title.classList.add("symlink-setting-title")

        // Description element.
        const description = document.createElement("div")
        description.appendChild(document.createTextNode(this.description))

        // Returned wrapper element.
        const wrapper = document.createElement("div")
        wrapper.classList.add("symlink-setting-controller")
        wrapper.append(title, description)

        return wrapper
    }

    /**
     * Create controller element required for viewing and updating a given
     * plugin setting in the settings tab. For each type of setting controller
     * implemented by extended classes (dropdowns, toggles etc.), the extended
     * class must implement this template method.
     *
     * @returns Div with elements for viewing and updating plugin settings.
     */
    createController(): HTMLDivElement { return this.createWrapper() }

    /**
     * Call `createController` method (implemented by each extended class), and
     * mount returned element to parent settings tab container.
     */
    mount() { this.container.appendChild(this.createController()) }
}

// @@exports
export { SymlinkSettingController }

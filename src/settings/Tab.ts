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
 * @file Symlink settings tab.
 * @author James Reid
 */

// @ts-check

// @@imports-dependencies
import { App, PluginSettingTab } from "obsidian"

// @@imports-submodule
import {
    SymlinkSettingListController,
    SymlinkSettingDropdownController,
    SymlinkSettingToggleController
} from "#settings/controllers"

// @@imports-types
import type { Symlink } from "../main.ts"

// @@body
/**
 * Obsidian symlink settings tab class for rendering required markup in the
 * settings tab, which allows the user to view and update current plugin
 * settings. Note that each setting is controlled using an instance of a given
 * controller class, all of which are instantiated and mounted by this class.
 */
class SymlinkSettingsTab extends PluginSettingTab {
    plugin: Symlink

    /**
     * Call obsidian plugin tab super, and set class property reference to the
     * current instance of the symlink plugin.
     *
     * @param app - Instance of obsidian app passed to settings tab manager.
     * @param plugin - Instance of plugin passed to settings tab manager.
     */
    constructor(app: App, plugin: Symlink) {
        super(app, plugin)
        this.plugin = plugin
    }

    /**
     * Render required symlink settings controllers to settings tab container.
     */
    display(): void {
        // Fetch container for settings tab, and empty it.
        const { containerEl } = this
        containerEl.empty()

        // Fetch all repos, and map over them, creating an array of obsidian
        // option objects which can be used in dropdown setting menus.
        const repos = this.plugin.getRepos().map(pathname => {
            return { value: pathname, display: pathname }
        })

        // Create and mount each symlink settings controller required (one
        // controller for each setting available in the symlink plugin).

        // Note that excess string whitespace is ignored when rendered to the
        // DOM. This means that although the multiline descriptions have
        // incorrect tab spacing on new lines (i.e. extra whitespace), they
        // appear correctly (i.e. without extra whitespace) when rendered in the
        // obsidian settings tab.

        // Controller for `repositoryDirIgnore` setting.
        new SymlinkSettingListController({
            title: "",
            description: "",
            container: containerEl,
            plugin: this.plugin,
            input: {
                name: "Ignored directory paths",
                description: "Directories which will be ignored when \
                symlinking a repository. All paths are relative to the root of \
                each repository. See existing list above.",
            },
            setting: "repositoryDirIgnore"
        }).mount()

        // Controller for `repositoryDirLink` setting.
        new SymlinkSettingListController({
            title: "",
            description: "",
            container: containerEl,
            plugin: this.plugin,
            input: {
                name: "Symlinked directory paths",
                description: "Directories which will be directly linked when \
                symlinking a repository. All paths are relative to the root of \
                each repository. See existing list above.",
            },
            setting: "repositoryDirLink"
        }).mount()

        // Controller for `repositoryIgnore` setting.
        new SymlinkSettingDropdownController({
            title: "",
            description: "",
            container: containerEl,
            plugin: this.plugin,
            input: {
                name: "Blacklist repository paths",
                description: "Repositories which will be ignored when \
                indexing repositories for symlinking. All paths are relative \
                to the parent directory of this vault. See existing list \
                above.",
            },
            setting: "repositoryIgnore",
            options: repos
        }).mount()

        // Controller for `repositoryInclude` setting.
        new SymlinkSettingDropdownController({
            title: "",
            description: "",
            container: containerEl,
            plugin: this.plugin,
            input: {
                name: "Whitelist repository paths",
                description: "Repositories which will be included when \
                indexing repositories for symlinking. All paths are relative \
                to the parent directory of this vault. See existing list \
                above.",
            },
            setting: "repositoryInclude",
            options: repos
        }).mount()

        // Controller for `isWhitelist` setting.
        new SymlinkSettingToggleController({
            title: "",
            description: "",
            container: containerEl,
            plugin: this.plugin,
            input: {
                name: "Whitelist mode",
                description: "Should symlinked repositories be indexed based \
                on the repository blacklist or whitelist?",
            },
            setting: "isWhitelist"
        }).mount()

        // Controller for `shouldSymlinkOnStart` setting.
        new SymlinkSettingToggleController({
            title: "",
            description: "",
            container: containerEl,
            plugin: this.plugin,
            input: {
                name: "Symlink on start",
                description: "Should repository symlinks be reloaded when \
                starting obsidian, and or when reloading the window?",
            },
            setting: "shouldSymlinkOnStart"
        }).mount()
    }
}

// @@exports
export { SymlinkSettingsTab }

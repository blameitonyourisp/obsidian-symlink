// Copyright (c) 2022 James Reid. All rights reserved.
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

// @imports-dependencies
import { App, PluginSettingTab } from "obsidian"

// @imports-submodule
import { 
    SymlinkSettingListController, 
    SymlinkSettingDropdownController,
    SymlinkSettingToggleController
} from "#settings/controllers"

// @imports-types
import type { Symlink } from "../main.ts"

// @body
/**
 * 
 */
class SymlinkSettingsTab extends PluginSettingTab {
	plugin: Symlink

    /**
     * 
     * @param app 
     * @param plugin 
     */
	constructor(app: App, plugin: Symlink) {
		super(app, plugin)
		this.plugin = plugin
	}

    /**
     * 
     */
	display(): void {
		const { containerEl } = this
		containerEl.empty()

        const repos = this.plugin.getRepos().map(pathname => {
            return { value: pathname, display: pathname }
        })
        
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
	}
}

// @exports
export { SymlinkSettingsTab }

import { App, PluginSettingTab } from "obsidian"

import { 
    SymlinkSettingListController, 
    SymlinkSettingDropdownController,
    SymlinkSettingToggleController
} from "#settings/controllers"

import type { Symlink } from "../main.ts"

class SymlinkSettingsTab extends PluginSettingTab {
	plugin: Symlink

	constructor(app: App, plugin: Symlink) {
		super(app, plugin)
		this.plugin = plugin
	}

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
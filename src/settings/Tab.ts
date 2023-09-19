import { App, PluginSettingTab } from "obsidian"

import { 
    SymlinkSettingListController, 
    SymlinkSettingDropdownController,
    SymlinkSettingToggleController
} from "./controllers"

import type { Symlink } from "../main"

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
            title: "Ignore Repository Directories",
            description: "",
            container: containerEl,
            plugin: this.plugin,
            input: {
                name: "Directory path",
                description: "Directory in repositories to ignore.",
            },
            setting: "repositoryDirIgnore"
        }).mount()
        
        new SymlinkSettingListController({
            title: "Link Repository Directories",
            description: "",
            container: containerEl,
            plugin: this.plugin,
            input: {
                name: "Directory path",
                description: "Directory in repositories to directly link.",
            },
            setting: "repositoryDirLink"
        }).mount()
        
        new SymlinkSettingDropdownController({
            title: "Ignore Repositories",
            description: "",
            container: containerEl,
            plugin: this.plugin,
            input: {
                name: "Repository path",
                description: "Repository to ignore.",
            },
            setting: "repositoryIgnore",
            options: repos
        }).mount()
        
        new SymlinkSettingDropdownController({
            title: "Include Repositories",
            description: "",
            container: containerEl,
            plugin: this.plugin,
            input: {
                name: "Repository path",
                description: "Repository to include.",
            },
            setting: "repositoryInclude",
            options: repos
        }).mount()
        
        new SymlinkSettingToggleController({
            title: "Whitelist",
            description: "",
            container: containerEl,
            plugin: this.plugin,
            input: {
                name: "Whitelist mode",
                description: "Is plugin in whitelist mode.",
            },
            setting: "isWhitelist"
        }).mount()
	}
}

// @exports
export { SymlinkSettingsTab }
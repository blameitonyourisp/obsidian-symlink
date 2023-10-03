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
 * @file Symlink plugin declaration.
 * @author James Reid
 */

// @ts-check

// @@imports-node
import * as fs from "fs"
import * as path from "path"

// @@imports-dependencies
import { Plugin, setIcon } from "obsidian"

// @@imports-package
import { DEFAULT_SETTINGS, SymlinkSettingsTab } from "#settings"

// @@imports-types
import type { SymlinkSettings } from "#types"

// @@body
/**
 * Obsidian symlink plugin. Allows users to symlink local markdown documentation
 * files to edit them without opening a vault in each repository.
 */
class Symlink extends Plugin {
    vaultDirname!: string
    localDirname!: string
    settings!: SymlinkSettings
    repos!: string[]
    filteredRepos!: string[]
    fileTree!: HTMLDivElement
    fileTreeObserver!: MutationObserver

    /**
     * Setup plugin.
     */
    async onload(): Promise<void> {
        // @ts-expect-error - Prop basePath exists on adapter object at runtime.
        // Set dirname properties for the absolute path to this vault, and the
        // parent directory in which this vault is located.
        this.vaultDirname = this.app.vault.adapter.basePath
        this.localDirname = path.join(this.vaultDirname, "../")

        // Load setting from plugin data.json file, and add setting tab to
        // allow user to view and update plugin settings.
        await this.loadSettings()
        this.addSettingTab(new SymlinkSettingsTab(this.app, this))

        // Update all available and filtered repositories.
        this.updateRepos()

        // Add icon to ribbon to allow users to symlink markdown files according
        // to their settings.
        this.addRibbonIcon("folder-symlink", "Symlink repositories", () => {
            this.symlinkRepos()
        })

        // Add command to palette which calls the same function as the ribbon
        // icon.
        this.addCommand({
            id: "obsidian-symlink-repos",
            name: "Symlink repositories",
            callback: () => this.symlinkRepos()
        })

        // When the workspace has been rendered (and thus when the file tree
        // elements can be mounted), begin watching the file tree for changes,
        // and symlink repos according to plugin settings.
        this.app.workspace.onLayoutReady(() => {
            this.watchTree()
            if (this.settings.shouldSymlinkOnStart) { this.symlinkRepos() }
        })
    }

    /**
     * Clean up DOM event listeners etc. when the plugin is unloaded. Also save
     * current settings to ensure that the saved settings are synced.
     */
    async onunload(): Promise<void> {
        this.unwatchTree()
        await this.saveSettings()
    }

    /**
     * Load settings from plugin data.json file.
     */
    async loadSettings(): Promise<void> {
        this.settings = Object.assign(DEFAULT_SETTINGS, await this.loadData())
    }

    /**
     * Save settings to plugin data.json file.
     */
    async saveSettings(): Promise<void> { await this.saveData(this.settings) }

    /**
     * Get all available repos from the parent directory of this vault, and
     * update filtered repos based on current user settings.
     */
    updateRepos() {
        this.repos = this.getRepos()
        this.filteredRepos = this.filterRepos()
    }

    /**
     * Index all repository directories within the parent directory of this
     * vault.
     *
     * @param dirname - Parent directory in which to look for git repositories.
     * @returns Array of relative paths from parent directory of this vault to
     *      all repositories found within that directory.
     */
    getRepos(dirname = this.localDirname): string[] {
        const repos: string[] = []

        // Loop over child paths, adding to output repos array if a git
        // repository is found.
        for (const pathname of fs.readdirSync(dirname)) {
            // Calculate absolute path. Continue if child directory no longer
            // exists; prevents errors when source directory is deleted, but
            // still exists in obsidian. Also continue if path is a file.
            const absolutePath = path.join(dirname, pathname)
            if (!fs.existsSync(absolutePath)) { continue }
            if (fs.statSync(absolutePath).isFile()) { continue }

            // Check if directory is a git repository, and add as required.
            if (fs.existsSync(`${absolutePath}/.git`)) {
                repos.push(path.relative(this.localDirname, absolutePath))
                continue
            }

            // Recurse child directories.
            repos.push(...this.getRepos(absolutePath))
        }

        return repos
    }

    /**
     * Filter indexed repositories based on user settings of repository paths
     * which should be explicitly included/ignored, and based on if whitelist
     * mode is activated.
     *
     * @returns Filtered array of indexed repositories.
     */
    filterRepos(): string[] {
        const filteredRepos: string[] = []

        // Loop over indexed repositories, and filter based on if whitelist mode
        // is activated, and then based on if the repository is included in the
        // relevant include or ignore array.
        for (const repo of this.repos) {
            if (this.settings.isWhitelist) {
                if (this.settings.repositoryInclude.includes(repo)) {
                    filteredRepos.push(repo)
                }
            }
            else if (!this.settings.repositoryIgnore.includes(repo)) {
                filteredRepos.push(repo)
            }
        }

        return filteredRepos
    }

    /**
     * Index all markdown files in a given repository, observing the directory
     * ignore list fetched from user settings.
     *
     * @param repo - Relative path to root of repository from parent directory
     *      of this vault.
     * @param searchVault - Should files be indexed from actual repository, or
     *      from the existing symlinked version contained in the vault.
     * @param dir - Current child directory of repository being recursed.
     * @returns Array of markdown file paths relative to root of repository.
     */
    getRepoFiles(repo: string, searchVault = false, dir = ""): string[] {
        // Calculate dirname of child directory of repository.
        const dirname = path.join(
            searchVault ? this.vaultDirname : this.localDirname,
            repo,
            dir
        )

        const files: string[] = []

        // Return if nested directory no longer exists; prevents errors when
        // source directory is deleted, but still exists in obsidian.
        if (!fs.existsSync(dirname)) { return files }

        // Loop over child paths, adding to output array if a markdown file is
        // found, ignoring directories included in user settings ignore list,
        // and recursing over any other child directories.
        for (const pathname of fs.readdirSync(dirname)) {
            const absolutePath = path.join(dirname, pathname)
            const relativePath = path.join(dir, pathname)
            if (fs.statSync(absolutePath).isFile()) {
                if (path.extname(absolutePath) === ".md") {
                    files.push(relativePath)
                }
                continue
            }

            // Ignore directory if included in user settings for repository
            // child directories to ignore.
            let shouldIgnore = false
            for (const pathname of this.settings.repositoryDirIgnore) {
                if (relativePath.includes(pathname)) {
                    // replace with ends with
                    shouldIgnore = true
                    break
                }
            }
            if (shouldIgnore) { continue }

            // Recurse nested directories.
            files.push(...this.getRepoFiles(repo, searchVault, relativePath))
        }

        return files
    }

    /**
     * Refresh vault repo symlinks according to user settings. New repos which
     * should be included will be directly added, existing symlinked vault repos
     * which should be removed will be deleted from the vault, and existing
     * symlinked vault repos which should be kept will be updated.
     */
    symlinkRepos(): void {
        // Ensure class repo and filtered repo properties are up to date.
        this.updateRepos()

        // For each repo indexed after update, either symlink the repo to the
        // vault if included in the filtered repos array, or remove the vault
        // repo symlink if not included in filtered repos array.
        for (const repo of this.repos) {
            if (this.filteredRepos.includes(repo)) {
                // If repo not yet symlinked in vault, symlink repo directly.
                if (!fs.existsSync(path.join(this.vaultDirname, repo))) {
                    this.symlinkRepo(repo)
                }

                // Otherwise add event listener for deletion of repo from vault
                // and vault cache, delete existing vault repo symlink, then
                // remake the symlink when event callback fired.
                else {
                    const event = this.app.vault.on("delete", file => {
                        if (file.path === repo) {
                            this.app.vault.offref(event) // Clean up listeners.
                            setTimeout(() => this.symlinkRepo(repo), 100)
                        }
                    })
                    this.removeVaultRepo(repo)
                }
            }
            else { this.removeVaultRepo(repo) }
        }
    }

    /**
     * Symlink a specific vault repository.
     *
     * @param repo - Relative path to requested repo from the parent directory
     *      of the vault.
     */
    symlinkRepo(repo: string): void {
        // Ensure that directory of repository exists within the vault such that
        // if no files or directories are symlinked, the vault will still
        // contain the directory for the repo, albeit will be empty.
        this.addVaultRepo(repo)

        // Link requested directories first.
        for (const dir of this.settings.repositoryDirLink) {
            this.symlinkRepoDirectory(repo, dir)
        }

        // Link all markdown files in repository second.
        const files = this.getRepoFiles(repo)
        for (const file of files) {
            this.symlinkRepoFile(repo, file)
        }
    }

    /**
     * Remove a specific vault directory.
     *
     * @param repo - Relative path to requested repo from the parent directory
     *      of the vault.
     */
    removeVaultRepo(repo: string): void {
        // Calculate absolute path of symlinked repo within the vault.
        let vaultPath = path.join(this.vaultDirname, repo)

        // Recursively remove directory of symlinked repo in the vault.
        if (fs.existsSync(vaultPath)) {
            fs.rmSync(vaultPath, { recursive: true, force: true })
        }

        // Remove parent directories of symlinked vault repo only if those
        // directories are empty.
        while (repo) {
            // Calculate parent directory of current string found in the repo
            // variable. Note that standard methods for calculating parent path
            // such as `path.join(string, "../")` or ``${string}/../`` are
            // explicitly NOT used to prevent the vaultPath variable pointing
            // at any path outside of the vault. Using a regex replace as
            // follows means that the repo can only ever point to the root of
            // the vault if it takes a value of <empty-string>, whereas a path
            // method etc. could set repo to point to an external directory if
            // it takes the value "../" for instance were there to be a bug.
            repo = repo.replace(/(\/|^)[^/]*\/?$/, "")
            vaultPath = path.join(this.vaultDirname, repo)

            // Ignore directory if it does not exist, otherwise remove directory
            // if it is empty (readdir sync array length 0). Note that rmdirSync
            // is used specifically since it will throw an error if directory is
            // not empty.
            if (!fs.existsSync(vaultPath)) { continue }
            if (!fs.readdirSync(vaultPath).length) { fs.rmdirSync(vaultPath) }
        }
    }

    /**
     * Add a specific vault directory.
     *
     * @param repo - Relative path to requested repo from the parent directory
     *      of the vault.
     */
    addVaultRepo(repo: string): void {
        // Calculate absolute path of directory within the vault.
        const vaultPath = path.join(this.vaultDirname, repo)

        // Recursively create directory if it does not already exist.
        if (!fs.existsSync(vaultPath)) {
            fs.mkdirSync(vaultPath, { recursive: true })
        }
    }

    /**
     * Symlink an entire subdirectory of a given repo into the vault repo.
     *
     * @param repo - Relative path to requested repo from the parent directory
     *      of the vault.
     * @param dir - Relative path to requested directory from the root of the
     *      given repository.
     */
    symlinkRepoDirectory(repo: string, dir: string): void {
        // Calculate absolute path of target repo directory, and ignore if it
        // does not exist.
        const target = path.join(this.localDirname, repo, dir)
        if (!fs.existsSync(target)) { return }

        // Calculate parent path of directory.
        const destination = path.join(this.vaultDirname, repo, dir)
        const parentPath = path.join(destination, "../")

        // Ensure that parent path exists.
        if (!fs.existsSync(parentPath)) {
            fs.mkdirSync(parentPath, { recursive: true })
        }
        if (fs.existsSync(destination)) { fs.rmdirSync(destination) }

        // Symlink directory.
        fs.symlinkSync(target, destination)
    }

    /**
     * Symlink a specific file from a given repo into the vault repo.
     *
     * @param repo - Relative path to requested repo from the parent directory
     *      of the vault.
     * @param file - Relative path to requested file from the root of the given
     *      repository.
     */
    symlinkRepoFile(repo: string, file: string): void {
        // Calculate absolute path of target repo file, and ignore if it does
        // not exist.
        const target = path.join(this.localDirname, repo, file)
        if (!fs.existsSync(target)) { return }

        // Ignore file it is a child of an ignored directory in user settings.
        let shouldIgnore = false
        for (const pathname of this.settings.repositoryDirLink) {
            if (file.includes(pathname)) {
                // replace with starts with
                shouldIgnore = true
                break
            }
        }
        if (shouldIgnore) { return }

        // Calculate parent path of file (directory which contains the file).
        const destination = path.join(this.vaultDirname, repo, file)
        const parentPath = path.join(destination, "../")

        // Ensure that parent path exists.
        if (!fs.existsSync(parentPath)) {
            fs.mkdirSync(parentPath, { recursive: true })
        }
        if (fs.existsSync(destination)) { fs.rmSync(destination) }

        // Symlink file.
        fs.symlinkSync(target, destination)
    }

    /**
     * Watch file tree container in nav, and highlight the tree on any change
     * with appropriate additional icons to reflect if the file tree item is
     * a symlinked resource.
     */
    watchTree(): void {
        // Fetch tree element from DOM, return if method erroneously called
        // before the tree element exists on page.
        const tree = document.querySelector(".nav-files-container")
        if (!tree) { return }

        // Set fileTree class property with fetched tree element.
        this.fileTree = tree as HTMLDivElement
        this.highlightTree()

        // Configure mutation observer to watch the file tree, and re-highlight
        // the tree on any change to child nodes etc.
        const options: MutationObserverInit = { childList: true, subtree: true }
        this.fileTreeObserver = new MutationObserver(mutations => {
            // Determine if mutation requires file tree highlight update. Update
            // is required if mutation adds any element with a "data-path"
            // attribute set (since these elements are either files or
            // directories in the nav file tree).
            let shouldHighlight = false
            DATA_PATH_MUTATION: for (const mutation of mutations) {
                for (const node of Array.from(mutation.addedNodes)) {
                    if ((node as HTMLDivElement).querySelector("[data-path]")) {
                        shouldHighlight = true
                        break DATA_PATH_MUTATION
                    }
                }
            }

            // If tree should be re-highlighted, disconnect observer, trigger
            // highlight then re-observe tree in order to prevent mutation
            // events during the highlight DOM changes.
            if (shouldHighlight) {
                this.fileTreeObserver.disconnect()
                this.highlightTree()
                this.fileTreeObserver.observe(this.fileTree, options)
            }
        })

        // Observe file tree.
        this.fileTreeObserver.observe(this.fileTree, options)
    }

    /**
     * Dispose of mutation observer on file tree element.
     */
    unwatchTree(): void {
        if (this.fileTreeObserver) { this.fileTreeObserver.disconnect() }
    }

    /**
     * Recursively highlight nav file tree with additional icons to indicate if
     * the file tree item is a symlinked file, a symlinked directory, a tracked
     * repository, or an untracked repository which will be removed on the next
     * symlink refresh.
     *
     * @param tree - Parent or nested nav tree container element.
     */
    highlightTree(tree = this.fileTree): void {
        // Return if method erroneously called before the tree element is set as
        // a class property.
        if (!tree) { return }

        // Recursively call highlight method on each subtree.
        for (const child of Array.from(tree.children)) {
            this.highlightTree(child as HTMLDivElement)
        }

        //
        const dataPath = tree.getAttribute("data-path")
        if (!dataPath) { return }

        // wheen updating all symlinks, tree is redrawn many times,
        // directories may not exist, final call will be correct render
        const absolutePath = path.join(this.vaultDirname, dataPath)
        if (!fs.existsSync(absolutePath)) { return }

        //
        const isFile = fs.statSync(absolutePath).isFile()
        const isSymlink = fs.lstatSync(absolutePath).isSymbolicLink()

        //
        let shouldHighlight = false
        let isSymlinkChild = false
        let isIgnored = false
        let isLinked = true

        //
        for (const repo of this.filteredRepos) {
            if (dataPath.startsWith(repo)) {
                shouldHighlight = true
                isLinked = this.settings.repositoryDirLink.includes(
                    path.relative(repo, dataPath)
                )
                isIgnored = this.settings.repositoryDirIgnore.includes(
                    path.relative(repo, dataPath)
                )
                for (const link of this.settings.repositoryDirLink) {
                    if (dataPath.startsWith(path.join(repo, link))) {
                        isSymlinkChild = true
                        break
                    }
                }
                break
            }
        }

        //
        const icon = (tree.querySelector(".tree-symlink-icon") ||
            document.createElement("div")) as HTMLDivElement
        icon.classList.add("tree-item-icon", "tree-symlink-icon")
        icon.querySelector("svg")?.remove()

        //
        if (isFile && isSymlink && shouldHighlight) {
            setIcon(icon, "file-symlink")
        }
        else if (isFile && shouldHighlight && !isSymlinkChild) {
            setIcon(icon, "alert-circle")
            icon.style.color = "var(--color-orange)"
        }
        else if (isSymlink && shouldHighlight) {
            setIcon(icon, "folder-symlink")
            if (!isLinked) { icon.style.color = "var(--color-orange)" }
        }
        else if (isIgnored && shouldHighlight) {
            setIcon(icon, "alert-circle")
            icon.style.color = "var(--color-orange)"
        }
        else {
            if ((this.filteredRepos).includes(dataPath)) {
                setIcon(icon, "check-circle-2")
                icon.style.color = "var(--color-green)"
            }
            else if ((this.repos).includes(dataPath)) {
                setIcon(icon, "alert-circle")
                icon.style.color = "var(--color-orange)"
            }
        }

        // Highlight tree file/directory item with generated icon container.
        tree.appendChild(icon)
    }
}

// change includes to use endsWith or eqeqeq etc. search includes, endwith, star
// add symlink on load setting
// resolve file tree syncing issue without using timeout

// @@exports
export default Symlink
export type { Symlink }

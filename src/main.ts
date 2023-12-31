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
import { setLinearBackoff } from "#utils"

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
     * @param relativeDirname - Child directory of repository being recursed.
     * @returns Array of markdown file paths relative to root of repository.
     */
    getRepoFiles(
        repo: string,
        searchVault = false,
        relativeDirname = ""
    ): string[] {
        // Calculate absolute dirname of child directory of repository.
        const absoluteDirname = path.join(
            searchVault ? this.vaultDirname : this.localDirname,
            repo,
            relativeDirname
        )

        const files: string[] = []

        // Return if nested directory no longer exists; prevents errors when
        // source directory is deleted, but still exists in obsidian.
        if (!fs.existsSync(absoluteDirname)) { return files }

        // Loop over child paths, adding to output array if a markdown file is
        // found, ignoring directories included in user settings ignore list,
        // and recursing over any other child directories.
        for (const pathname of fs.readdirSync(absoluteDirname)) {
            const absolutePath = path.join(absoluteDirname, pathname)
            const relativePath = path.join(relativeDirname, pathname)
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

        // Tracer object containing string set of paths (directories and files)
        // removed from the file system by `deleteVaultRepo` method, and a
        // string set of paths deleted from the vault cache.
        const tracer = {
            deletedPaths: new Set() as Set<string>,
            cacheDeletedPaths: new Set() as Set<string>,
            isComplete: false,
            get isEqual(): boolean {
                // Compare path string sets and return true if they are equal.
                return (
                    this.deletedPaths.size === this.cacheDeletedPaths.size &&
                    [...this.deletedPaths].every(pathname => {
                        return this.cacheDeletedPaths.has(pathname)
                    })
                )
            }
        }

        // Add event listener for deletion of repo directories/files from vault
        // and vault cache.
        const event = this.app.vault.on("delete", file => {
            // Add file path (may be file or directory) to set of paths deleted
            // from cache.
            tracer.cacheDeletedPaths.add(file.path)

            // Clean up listeners when tracer status is complete, and when all
            // deleted resource paths have also been deleted from vault cache.
            if (tracer.isComplete && tracer.isEqual) {
                this.app.vault.offref(event)
            }
        })

        // Delete every repo from vault (does nothing if repo is unlinked), and
        // add all deleted paths to the tracer object.
        for (const repo of this.repos) {
            for (const pathname of this.deleteVaultRepo(repo)) {
                tracer.deletedPaths.add(pathname)
            }
        }

        // Update tracer status.
        tracer.isComplete = true

        // Symlink all repositories in the `filteredRepos` setting array using a
        // linear backoff. Callback executed only when the tracer status is
        // complete (i.e. no more vault resources will be deleted), and when the
        // resources removed from the file system by `deleteVaultRepo` method
        // have also triggered the vault `delete` event (i.e. they have been
        // remove from the vault cache). This ensures that the obsidian file
        // tree will not fall out of sync with the file system due to cache
        // timings (e.g. a repo being re-symlinked before the `delete` event
        // on that repo had been propagated).
        setLinearBackoff(
            () => {
                for (const repo of this.filteredRepos) {
                    this.symlinkRepo(repo)
                }
            },
            () => tracer.isComplete && tracer.isEqual,
            { maxMs: 10 * 1000 }
        )
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
     * @returns Array of deleted resources (paths of files and directories).
     */
    deleteVaultRepo(repo: string): string[] {
        // Calculate absolute path of symlinked repo within the vault.
        let vaultPath = path.join(this.vaultDirname, repo)

        // Array of paths of files and directories deleted by this method.
        const deletedPaths: string[] = []

        // Inline function to recursively walk deleted repo to get paths of all
        // deleted files and directories.
        const walkRepo = (relativePath: string): string[] => {
            // Absolute path of file or directory being deleted.
            const absolutePath = path.join(this.vaultDirname, relativePath)

            // Initialise result, and return immediately if resource is file.
            const paths = [relativePath]
            if (fs.statSync(absolutePath).isFile()) { return paths }

            // Recurse over sub paths (files and directories).
            const subPathnames = fs.readdirSync(absolutePath)
            for (const pathname of subPathnames) {
                paths.push(...walkRepo(path.join(relativePath, pathname)))
            }

            return paths
        }

        // Recursively remove directory of symlinked repo in the vault.
        if (fs.existsSync(vaultPath)) {
            deletedPaths.push(...walkRepo(repo))
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
            if (!fs.readdirSync(vaultPath).length) {
                deletedPaths.push(repo) // Walk not required, since dir empty.
                fs.rmdirSync(vaultPath)
            }
        }

        return deletedPaths
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

        // Ignore tree element if there is no `data-path` attribute since all
        // files and directories have this attribute.
        const dataPath = tree.getAttribute("data-path")
        if (!dataPath) { return }

        // Ignore if the absolutePath does not exist (when updating all vault
        // symlinks, tree may be redrawn many times, and so the `highlightTree`
        // method may be called as directories are being deleted; after all
        // required repos have been re-symlinked, the final call to the
        // `highlightTree` method will produce the correct icon highlights).
        const absolutePath = path.join(this.vaultDirname, dataPath)
        if (!fs.existsSync(absolutePath)) { return }

        // Initialise rendering flags.
        const isFile = fs.statSync(absolutePath).isFile()
        const isSymlink = fs.lstatSync(absolutePath).isSymbolicLink()
        let shouldHighlight = false
        let isSymlinkChild = false
        let isIgnored = false
        let isLinked = true

        // Update rendering flags.
        for (const repo of this.filteredRepos) {
            if (dataPath.startsWith(repo)) {
                // If `data-path` is a child of a filtered repo, it should be
                // highlighted.
                shouldHighlight = true

                // Is repo directory directly symlinked in plugin settings.
                isLinked = this.settings.repositoryDirLink.includes(
                    path.relative(repo, dataPath)
                )

                // Is repo directory ignored in plugin settings.
                isIgnored = this.settings.repositoryDirIgnore.includes(
                    path.relative(repo, dataPath)
                )

                // Is file/path a child of a symlinked repo directory.
                for (const link of this.settings.repositoryDirLink) {
                    if (dataPath.startsWith(path.join(repo, link))) {
                        isSymlinkChild = true
                        break
                    }
                }

                break
            }
        }

        // Create icon element with, or fetch existing tree icon, and remove the
        // child svg element if present. Add required symlink-specific and
        // existing obsidian class names for styling of icon.
        const icon = (tree.querySelector(".tree-symlink-icon") ||
            document.createElement("div")) as HTMLDivElement
        icon.classList.add("tree-item-icon", "tree-symlink-icon")
        icon.querySelector("svg")?.remove()

        // Set icon and icon colour (where required) depending on the rendering
        // flags set above.
        if (isFile && isSymlink && shouldHighlight) {
            setIcon(icon, "file-symlink")
        }
        else if (isFile && !isSymlinkChild && shouldHighlight) {
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
            if (this.filteredRepos.includes(dataPath)) {
                setIcon(icon, "check-circle-2")
                icon.style.color = "var(--color-green)"
            }
            else if (this.repos.includes(dataPath)) {
                setIcon(icon, "alert-circle")
                icon.style.color = "var(--color-orange)"
            }
        }

        // Highlight tree file/directory item with generated icon container.
        tree.appendChild(icon)
    }
}

// @@exports
export default Symlink
export type { Symlink }

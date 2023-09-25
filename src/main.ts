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
 * Obsidian symlink plugin. Allows users to
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
     *
     */
    async onload(): Promise<void> {
        // @ts-expect-error basePath exists on adapter object at runtime
        this.vaultDirname = this.app.vault.adapter.basePath
        this.localDirname = path.join(this.vaultDirname, "../")

        // Load setting from plugin data.json file, and add setting tab to
        // allow user to view and update plugin settings.
        await this.loadSettings()
        this.addSettingTab(new SymlinkSettingsTab(this.app, this))

        //
        this.updateRepos()

        // Called when the user clicks the icon.
        this.addRibbonIcon("folder-symlink", "Symlink repositories", () => {
            this.symlinkRepos()
        })

        this.addCommand({
            id: "obsidian-symlink-repos",
            name: "Symlink repositories",
            callback: () => this.symlinkRepos()
        })

        this.app.workspace.onLayoutReady(() => this.watchTree())
    }

    /**
     *
     */
    async onunload(): Promise<void> {
        this.unwatchTree()
        await this.saveSettings()
    }

    /**
     *
     */
    async loadSettings(): Promise<void> {
        this.settings = Object.assign(DEFAULT_SETTINGS, await this.loadData())
    }

    /**
     *
     */
    async saveSettings(): Promise<void> { await this.saveData(this.settings) }

    /**
     *
     */
    updateRepos() {
        this.repos = this.getRepos()
        this.filteredRepos = this.filterRepos()
    }

    /**
     *
     * @param dirname
     * @returns
     */
    getRepos(dirname = this.localDirname): string[] {
        const repos: string[] = []
        for (const pathname of fs.readdirSync(dirname)) {
            const absolutePath = path.join(dirname, pathname)
            // for when source file is deleted, but still exists in obsidian
            if (!fs.existsSync(absolutePath)) { continue }
            if (fs.statSync(absolutePath).isFile()) { continue }
            else if (fs.existsSync(`${absolutePath}/.git`)) {
                repos.push(path.relative(this.localDirname, absolutePath))
                continue
            }
            repos.push(...this.getRepos(absolutePath))
        }
        return repos
    }

    /**
     *
     * @returns
     */
    filterRepos(): string[] {
        const filteredRepos: string[] = []
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
     *
     * @param repo
     * @param searchVault
     * @param dir
     * @returns
     */
    getRepoFiles(repo: string, searchVault = false, dir = ""): string[] {
        const dirname = path.join(
            searchVault ? this.vaultDirname : this.localDirname,
            repo,
            dir
        )
        const files: string[] = []
        if (!fs.existsSync(dirname)) { return files }
        for (const pathname of fs.readdirSync(dirname)) {
            const absolutePath = path.join(dirname, pathname)
            const relativePath = path.join(dir, pathname)
            if (fs.statSync(absolutePath).isFile()) {
                if (path.extname(absolutePath) === ".md") {
                    files.push(relativePath)
                }
                continue
            }
            let shouldIgnore = false
            for (const pathname of this.settings.repositoryDirIgnore) {
                if (relativePath.includes(pathname)) {
                    // replace with ends with
                    shouldIgnore = true
                    break
                }
            }
            if (shouldIgnore) { continue }
            files.push(...this.getRepoFiles(repo, searchVault, relativePath))
        }
        return files
    }

    /**
     *
     */
    symlinkRepos(): void {
        this.updateRepos()
        for (const repo of this.repos) {
            if ((this.filteredRepos).includes(repo)) {
                if (!fs.existsSync(path.join(this.vaultDirname, repo))) {
                    this.symlinkRepo(repo)
                }
                else {
                    const event = this.app.vault.on("delete", file => {
                        if (file.path === repo) {
                            this.app.vault.offref(event)
                            this.symlinkRepo(repo)
                        }
                    })
                    this.removeVaultRepo(repo)
                }
            }
            else { this.removeVaultRepo(repo) }
        }
    }

    /**
     *
     * @param repo
     */
    symlinkRepo(repo: string): void {
        // Add vault directory
        this.addVaultRepo(repo)

        for (const link of this.settings.repositoryDirLink) {
            this.symlinkRepoDirectory(repo, link)
        }

        const files = this.getRepoFiles(repo)
        for (const file of files) {
            this.symlinkFile(repo, file)
        }
    }

    /**
     *
     * @param repo
     */
    removeVaultRepo(repo: string): void {
        let vaultPath = path.join(this.vaultDirname, repo)

        if (fs.existsSync(vaultPath)) {
            fs.rmSync(vaultPath, { recursive: true, force: true })
        }

        // clear parents if empty
        while (repo) {
            // repo = path.join(repo, "../") // DANGER!!!
            repo = repo.replace(/(\/|^)[^/]*\/?$/, "")
            vaultPath = path.join(this.vaultDirname, repo)
            if (!fs.existsSync(vaultPath)) { continue }
            if (!fs.readdirSync(vaultPath).length) {
                // safer since will error if has contents
                fs.rmdirSync(vaultPath)
            }
        }
    }

    /**
     *
     * @param repo
     */
    addVaultRepo(repo: string): void {
        const vaultPath = path.join(this.vaultDirname, repo)

        if (!fs.existsSync(vaultPath)) {
            fs.mkdirSync(vaultPath, { recursive: true })
        }
    }

    /**
     *
     * @param repo
     * @param link
     * @returns
     */
    symlinkRepoDirectory(repo: string, link: string): void {
        const target = path.join(this.localDirname, repo, link)
        if (!fs.existsSync(target)) { return }

        const destination = path.join(this.vaultDirname, repo, link)
        const parentPath = path.join(destination, "../")

        if (!fs.existsSync(parentPath)) {
            fs.mkdirSync(parentPath, { recursive: true })
        }
        if (fs.existsSync(destination)) { fs.rmdirSync(destination) }

        // Add backoff in else if block?
        fs.symlinkSync(target, destination)
    }

    /**
     *
     * @param repo
     * @param file
     * @returns
     */
    symlinkFile(repo: string, file: string): void {
        const target = path.join(this.localDirname, repo, file)
        if (!fs.existsSync(target)) { return }

        let shouldIgnore = false
        for (const pathname of this.settings.repositoryDirLink) {
            if (file.includes(pathname)) {
                // replace with starts with
                shouldIgnore = true
                break
            }
        }
        if (shouldIgnore) { return }

        const destination = path.join(this.vaultDirname, repo, file)
        const parentPath = path.join(destination, "../")

        if (!fs.existsSync(parentPath)) {
            fs.mkdirSync(parentPath, { recursive: true })
        }
        if (fs.existsSync(destination)) { fs.rmSync(destination) }

        // Add backoff in else if block?
        fs.symlinkSync(target, destination)
    }

    /**
     *
     * @returns
     */
    watchTree(): void {
        const tree = document.querySelector(".nav-files-container")
        if (!tree) { return }

        this.fileTree = tree as HTMLDivElement
        this.highlightTree()

        const options: MutationObserverInit = { childList: true, subtree: true }
        this.fileTreeObserver = new MutationObserver(mutations => {
            let shouldHighlight = false
            DATA_PATH_MUTATION: for (const mutation of mutations) {
                for (const node of Array.from(mutation.addedNodes)) {
                    if ((node as HTMLDivElement).querySelector("[data-path]")) {
                        shouldHighlight = true
                        break DATA_PATH_MUTATION
                    }
                }
            }

            if (shouldHighlight) {
                this.fileTreeObserver.disconnect()
                this.highlightTree()
                this.fileTreeObserver.observe(this.fileTree, options)
            }
        })
        this.fileTreeObserver.observe(this.fileTree, options)
    }

    /**
     *
     * @param observer
     * @returns
     */
    unwatchTree(observer = this.fileTreeObserver): void {
        if (!observer) { return }
        observer.disconnect()
    }

    /**
     *
     * @param tree
     * @returns
     */
    highlightTree(tree = this.fileTree): void {
        if (!tree) { return }
        const dataPath = tree.getAttribute("data-path")
        if (dataPath) {
            let shouldHighlight = false
            let isSymlinkChild = false
            let isLinked = true
            let isIgnored = false
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

            // to allow correct setting reflection - rewrite with svg query
            // selector all?
            icon.firstChild?.remove()

            // wheen updating all symlinks, tree is redrawn many times,
            // directories may not exist, final call will be correct render
            const absolutePath = path.join(this.vaultDirname, dataPath)
            if (!fs.existsSync(absolutePath)) { return }

            const isFile = fs.statSync(absolutePath).isFile()
            const isSymlink = fs.lstatSync(absolutePath).isSymbolicLink()

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

            tree?.appendChild(icon)
        }

        //
        for (const child of Array.from(tree.children)) {
            this.highlightTree(child as HTMLDivElement)
        }
    }
}

// remove util
// add glob support for ignore files
// document stylesheet

// @@exports
export default Symlink
export type { Symlink }

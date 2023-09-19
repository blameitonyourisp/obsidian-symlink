interface SymlinkSettings {
    repositoryDirIgnore: string[]
    repositoryDirLink: string[]
    repositoryIgnore: string[],
    repositoryInclude: string[],
    isWhitelist: boolean
}

export type { SymlinkSettings }
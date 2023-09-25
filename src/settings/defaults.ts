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
 * @file Symlink default settings.
 * @author James Reid
 */

// @ts-check

// @@imports-types
import type { SymlinkSettings } from "#types"

// @@body
const DEFAULT_SETTINGS: SymlinkSettings = {
    repositoryDirIgnore: ["node_modules", ".git"],
    repositoryDirLink: ["docs"],
    repositoryIgnore: [],
    repositoryInclude: [],
    isWhitelist: true
}

// @@exports
export { DEFAULT_SETTINGS }

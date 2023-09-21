import fs from "fs"

const targetVersion = process.env.npm_package_version

// read minAppVersion from manifest.json and bump version to target version
const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf-8"))
manifest.version = targetVersion
fs.writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"))

// update versions.json with target version and minAppVersion from manifest.json
const versions = JSON.parse(fs.readFileSync("versions.json", "utf8"))
versions[/** @type {string} */ (targetVersion)] = manifest.minAppVersion
fs.writeFileSync("versions.json", JSON.stringify(versions, null, "\t"))

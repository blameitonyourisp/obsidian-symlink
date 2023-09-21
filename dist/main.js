/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/

"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => main_default
});
module.exports = __toCommonJS(main_exports);
var fs = __toESM(require("fs"), 1);
var path2 = __toESM(require("path"), 1);
var import_obsidian5 = require("obsidian");

// src/settings/defaults.ts
var DEFAULT_SETTINGS = {
  repositoryDirIgnore: ["node_modules", ".git"],
  repositoryDirLink: ["docs"],
  repositoryIgnore: [],
  repositoryInclude: [],
  isWhitelist: true
};

// src/settings/Tab.ts
var import_obsidian4 = require("obsidian");

// src/settings/controllers/Base.ts
var SymlinkSettingController = class {
  constructor({ title, description, container, plugin }) {
    __publicField(this, "title");
    __publicField(this, "description");
    __publicField(this, "container");
    __publicField(this, "plugin");
    Object.assign(this, { title, description, container, plugin });
  }
  createWrapper() {
    const title = document.createElement("div");
    title.appendChild(document.createTextNode(this.title));
    title.classList.add("symlink-setting-title");
    const description = document.createElement("div");
    description.appendChild(document.createTextNode(this.description));
    const wrapper = document.createElement("div");
    wrapper.classList.add("symlink-setting-controller");
    wrapper.append(title, description);
    return wrapper;
  }
  createController() {
    return this.createWrapper();
  }
  mount() {
    this.container.appendChild(this.createController());
  }
};

// src/settings/controllers/Dropdown.ts
var import_obsidian2 = require("obsidian");

// src/settings/controllers/List.ts
var path = __toESM(require("path"), 1);
var import_obsidian = require("obsidian");
var SymlinkSettingListController = class extends SymlinkSettingController {
  constructor({ title, description, container, plugin, input, setting }) {
    super({ title, description, container, plugin });
    __publicField(this, "input");
    __publicField(this, "setting");
    __publicField(this, "settingSet");
    __publicField(this, "list");
    __publicField(this, "pathname");
    __publicField(this, "button");
    Object.assign(this, { input, setting });
    this.settingSet = new Set(this.plugin.settings[this.setting]);
  }
  //
  createController() {
    const wrapper = this.createWrapper();
    this.list = this.createList();
    wrapper.appendChild(this.list);
    for (const pathname of this.plugin.settings[this.setting]) {
      const item = this.createListItem(pathname);
      this.list.appendChild(item);
    }
    new import_obsidian.Setting(wrapper).setName(this.input.name).setDesc(this.input.description).addText((textComponent) => {
      textComponent.setPlaceholder("Enter directory name...").onChange((textValue) => {
        this.pathname = textValue ? (0, import_obsidian.normalizePath)(textValue) : void 0;
        this.updateButton();
      });
    }).addButton((buttonComponent) => {
      this.button = buttonComponent;
      this.updateButton();
      buttonComponent.setButtonText("Add").onClick(async () => {
        await this.mountListItem();
      });
    });
    return wrapper;
  }
  //
  createList() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("symlink-setting-list");
    return wrapper;
  }
  //
  createListItem(pathname = this.pathname) {
    const pathnameSpan = document.createElement("span");
    pathnameSpan.classList.add("mobile-option-setting-item-name");
    pathnameSpan.appendChild(document.createTextNode(pathname));
    const deleteIcon = document.createElement("div");
    deleteIcon.classList.add(
      "clickable-icon",
      "mobile-option-setting-item-option-icon"
    );
    deleteIcon.setAttribute("aria-label", "Delete");
    (0, import_obsidian.setIcon)(deleteIcon, "x");
    const wrapper = document.createElement("div");
    wrapper.classList.add("mobile-option-setting-item");
    wrapper.append(pathnameSpan, deleteIcon);
    deleteIcon.addEventListener("click", async () => {
      this.settingSet.delete(pathname);
      this.plugin.settings[this.setting] = Array.from(this.settingSet);
      await this.plugin.saveSettings().then(() => {
        wrapper.remove();
        this.updateButton();
        this.plugin.updateRepos();
        this.plugin.highlightTree();
      });
    });
    return wrapper;
  }
  async mountListItem() {
    const shouldMount = this.shouldMount();
    if (shouldMount) {
      this.settingSet.add(this.pathname);
    }
    this.plugin.settings[this.setting] = Array.from(this.settingSet);
    await this.plugin.saveSettings().then(() => {
      if (shouldMount) {
        const item = this.createListItem();
        this.list.appendChild(item);
      }
      this.updateButton();
      this.plugin.updateRepos();
      this.plugin.highlightTree();
    });
  }
  shouldMount() {
    return !this.getButtonTooltip();
  }
  updateButton() {
    if (!this.button) {
      return;
    }
    this.button.buttonEl.removeClasses([
      "symlink-enabled-button",
      "symlink-disabled-button"
    ]);
    const tooltip = this.getButtonTooltip();
    this.button.setTooltip(tooltip);
    if (tooltip) {
      this.button.setClass("symlink-disabled-button");
    } else {
      this.button.setClass("symlink-enabled-button");
    }
  }
  getButtonTooltip() {
    let tooltip = "";
    if (!this.pathname) {
      tooltip = "Enter path";
    } else if (this.settingSet.has(this.pathname)) {
      tooltip = "Already exists";
    } else if (path.extname(this.pathname)) {
      tooltip = "Enter a valid directory, not a path to a file";
    }
    return tooltip;
  }
};

// src/settings/controllers/Dropdown.ts
var SymlinkSettingDropdownController = class extends SymlinkSettingListController {
  constructor({ title, description, container, plugin, input, setting, options }) {
    super({ title, description, container, plugin, input, setting });
    __publicField(this, "options");
    Object.assign(this, { options });
  }
  createController() {
    var _a;
    const wrapper = this.createWrapper();
    this.list = this.createList();
    wrapper.appendChild(this.list);
    for (const pathname of this.plugin.settings[this.setting]) {
      const item = this.createListItem(pathname);
      this.list.appendChild(item);
    }
    this.pathname = (_a = this.options[0]) == null ? void 0 : _a.value;
    new import_obsidian2.Setting(wrapper).setName(this.input.name).setDesc(this.input.description).addDropdown((dropdownComponent) => {
      for (const option of this.options) {
        dropdownComponent.addOption(option.value, option.display);
      }
      dropdownComponent.onChange((dropdownValue) => {
        this.pathname = dropdownValue;
        this.updateButton();
      });
    }).addButton((buttonComponent) => {
      this.button = buttonComponent;
      this.updateButton();
      buttonComponent.setButtonText("Add").onClick(async () => {
        await this.mountListItem();
      });
    });
    return wrapper;
  }
};

// src/settings/controllers/Toggle.ts
var import_obsidian3 = require("obsidian");
var SymlinkSettingToggleController = class extends SymlinkSettingController {
  constructor({ title, description, container, plugin, input, setting }) {
    super({ title, description, container, plugin });
    __publicField(this, "input");
    __publicField(this, "setting");
    Object.assign(this, { input, setting });
  }
  //
  createController() {
    const wrapper = this.createWrapper();
    let isToggled = this.plugin.settings[this.setting];
    new import_obsidian3.Setting(wrapper).setName(this.input.name).setDesc(this.input.description).addToggle((toggleComponent) => {
      toggleComponent.setValue(isToggled).onChange(async (toggleValue) => {
        isToggled = toggleValue;
        this.plugin.settings[this.setting] = isToggled;
        await this.plugin.saveSettings().then(() => {
          this.plugin.updateRepos();
          this.plugin.highlightTree();
        });
      });
    });
    return wrapper;
  }
};

// src/settings/Tab.ts
var SymlinkSettingsTab = class extends import_obsidian4.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    __publicField(this, "plugin");
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const repos = this.plugin.getRepos().map((pathname) => {
      return { value: pathname, display: pathname };
    });
    new SymlinkSettingListController({
      title: "",
      description: "",
      container: containerEl,
      plugin: this.plugin,
      input: {
        name: "Ignored directory paths",
        description: "Directories which will be ignored when                 symlinking a repository. All paths are relative to the root of                 each repository. See existing list above."
      },
      setting: "repositoryDirIgnore"
    }).mount();
    new SymlinkSettingListController({
      title: "",
      description: "",
      container: containerEl,
      plugin: this.plugin,
      input: {
        name: "Symlinked directory paths",
        description: "Directories which will be directly linked when                 symlinking a repository. All paths are relative to the root of                 each repository. See existing list above."
      },
      setting: "repositoryDirLink"
    }).mount();
    new SymlinkSettingDropdownController({
      title: "",
      description: "",
      container: containerEl,
      plugin: this.plugin,
      input: {
        name: "Blacklist repository paths",
        description: "Repositories which will be ignored when                 indexing repositories for symlinking. All paths are relative                 to the parent directory of this vault. See existing list                 above."
      },
      setting: "repositoryIgnore",
      options: repos
    }).mount();
    new SymlinkSettingDropdownController({
      title: "",
      description: "",
      container: containerEl,
      plugin: this.plugin,
      input: {
        name: "Whitelist repository paths",
        description: "Repositories which will be included when                 indexing repositories for symlinking. All paths are relative                 to the parent directory of this vault. See existing list                 above."
      },
      setting: "repositoryInclude",
      options: repos
    }).mount();
    new SymlinkSettingToggleController({
      title: "",
      description: "",
      container: containerEl,
      plugin: this.plugin,
      input: {
        name: "Whitelist mode",
        description: "Should symlinked repositories be indexed based                 on the repository blacklist or whitelist?"
      },
      setting: "isWhitelist"
    }).mount();
  }
};

// src/main.ts
var Symlink = class extends import_obsidian5.Plugin {
  constructor() {
    super(...arguments);
    __publicField(this, "vaultDirname");
    __publicField(this, "localDirname");
    __publicField(this, "settings");
    __publicField(this, "repos");
    __publicField(this, "filteredRepos");
    __publicField(this, "fileTree");
    __publicField(this, "fileTreeObserver");
  }
  async onload() {
    this.vaultDirname = this.app.vault.adapter.basePath;
    this.localDirname = path2.join(this.vaultDirname, "../");
    await this.loadSettings();
    this.addSettingTab(new SymlinkSettingsTab(this.app, this));
    this.updateRepos();
    this.addRibbonIcon("folder-symlink", "Symlink repositories", () => {
      this.symlinkRepos();
    });
    this.addCommand({
      id: "obsidian-symlink-repos",
      name: "Symlink repositories",
      callback: () => this.symlinkRepos()
    });
    this.app.workspace.onLayoutReady(() => this.watchTree());
  }
  async onunload() {
    this.unwatchTree();
    await this.saveSettings();
  }
  async loadSettings() {
    this.settings = Object.assign(DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  updateRepos() {
    this.repos = this.getRepos();
    this.filteredRepos = this.filterRepos();
  }
  getRepos(dirname = this.localDirname) {
    const repos = [];
    for (const pathname of fs.readdirSync(dirname)) {
      const absolutePath = path2.join(dirname, pathname);
      if (!fs.existsSync(absolutePath)) {
        continue;
      }
      if (fs.statSync(absolutePath).isFile()) {
        continue;
      } else if (fs.existsSync(`${absolutePath}/.git`)) {
        repos.push(path2.relative(this.localDirname, absolutePath));
        continue;
      }
      repos.push(...this.getRepos(absolutePath));
    }
    return repos;
  }
  filterRepos() {
    const filteredRepos = [];
    for (const repo of this.repos) {
      if (this.settings.isWhitelist) {
        if (this.settings.repositoryInclude.includes(repo)) {
          filteredRepos.push(repo);
        }
      } else if (!this.settings.repositoryIgnore.includes(repo)) {
        filteredRepos.push(repo);
      }
    }
    return filteredRepos;
  }
  getRepoFiles(repo, searchVault = false, dir = "") {
    const dirname = path2.join(
      searchVault ? this.vaultDirname : this.localDirname,
      repo,
      dir
    );
    const files = [];
    if (!fs.existsSync(dirname)) {
      return files;
    }
    for (const pathname of fs.readdirSync(dirname)) {
      const absolutePath = path2.join(dirname, pathname);
      const relativePath = path2.join(dir, pathname);
      if (fs.statSync(absolutePath).isFile()) {
        if (path2.extname(absolutePath) === ".md") {
          files.push(relativePath);
        }
        continue;
      }
      let shouldIgnore = false;
      for (const pathname2 of this.settings.repositoryDirIgnore) {
        if (relativePath.includes(pathname2)) {
          shouldIgnore = true;
          break;
        }
      }
      if (shouldIgnore) {
        continue;
      }
      files.push(...this.getRepoFiles(repo, searchVault, relativePath));
    }
    return files;
  }
  symlinkRepos() {
    this.updateRepos();
    for (const repo of this.repos) {
      if (this.filteredRepos.includes(repo)) {
        if (!fs.existsSync(path2.join(this.vaultDirname, repo))) {
          this.symlinkRepo(repo);
        } else {
          const event = this.app.vault.on("delete", (file) => {
            if (file.path === repo) {
              this.app.vault.offref(event);
              this.symlinkRepo(repo);
            }
          });
          this.removeVaultRepo(repo);
        }
      } else {
        this.removeVaultRepo(repo);
      }
    }
  }
  symlinkRepo(repo) {
    this.addVaultRepo(repo);
    for (const link of this.settings.repositoryDirLink) {
      this.symlinkRepoDirectory(repo, link);
    }
    const files = this.getRepoFiles(repo);
    for (const file of files) {
      this.symlinkFile(repo, file);
    }
  }
  removeVaultRepo(repo) {
    let vaultPath = path2.join(this.vaultDirname, repo);
    if (fs.existsSync(vaultPath)) {
      fs.rmSync(vaultPath, { recursive: true, force: true });
    }
    while (repo) {
      repo = repo.replace(/(\/|^)[^/]*\/?$/, "");
      vaultPath = path2.join(this.vaultDirname, repo);
      if (!fs.existsSync(vaultPath)) {
        continue;
      }
      if (!fs.readdirSync(vaultPath).length) {
        fs.rmdirSync(vaultPath);
      }
    }
  }
  addVaultRepo(repo) {
    const vaultPath = path2.join(this.vaultDirname, repo);
    if (!fs.existsSync(vaultPath)) {
      fs.mkdirSync(vaultPath, { recursive: true });
    }
  }
  symlinkRepoDirectory(repo, link) {
    const target = path2.join(this.localDirname, repo, link);
    if (!fs.existsSync(target)) {
      return;
    }
    const destination = path2.join(this.vaultDirname, repo, link);
    const parentPath = path2.join(destination, "../");
    if (!fs.existsSync(parentPath)) {
      fs.mkdirSync(parentPath, { recursive: true });
    }
    if (fs.existsSync(destination)) {
      fs.rmdirSync(destination);
    }
    fs.symlinkSync(target, destination);
  }
  symlinkFile(repo, file) {
    const target = path2.join(this.localDirname, repo, file);
    if (!fs.existsSync(target)) {
      return;
    }
    let shouldIgnore = false;
    for (const pathname of this.settings.repositoryDirLink) {
      if (file.includes(pathname)) {
        shouldIgnore = true;
        break;
      }
    }
    if (shouldIgnore) {
      return;
    }
    const destination = path2.join(this.vaultDirname, repo, file);
    const parentPath = path2.join(destination, "../");
    if (!fs.existsSync(parentPath)) {
      fs.mkdirSync(parentPath, { recursive: true });
    }
    if (fs.existsSync(destination)) {
      fs.rmSync(destination);
    }
    fs.symlinkSync(target, destination);
  }
  watchTree() {
    const tree = document.querySelector(".nav-files-container");
    if (!tree) {
      return;
    }
    this.fileTree = tree;
    this.highlightTree();
    const options = { childList: true, subtree: true };
    this.fileTreeObserver = new MutationObserver((mutations) => {
      let shouldHighlight = false;
      DATA_PATH_MUTATION:
        for (const mutation of mutations) {
          for (const node of Array.from(mutation.addedNodes)) {
            if (node.querySelector("[data-path]")) {
              shouldHighlight = true;
              break DATA_PATH_MUTATION;
            }
          }
        }
      if (shouldHighlight) {
        this.fileTreeObserver.disconnect();
        this.highlightTree();
        this.fileTreeObserver.observe(this.fileTree, options);
      }
    });
    this.fileTreeObserver.observe(this.fileTree, options);
  }
  unwatchTree(observer = this.fileTreeObserver) {
    if (!observer) {
      return;
    }
    observer.disconnect();
  }
  highlightTree(tree = this.fileTree) {
    var _a;
    if (!tree) {
      return;
    }
    const dataPath = tree.getAttribute("data-path");
    if (dataPath) {
      let shouldHighlight = false;
      let isSymlinkChild = false;
      let isLinked = true;
      let isIgnored = false;
      for (const repo of this.filteredRepos) {
        if (dataPath.startsWith(repo)) {
          shouldHighlight = true;
          isLinked = this.settings.repositoryDirLink.includes(
            path2.relative(repo, dataPath)
          );
          isIgnored = this.settings.repositoryDirIgnore.includes(
            path2.relative(repo, dataPath)
          );
          for (const link of this.settings.repositoryDirLink) {
            if (dataPath.startsWith(path2.join(repo, link))) {
              isSymlinkChild = true;
              break;
            }
          }
          break;
        }
      }
      const icon = tree.querySelector(".tree-symlink-icon") || document.createElement("div");
      icon.classList.add("tree-item-icon", "tree-symlink-icon");
      (_a = icon.firstChild) == null ? void 0 : _a.remove();
      const absolutePath = path2.join(this.vaultDirname, dataPath);
      if (!fs.existsSync(absolutePath)) {
        return;
      }
      const isFile = fs.statSync(absolutePath).isFile();
      const isSymlink = fs.lstatSync(absolutePath).isSymbolicLink();
      if (isFile && isSymlink && shouldHighlight) {
        (0, import_obsidian5.setIcon)(icon, "file-symlink");
      } else if (isFile && shouldHighlight && !isSymlinkChild) {
        (0, import_obsidian5.setIcon)(icon, "alert-circle");
        icon.style.color = "var(--color-orange)";
      } else if (isSymlink && shouldHighlight) {
        (0, import_obsidian5.setIcon)(icon, "folder-symlink");
        if (!isLinked) {
          icon.style.color = "var(--color-orange)";
        }
      } else if (isIgnored && shouldHighlight) {
        (0, import_obsidian5.setIcon)(icon, "alert-circle");
        icon.style.color = "var(--color-orange)";
      } else {
        if (this.filteredRepos.includes(dataPath)) {
          (0, import_obsidian5.setIcon)(icon, "check-circle-2");
          icon.style.color = "var(--color-green)";
        } else if (this.repos.includes(dataPath)) {
          (0, import_obsidian5.setIcon)(icon, "alert-circle");
          icon.style.color = "var(--color-orange)";
        }
      }
      tree == null ? void 0 : tree.appendChild(icon);
    }
    for (const child of Array.from(tree.children)) {
      this.highlightTree(child);
    }
  }
};
var main_default = Symlink;

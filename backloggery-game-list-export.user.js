// ==UserScript==
// @name     Backloggery Game List Export
// @author   Xiyng
// @version  0.1
// @include  https://backloggery.com/games.php?*
// ==/UserScript==

"use strict";

const EXPORT_BUTTON_CLASS = "exportbutton";
const FILE_NAME = "games.txt";
const FILE_MIME_TYPE = "text/plain";

class Platform {
    constructor(name) {
        this.name = name;
        this.games = [];
    }
  
    addGame(game) {
        this.games.push(game);
    }

    getGames() {
        return Array.from(this.games);
    }
}

class Game {
    constructor(name) {
        this.name = name;
    }
}

initialize();

function initialize() {
    createUi();

    const exportButton = document.getElementsByClassName(EXPORT_BUTTON_CLASS)[0];
    exportButton.addEventListener("click", handleExportButtonClick);
}

function createUi() {
    const sideBar = document.querySelector("#content > aside");
    const exportSection = document.createElement("section");
    // Definitely not a filterbox but it's what we've got to work with.
    exportSection.className = "filterbox";

    const title = document.createElement("h1");
    title.className = "spoot";
    title.style.padding = "0";
    title.textContent = "Export"

    const helpText = document.createElement("p");
    helpText.textContent = "Export the game list to a file. Exports only games that are currently visible on the list, i.e. you might want to click 'Show more games' until there are no more games.";

    const exportButton = document.createElement("input");
    exportButton.className = EXPORT_BUTTON_CLASS;
    exportButton.type = "button";
    exportButton.value = "Export List";

    exportSection.appendChild(title);
    exportSection.appendChild(helpText);
    exportSection.appendChild(exportButton);
    sideBar.appendChild(exportSection);
}

function handleExportButtonClick() {
    generateAndDownloadFile();
}

function generateAndDownloadFile() {
    const fileContent = generateFileContent();
    downloadFile(fileContent);
}

function generateFileContent() {
    const platforms = parsePlatforms();
    const rows = generateFileRowsFromPlatforms(platforms);
    return rows.join("\n");
}

function parsePlatforms() {
    let listElement =
        document.querySelector("#maincolumn .system") ||
        document.querySelector("#maincolumn .gamebox");
    if (!listElement) {
        return [];
    }
    let list = listElement.parentElement;
    const children = list.children;
    const platforms = [];
    let latestPlatform = null;
    for (const child of children) {
        const childClasses = child.classList;
        if (childClasses.contains("system")) {
            const platformName = child.innerText.trim();
            const platform = new Platform(platformName);
            platforms.push(platform);
            latestPlatform = platform;
        } else if (childClasses.contains("gamebox") && !childClasses.contains("systemend")) {
            if (!latestPlatform) {
                throw new Error("A game is not under a platform section.");
            }
            const gameName = child.getElementsByTagName("h2")[0].innerText.replace("▼", "").trim();
            const game = new Game(gameName);
            latestPlatform.addGame(game);
        } else {
            // unknown element type
        }
    }
    return platforms;
}

function generateFileRowsFromPlatforms(platforms) {
    const rows = [];
    rows.push("# Games");
    for (const platform of platforms) {
        rows.push("");
        rows.push(`## ${platform.name}`);
        rows.push("");
        const games = platform.getGames();
        for (const game of games) {
            rows.push(`- ${game.name}`);
        }
    }
    return rows;
}

function downloadFile(fileContent) {
    const blob = new Blob([fileContent], {type: FILE_MIME_TYPE});
    const downloadElement = document.createElement("a");
    const downloadUrl = window.URL.createObjectURL(blob);
    downloadElement.href = downloadUrl;
    downloadElement.download = FILE_NAME;
    document.body.appendChild(downloadElement);
    downloadElement.click();
    downloadElement.remove();
    window.URL.revokeObjectURL(downloadUrl);
}
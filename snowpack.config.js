/** @type {import("snowpack").SnowpackUserConfig} */
module.exports = {
    "exclude": [
        "server/*",
        "ocr/**/*",
        ".git/**/*",
        ".github/**/*",
        ".gitignore",
        "package**.json",
        "*/**/tsconfig.json"
    ]
}
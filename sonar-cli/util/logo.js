exports.printLogo = function (msg) {
  console.log(Buffer.from(LOGO, 'base64').toString())
  if (msg) console.log(msg)
}

// Recreate with:
// toilet sonar -f big -F crop:metal:rainbow | base64
const LOGO = `
IBtbMDsxOzM1Ozk1bV8bWzA7MTszMTs5MW1fXxtbMG0gIBtbMDsxOzMyOzkybV9fG1swOzE7MzY7
OTZtXxtbMG0gIBtbMDsxOzM0Ozk0bV8bWzBtIBtbMDsxOzM1Ozk1bV8bWzA7MTszMTs5MW1fG1sw
bSAgIBtbMDsxOzMyOzkybV9fG1swbSAbWzA7MTszNjs5Nm1fG1swbSAbWzA7MTszNDs5NG1fG1sw
bSAbWzA7MTszNTs5NW1fG1swOzE7MzE7OTFtXxtbMG0gChtbMDsxOzMxOzkxbS8bWzBtIBtbMDsx
OzMzOzkzbV9fG1swOzE7MzI7OTJtfC8bWzBtIBtbMDsxOzM2Ozk2bV8bWzBtIBtbMDsxOzM0Ozk0
bVwbWzA7MTszNTs5NW18G1swbSAbWzA7MTszMTs5MW0nXxtbMG0gG1swOzE7MzM7OTNtXBtbMG0g
G1swOzE7MzI7OTJtLxtbMG0gG1swOzE7MzY7OTZtXxtbMDsxOzM0Ozk0bWAbWzBtIBtbMDsxOzM1
Ozk1bXwbWzBtIBtbMDsxOzMxOzkxbSdfG1swOzE7MzM7OTNtX3wbWzBtChtbMDsxOzMzOzkzbVxf
G1swOzE7MzI7OTJtXxtbMG0gG1swOzE7MzY7OTZtXBtbMG0gG1swOzE7MzQ7OTRtKF8bWzA7MTsz
NTs5NW0pG1swbSAbWzA7MTszMTs5MW18G1swbSAbWzA7MTszMzs5M218G1swbSAbWzA7MTszMjs5
Mm18G1swbSAbWzA7MTszNjs5Nm18G1swbSAbWzA7MTszNDs5NG0oXxtbMDsxOzM1Ozk1bXwbWzBt
IBtbMDsxOzMxOzkxbXwbWzBtIBtbMDsxOzMzOzkzbXwbWzBtICAgChtbMDsxOzMyOzkybXxfG1sw
OzE7MzY7OTZtX18bWzA7MTszNDs5NG0vXBtbMDsxOzM1Ozk1bV9fG1swOzE7MzE7OTFtXy8bWzA7
MTszMzs5M218XxtbMDsxOzMyOzkybXwbWzBtIBtbMDsxOzM2Ozk2bXxfG1swOzE7MzQ7OTRtfFwb
WzA7MTszNTs5NW1fXxtbMDsxOzMxOzkxbSxfG1swOzE7MzM7OTNtfF8bWzA7MTszMjs5Mm18G1sw
bSAgIAo=
`

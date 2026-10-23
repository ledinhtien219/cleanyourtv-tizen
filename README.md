# CleanYourTV for TizenBrew

Prototype launcher-style UI for Samsung Tizen TVs running inside TizenBrew.

Target tested/design baseline:
- Samsung RU7200 (2019)
- Tizen 5.0
- TizenBrew 2.x

## Features
- Reads visible installed apps from `tizen.application.getAppsInfo()`
- Builds a five-app dock automatically
- Shows the rest in a TV-friendly grid
- Launches the selected app with `tizen.application.launch(appId)`
- Remote navigation: arrows, OK, Back
- Clock/date and ambient focus glow
- Yellow key refreshes the installed app list

## Install through TizenBrew
Open Module Manager in TizenBrew, choose **Add GitHub Module**, and enter:

`ledinhtien219/cleanyourtv-tizen`

This is a TizenBrew module, not a `.wgt`; no Samsung app certificate is needed for the module itself.

## Limit
Samsung retail Tizen does not let a third-party app replace the TV's Home/Smart Hub button.
CleanYourTV therefore runs as a launcher-like module inside TizenBrew.

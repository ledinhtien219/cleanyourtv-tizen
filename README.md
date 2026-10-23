# CleanYourTV for TizenBrew

A fast launcher-style home screen for Samsung Tizen TVs running inside TizenBrew.

Optimized baseline:
- Samsung RU7200 (2019)
- Tizen 5.0
- TizenBrew 2.x

## v0.2 highlights
- Persistent Favorites saved with localStorage
- Green key pins/unpins the selected app (max 7)
- Fixed 7x3 pagination: only 21 app tiles are rendered at once
- Red/Blue keys switch pages
- Yellow key refreshes installed apps
- D-pad navigation stays spatial instead of jumping across rows
- Conservative filtering of hidden/service-like apps
- Icon fallback to app initials if Tizen icon resources cannot load
- No heavy blur or large scrolling surfaces, improving performance on older TVs
- Launches installed apps with tizen.application.launch(appId)

## Remote controls
- Arrows: move focus
- OK: launch
- Green: pin/unpin favorite
- Red: previous page
- Blue: next page
- Yellow: refresh app list
- Back: return to TizenBrew

## Install through TizenBrew
Open Module Manager in TizenBrew, choose **Add GitHub Module**, and enter:

ledinhtien219/cleanyourtv-tizen

If you already added the module before, refresh/reload the module so TizenBrew pulls version 0.2.0.

## Limit
Samsung retail Tizen does not allow a third-party web app to replace the TV's Home/Smart Hub button. CleanYourTV therefore runs as a launcher-like module inside TizenBrew.

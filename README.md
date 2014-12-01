SitewaertsDocumentViewer
============================

A Document Viewer cordova/phonegap plugin for iOS and Android.

**This project is currently under development and not yet ready to use.**

## Requirements ##

* iOS 6+
* Android 4.1+
* Cordova/Phonegap >=3.6.0

## Installation ##

    cordova plugin add de.sitewaerts.cordova.documentviewer
or    

    cordova plugin add [url-of-the-git-repo]
    
You may replace cordova with phonegap regarding to your needs.

## Usage ##

See https://github.com/sitewaerts/cordova-plugin-document-viewer-sample-app for a working example.

### Common Arguments ###

#### url ####
String pointing to a device local file (e.g. 'file:///...')

#### mimeType ####
Mime type of file. Currently only 'application/pdf' is supported.

#### options ####
```js
options: {
	title: STRING,
	documentView : {
		closeLabel : STRING
	},
	navigationView : {
		closeLabel : STRING
	},
	email : {
		enabled : BOOLEAN
	},
	print : {
		enabled : BOOLEAN
	},
	openWith : {
		enabled : BOOLEAN
	},
	bookmarks : {
		enabled : BOOLEAN
	},
	search : {
		enabled : BOOLEAN
	},
}
```

### Check if a Document File could be shown###
```js
SitewaertsDocumentViewer.canViewDocument(
    url, contentType, options, onPossible, onMissingApp, onImpossible, onError);
```

#### onPossible ####
```js
function(){
  window.console.log('document can be shown');
  //e.g. track document usage
}
```

#### onMissingApp ####
```js
function(appId, installer)
{
    if(confirm("Do you want to install the free PDF Viewer App "
            + appId + " for Android?"))
    {
        installer();
    }
}
```

#### onImpossible ####
```js
function(){
  window.console.log('document cannot be shown');
  //e.g. track document usage
}
```

#### onError ####
```js
function(error){
  window.console.log(error);
  alert("Sorry! Cannot show document.");
}
```


### Open a Document File ###
```js
SitewaertsDocumentViewer.viewDocument(
    url, mimeType, options, onShow, onClose, onMissingApp, onError);
```

#### onShow ####
```js
function(){
  window.console.log('document shown');
  //e.g. track document usage
}
```
#### onClose ####
```js
function(){
  window.console.log('document closed');
  //e.g. remove temp files
}
```
#### onMissingApp ####
```js
function(id, installer)
{
    if(confirm("Do you want to install the free PDF Viewer App "
            + appId + " for Android?"))
    {
        installer();
    }
} 
```
#### onError ####
```js
function(error){
  window.console.log(error);
  alert("Sorry! Cannot view document.");
}
```

## iOS ##

The plugin uses the awesome VFRReader (https://github.com/vfr/Reader) to embbed pdf viewer functionality in the app.


### Screenshots ###

![screenshot](doc/ios/screenshot01.png) &nbsp;&nbsp; ![screenshot](doc/ios/screenshot02.png)


## Android ##

Due to license restrictions in muPDF, the plugin dispatches to a seperate 
(free) viewer app based on muPDF. If the viewer app is not yet installed, the user may be 
redirected to the google play app store.
 
  https://play.google.com/store/apps/details?id=de.sitewaerts.cleverdox.viewer

  https://github.com/sitewaerts/android-document-viewer
 
### Screenshots ###

![screenshot](doc/android/screenshot01.png) &nbsp;&nbsp; ![screenshot](doc/android/screenshot02.png)


## Credits ##

based on https://github.com/vfr/Reader

based on https://github.com/mindstorm/CDVPDFViewer

inspired by https://github.com/pebois/phonegap-plugin-PDFViewer


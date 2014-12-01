Cordova Document Viewer Plugin
============================

A Document Viewer cordova/phonegap plugin for iOS and Android.

**This project is currently in beta stage and may not yet be used in productive environments.**


A common requirement when developing a cordova based app is to embed a
performant and secure inline viewer for pdf files which doesn't allow the user
to extract a copy of the pdf file out of the apps sandbox.

Simple delegation to commonly available viewer apps like Acrobat Reader or
MuPDF is no proper solution, as the app looses control over the pdf file in this case.
The external viewer app may or may not provide features to send the document
via email or save it to the devices disk, which is not acceptable.

This plugin offers a slim API to view PDF files which are either stored in the
apps assets folder (/www/*) or in any other file system directory
available via the cordova file plugin
(e.g. cordova.file.applicationDirectory, cordova.file.dataDirectory).

Online files reachable via http(s) are not supported. Download them to a temp
folder before starting the viewer. You may use the onClose callback
to cleanup the temp dir when the viewer is closed.

Viewer features like "Save as" or Send EMail" are configurable at runtime.

Labels for buttons (i18n) are configurable at runtime.


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

The plugin uses the awesome VFRReader (https://github.com/vfr/Reader) to embed pdf viewer functionality in the app.


### Screenshots ###

![screenshot](doc/ios/screenshot01.png) &nbsp;&nbsp; ![screenshot](doc/ios/screenshot02.png)

![screenshot](doc/ios/screenshot03.png) &nbsp;&nbsp; ![screenshot](doc/ios/screenshot04.png)


## Android ##

**This feature is currently under development and not yet ready to use.**

Due to license restrictions in muPDF, the plugin dispatches to a seperate 
(free) viewer app based on muPDF. If the viewer app is not yet installed, the user may be 
redirected to the google play app store.
 
  https://play.google.com/store/apps/details?id=de.sitewaerts.cleverdox.viewer

  https://github.com/sitewaerts/android-document-viewer
 
### Screenshots ###

![screenshot](doc/android/screenshot01.png) &nbsp;&nbsp; ![screenshot](doc/android/screenshot02.png)


## Missing Features / Known Bugs ##

 Add transparent support for online files.

 The external Viewer App (Android) cannot access files stored in app private
 directories. Due to this fact, the plugin copies a file to a shared temp folder
 before starting the viewer. When the viewer is closed, the temp file is
 immediately deleted. While the viewer is running, a sophisticated user may
 'steel' the file from the shared temp directory. We are still searching for a
 better solution, any good idea is welcome.

 Add support for pdf forms.

 Add fulltext search features.

 Add user bookmark support.

 Add support for additional mime types like dwg, docx etc.

 Optimize user experience for small screens. Currently the viewer components
 are tested and optimized on tablets only.

 Let developers provide graphics for buttons at runtime.




## Credits ##

based on https://github.com/vfr/Reader

based on https://github.com/mindstorm/CDVPDFViewer

inspired by https://github.com/pebois/phonegap-plugin-PDFViewer


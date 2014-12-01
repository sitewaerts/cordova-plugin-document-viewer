# Allgemein #

Der sitewaerts PDF Viewer für Cordova und PhoneGap besteht aus zwei Bausteinen:

* Das PDF-Viewer Plugin beinhaltet die JavaScript API für iOS und Android sowie den nativen Code zur Darstellung der PDF-Dateien für iOS.

* Die PDF-Viewer App für Android beinhaltet als eigenständige App den nativen Code  zur Darstellung der PDF-Dateien unter Android. Das Plugin verwendet unter Android automatisch die App zur Darstellung von PDF.

Für Entwicklung, Test und Evaluation des Plugins steht eine gesonderte PhoneGap App zur Verfügung.


=====================
# iOS #


Umsetzung basierend auf VFRViewer. Änderung an VFRViewer möglichst gering halten, eher neue Klassen daneben stellen.

Source Code des VFRViewer liegt redundant in diesem Projekt unter /tree/master/src/ios.

Contributions machen wir über unseren Clone https://github.com/sitewaerts/Reader

Generell Verhalten und Design wie in iBooks.

**Können wir die original Buttons/Icons aus dem iOS verwenden? Ansonsten liefern wir fehlende Icons auf Anfrage.**

Unterstützung für Hoch- und Querformat PDF.

Unterstützung für Hoch- und Querausrichtung des Geräts.

##Features per Laufzeit-Konfiguration ein/ausschalten##

Vgl. dazu Javascript API des Plugins

The behaviour currently predefined via compile time options like READER_ENABLE_MAIL, READER_ENABLE_PRINT, etc. should be configurable when launching the viewer. There should be a switch (enable/disable) for any build in feature:
* Open with / Send to
* Print
* Send E-Mail
* Bookmark


##Dokument-View##

Oben links Buttons
* Fertig/Done: Schliesst Dokument-View, kehrt zur aufrufenden App zurück
* Navigations-View aufrufen
    - Automatisch ausblenden bei Dokumenten mit nur einer Seite

Oben Mitte
* Dateiname (wird bei fehlendem Platz abgeschnitten)

Oben rechts Buttons
* Darstellungen
    - Einzelseite
    - Doppelseite
* Automatisch ausblenden bei Dokumenten mit nur einer Seite
    - Doppelseite mit Cover
* Automatisch ausblenden bei Dokumenten mit nur einer Seite
    - Funktionen (Open with, etc. ), ausblendbar

Mini-Thumbnail-Navigation unten
* Automatisch ausblenden wenn
    - Einzelansicht aktiv und Dokument nur eine Seite hat
    - Doppelansicht aktiv und Dokument nur zwei Seiten hat

##Navigations-View##
Der Button (…) oben links startet aus dem Dokument-View den (Vollbild-) Navigations-View. Dieser hat einen „Zurück“ Button der zurück zum Dokument-View geht.

Im Navigationsview kann über zwei Icons rechts oben zwischen verschiedenen Darstellungen umgeschaltet werden:
* Thumbs
* Inhaltsbaum (Dokument Outline)

Der Navigationsview merkt sich die zuletzt aktivierte Ansicht.

##I18n / Labels##
Fenster-Titel wird zur Laufzeit übergeben.

Labels für Button “Fertig” im Dokument-View und Button “Zurück” im Navigationsview werden zur Laufzeit übergeben.

Text bei Anzeige der aktuellen Seitennummer „<x> of <n>“ wird ersetzte durch „<x> / <n>“.


=====================
# Android #

Aus lizenzrechtlichen Gründen muss die Android Viewer Funktion in Form einer eigenständigen App im Google Play Appstore bereitgestellt werden. Ruft ein Benutzer den Player über den Button auf, prüft die App ob die eigenständige Viewer App auf dem Gerät installiert ist. Wenn die App nicht installiert ist, wird eine entsprechende Meldung inkl. eines Links zum Google Play Appstore angezeigt. Die Viewer App ist kostenlos und wird von sitewaerts bereitgestellt (Name z.B. „sitewaerts PDF“). Die Verwendung der Adobe Reader App ist aus vielfältigen technischen Gründen nicht möglich. Für den Benutzer verhält sich der Viewer nach der Installation nahezu wie eine vollständig integrierte Lösung. Zukünftig können die fehlenden Funktionen im Android-Viewer ergänzt werden.

Im Plugin ist also nur der JavaSript und Java Code zum Laden bzw. Aufruf der externen App über ein spezielles Intent enthalten.


Wichtig: PDF Files müssen für die Viewer App zugänglich gemacht werden.
Daher muss das Plugin Dateien die in geschützten Verzecihnissen liegen
erst in einen Shared temp Folder kopieren.
Wichtig: Nachher auch sofort wieder löschen!

 Am besten wäre es, zu prüfen, ob die Viewer App auf die Datei zugreifen darf.
 Wenn nicht, daa ein Temp-File anlegen. Damit sparen wir uns unnötige Kopiervorgänge.
 Falls erfordelrich kann das ganze auch ims Javscript Teil umgesetzt werden.
 Allerdings soll der nach Möglichkeit keinen OS-Spezifischen Code enthalten.








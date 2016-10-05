angular-winjs
=============

Project to smooth the AngularJS/WinJS interaction. This code is a shim layer which facilitates usage of WinJS UI controls in an Angular Windows application. It achieves this by creating directives for the various controls which allow them to show up in Angular markup like:

How to use this in your Angular project?
----------------------------------------

Just make sure to include WinJS 4.0, and then include the shim.

    <script src="base.js"></script>
    <script src="ui.js"></script>
    <script src="angular-winjs.js"></script>
    
You must also add this module to your list of angular module dependencies:

    angular.module('your-module', ['winjs', 'other-module-you-depend-on', 'etc']);


Examples of control usage
-------------------------

### AppBar and AppBarCommand

    <!-- Shows up on the bottom of the screen, use right-click or touch edgy gesture to show -->
    <win-app-bar>
        <win-app-bar-command icon="'home'" label="'Home'"></win-app-bar-command>
        <win-app-bar-separator></win-app-bar-separator>
        <win-app-bar-command icon="'save'" label="'Save'"></win-app-bar-command>
        <win-app-bar-content>
            <win-search-box placeholder-text="'Search'"></win-search-box>
        </win-app-bar-content>
        <win-app-bar-command type="'toggle'" icon="'world'" label="'Planet'"></win-app-bar-command>
    </win-app-bar>

### AutoSuggestionBox

    The current query text is: {{queryText}}.<br/>
    <win-auto-suggest-box query-text="queryText"></win-auto-suggest-box>

    
### Content Dialog
    angular.module("yourAngularApp", ["winjs"]).controller("yourController", function ($scope) {
        $scope.contentDialogHidden = true;
        $scope.showContentDialog = function () {
            $scope.contentDialogHidden = false;
        };
    });
    <win-content-dialog primary-command-text="'Primary Command'" secondary-command-text="'Secondary Command'" title="'Title'" hidden="contentDialogHidden">
        Add your content here
    </win-content-dialog>
    <button ng-click="showContentDialog()">Show Dialog</button>

### DatePicker

    <win-date-picker current="date" on-change="dateChanged()"></win-date-picker>

### FlipView

    <win-flip-view item-data-source="ratings" on-page-selected="pageSelected()">
        <win-item-template>This flip view item's rating is: {{item.data.rating}}</win-item-template>
    </win-flip-view>

### Flyout

    <button id="flyoutAnchor">Show a flyout!</button>
    <win-flyout anchor="'#flyoutAnchor'">This is the flyout content!!</win-flyout>

### Hub and HubSection

    <win-hub>
        <win-hub-section header="'First section'" is-header-static="true">
          Hubs are useful for varied content
        </win-hub-section>
        <win-hub-section header="'The second section'">
          This hub is boring however, it just has things like data bindings: {{ratings.length}}
        </win-hub-section>
        <win-hub-section header="'The tail...'">
          Because it's only purpose is to show how to create a hub
        </win-hub-section>
    </win-hub>

### ItemContainer

    <win-item-container>
      An ItemContainer is a wrapper around content that adds pressed
      and cross-slide selection behaviors!
    </win-item-container>

### ListView

    <div>Selected count: {{selection.length}}, indexes: {{selection.toString()}}</div>
    <win-list-view item-data-source="ratings" selection="selection">
        <win-list-view-header>This is a ListView header</win-list-view-header>
        <win-item-template>This list view item's rating is: {{item.data.rating}}</win-item-template>
        <win-list-layout></win-list-layout>
        <win-list-view-footer>This is a ListView footer</win-list-view-footer>
    </win-list-view>

### Menu and MenuCommand

    <button id="menuAnchor">Show a menu!</button>
    <win-menu anchor="'#menuAnchor'">
        <win-menu-command label="'command the first'"></win-menu-command>
        <win-menu-command label="'command the second'"></win-menu-command>
        <win-menu-command label="'this would be a great place for ng-repeater...'"></win-menu-command>
    </win-menu>

### Pivot and PivotItem

    <win-pivot>
        <win-pivot-left-header>Custom Left Header</win-pivot-left-header>
        <win-pivot-item header="'First'">
          Pivots are useful for varied content
        </win-pivot-item>
        <win-pivot-item header="'Second'">
          This Pivot  is boring however, it just has things like data bindings: {{ratings.length}}
        </win-pivot-item>
        <win-pivot-item header="'Tail...'">
          Because it's only purpose is to show how to create a Pivot
        </win-pivot-item>
        <win-pivot-right-header>Custom Right Header</win-pivot-right-header>
    </win-pivot>

### Rating

    The current rating is: {{ratings[0].rating}}.<br/>
    <win-rating max-rating="5" user-rating="ratings[0].rating"></win-rating>

### SemanticZoom

    <win-semantic-zoom>
        <win-list-view item-data-source="data" group-data-source="data.groups">
            <win-item-template>
                The data is: {{item.data}}
            </win-item-template>
            <win-group-header-template>
                The group is: {{item.key}}
            </win-group-header-template>
        </win-list-view>
        <win-list-view item-data-source="data.groups">
            <win-item-template>
                The group is: {{item.key}}
            </win-item-template>
        </win-list-view>
    </win-semantic-zoom>

### SplitView and optional SplitViewPaneToggle
    angular.module("yourAngularApp", ["winjs"]).controller("yourController", function ($scope) {
        $scope.splitViewElement = document.getElementById("splitView");
    });
    <win-split-view-pane-toggle split-view="splitViewElement"></win-split-view-pane-toggle>
    <win-split-view id="splitView">
        <win-split-view-pane>
            SplitView Navigation Pane
            <win-split-view-command label="'Home'" icon="'home'" on-invoked="goToHome()"></win-split-view-command>
            <win-split-view-command label="'Settings'" icon="'settings'" on-invoked="goToSettings()"></win-split-view-command>
        </win-split-view-pane>
        <win-split-view-content>SplitView Content Area</win-split-view-content>
    </win-split-view>

### ToolBar

    <win-tool-bar>
        <win-tool-bar-command label="'This is a ToolBar command'" icon="'add'"></win-tool-bar-command>
        <win-tool-bar-separator></win-tool-bar-separator>
        <win-tool-bar-content>
            <win-search-box placeholder-text="'Search'"></win-search-box>
        </win-tool-bar-content>
    </win-tool-bar>

### TimePicker

    <win-time-picker current="time"></win-time-picker>

### ToggleSwitch
    
    <win-toggle-switch checked="toggleDisabled" label-on="'Other Switch Disabled'" label-off="'Other Switch Enabled'"></win-toggle-switch>
    The state is: {{toggleState}}<br/>
	<win-toggle-switch checked="toggleState" disabled="toggleDisabled"></win-toggle-switch>

### Tooltip

    <win-tooltip>
        <win-tooltip-content>This can have arbitrary content, like images...</win-tooltip-content>
        This has a tooltip, hover and see...
    </win-tooltip>

### WinControl
    <!-- If you ever need access to the WinJS winControl, you can expose it to your Angular scope by using the win-control directive -->
    <win-pivot win-control="pivotWinControl">
        <win-pivot-item header="'Sample'">
          This Pivot is showing how to access its winControl through Angular. 
          The winControl can now be accessed as a variable on the Angular scope, using the same name that was 
          specified in the directive. In this case, $scope.pivotWinControl
        </win-pivot-item>
    </win-pivot>

How to run unit tests
-------------------------

### Install Node
In order run tests, ensure that you have [Node.js](http://nodejs.org/download/) installed. 

### Run the tests
From the local angular-winjs repository
```
npm install
npm test
```


Notes
-----

For all of the controls you can bind to: all public events, and camel cased property names, conveniently map to attributes.
- ```appBar.closedDisplayMode = "compact"``` maps to ```<win-app-bar closed-display-mode="'compact'">```
- ```flipView.onpageselected = pagesSelected()``` maps to ```<win-flip-view on-page-selected="pageSelected($event)">```

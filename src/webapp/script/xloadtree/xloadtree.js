/*----------------------------------------------------------------------------\
|                               XLoadTree 1.1                                 |
|-----------------------------------------------------------------------------|
|                         Created by Erik Arvidsson                           |
|                  (http://webfx.eae.net/contact.html#erik)                   |
|                      For WebFX (http://webfx.eae.net/)                      |
|-----------------------------------------------------------------------------|
| An extension to xTree that allows sub trees to be loaded at runtime by      |
| reading XML files from the server. Works with IE5+ and Mozilla 1.0+         |
|-----------------------------------------------------------------------------|
|                   Copyright (c) 1999 - 2002 Erik Arvidsson                  |
|-----------------------------------------------------------------------------|
| This software is provided "as is", without warranty of any kind, express or |
| implied, including  but not limited  to the warranties of  merchantability, |
| fitness for a particular purpose and noninfringement. In no event shall the |
| authors or  copyright  holders be  liable for any claim,  damages or  other |
| liability, whether  in an  action of  contract, tort  or otherwise, arising |
| from,  out of  or in  connection with  the software or  the  use  or  other |
| dealings in the software.                                                   |
| - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - |
| This  software is  available under the  three different licenses  mentioned |
| below.  To use this software you must chose, and qualify, for one of those. |
| - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - |
| The WebFX Non-Commercial License          http://webfx.eae.net/license.html |
| Permits  anyone the right to use the  software in a  non-commercial context |
| free of charge.                                                             |
| - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - |
| The WebFX Commercial license           http://webfx.eae.net/commercial.html |
| Permits the  license holder the right to use  the software in a  commercial |
| context. Such license must be specifically obtained, however it's valid for |
| any number of  implementations of the licensed software.                    |
| - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - |
| GPL - The GNU General Public License    http://www.gnu.org/licenses/gpl.txt |
| Permits anyone the right to use and modify the software without limitations |
| as long as proper  credits are given  and the original  and modified source |
| code are included. Requires  that the final product, software derivate from |
| the original  source or any  software  utilizing a GPL  component, such  as |
| this, is also licensed under the GPL license.                               |
|-----------------------------------------------------------------------------|
| 2001-09-27 | Original Version Posted.                                       |
| 2002-01-19 | Added some simple error handling and string templates for      |
|            | reporting the errors.                                          |
| 2002-01-28 | Fixed loading issues in IE50 and IE55 that made the tree load  |
|            | twice.                                                         |
| 2002-10-10 | (1.1) Added reload method that reloads the XML file from the   |
|            | server.                                                        |
|-----------------------------------------------------------------------------|
| Dependencies: xtree.js - original xtree library                             |
|               xtree.css - simple css styling of xtree                       |
|               xmlextras.js - provides xml http objects and xml document     |
|                              objects                                        |
|-----------------------------------------------------------------------------|
| Created 2001-09-27 | All changes are in the log above. | Updated 2002-10-10 |
\----------------------------------------------------------------------------*/

webFXTreeConfig.contentTypeIcons = new Array();
webFXTreeConfig.loadingText = "Loading...";
webFXTreeConfig.loadErrorTextTemplate = "Error loading \"%1%\"";
webFXTreeConfig.emptyErrorTextTemplate = "Error \"%1%\" does not contain any tree items";

/*
 * WebFXLoadTree class
 */

function WebFXLoadTree(sText, sXmlSrc, sAction, sBehavior, sIcon, sOpenIcon) {
	// call super
	this.WebFXTree = WebFXTree;
	this.WebFXTree(sText, sAction, sBehavior, sIcon, sOpenIcon);
	
	// setup default property values
	this.src = sXmlSrc;
	//alert("sXmlSrc tree:" + sXmlSrc);
	this.loading = false;
	this.loaded = false;
	this.errorText = "";
	
	// check start state and load if open
	if (this.open)
		_startLoadXmlTree(this.src, this);
	else {
		// and create loading item if not
		this._loadingItem = new WebFXTreeItem(webFXTreeConfig.loadingText);
		this.add(this._loadingItem);
	}
}

WebFXLoadTree.prototype = new WebFXTree;

// override the expand method to load the xml file
WebFXLoadTree.prototype._webfxtree_expand = WebFXTree.prototype.expand;
WebFXLoadTree.prototype.expand = function() {
	if (!this.loaded && !this.loading) {
		// load
		_startLoadXmlTree(this.src, this);
	}
	this._webfxtree_expand();
};

/*
 * WebFXLoadTreeItem class
 */

function WebFXLoadTreeItem(sText, sXmlSrc, sAction, eParent, sIcon, sOpenIcon, hasChildren, isProtected, stateId, isHidden, contentTypeDefinitionId, isLocalized, isLanguageAvailable) {
	
	// call super
	this.WebFXTreeItem = WebFXTreeItem;
	this.WebFXTreeItem(sText, sAction, eParent, sIcon, sOpenIcon, isProtected, stateId, isHidden, contentTypeDefinitionId, isLocalized, isLanguageAvailable);

	// setup default property values
	this.src = sXmlSrc;
	//alert("sXmlSrc tree item:" + sXmlSrc);
	this.loading = false;
	this.loaded = false;
	this.errorText = "";
	
	// check start state and load if open
	if (this.open)
		_startLoadXmlTree(this.src, this);
	else 
	{
		// and create loading item if not
		if(hasChildren == "true")
		{
			this._loadingItem = new WebFXTreeItem(webFXTreeConfig.loadingText);
			this.add(this._loadingItem);
		}
	}
}

WebFXLoadTreeItem.prototype = new WebFXTreeItem;

// override the expand method to load the xml file
WebFXLoadTreeItem.prototype._webfxtreeitem_expand = WebFXTreeItem.prototype.expand;
WebFXLoadTreeItem.prototype.expand = function() {
	if (!this.loaded && !this.loading) {
		// load
		_startLoadXmlTree(this.src, this);
	}
	this._webfxtreeitem_expand();
};

// reloads the src file if already loaded
WebFXLoadTree.prototype.reload = 
WebFXLoadTreeItem.prototype.reload = function () {
	// if loading do nothing
	if (this.loaded) {
		var open = this.open;

		while (this.childNodes.length > 0)
			this.childNodes[this.childNodes.length - 1].remove();
		
		this.loaded = false;
		
		this._loadingItem = new WebFXTreeItem(webFXTreeConfig.loadingText);
		this.add(this._loadingItem);
		
		if (open)
			this.expand();
	}
	else if (this.open && !this.loading)
		_startLoadXmlTree(this.src, this);
};

/*
 * Helper functions
 */

// creates the xmlhttp object and starts the load of the xml document
function _startLoadXmlTree(sSrc, jsNode) {
	if (jsNode.loading || jsNode.loaded)
		return;
	jsNode.loading = true;
	var xmlHttp = XmlHttp.create();
	
	// Replace 
	sSrc = sSrc.replace("+", "&");

	xmlHttp.open("GET", sSrc, true);	// async
	xmlHttp.onreadystatechange = function () {
		if (xmlHttp.readyState == 4) {
			_xmlFileLoaded(xmlHttp.responseXML, jsNode);
		}
	};
	// call in new thread to allow ui to update
	window.setTimeout(function () {
		xmlHttp.send(null);
	}, 10);
}


// Converts an xml tree to a js tree. See article about xml tree format
function _xmlTreeToJsTree(oNode) {
	// retreive attributes
	var text = oNode.getAttribute("text");
	var action = oNode.getAttribute("action");
	var parent = null;
	var icon = oNode.getAttribute("icon");
	var openIcon = oNode.getAttribute("openIcon");
	var src = oNode.getAttribute("src");
	var isHidden = oNode.getAttribute("isHidden");
	var isLocalized = oNode.getAttribute("isLocalized");
	var isLanguageAvailable = oNode.getAttribute("isLanguageAvailable");
	var contentTypeDefinitionId = oNode.getAttribute("contentTypeDefinitionId");
	//alert("isHidden:" + isHidden);
	//alert("src:" + src + ":" + hidden);
	var hasChildren = oNode.getAttribute("hasChildren");
	var isProtected = oNode.getAttribute("isProtected");
	var stateId = oNode.getAttribute("stateId");
	
	// Stefan Sik addition 20041120
	var type = oNode.getAttribute("type");
	if(type.indexOf("Folder") > -1)
	{
		if(isHidden == "true")
		{
			if(isProtected == 'true')
				icon = webFXTreeConfig.hiddenProtectedFolderIcon;
			else
				icon = webFXTreeConfig.hiddenFolderIcon;
		}
		else
		{
			if(isProtected == 'true')
				icon = webFXTreeConfig.protectedFolderIcon;
			else
				icon = webFXTreeConfig.folderIcon;
		}
			
		if(isHidden == "true")
			if(isProtected == 'true')
				openIcon = webFXTreeConfig.hiddenProtectedOpenFolderIcon;
			else
				openIcon = webFXTreeConfig.hiddenOpenFolderIcon;
		else
		{
			if(isProtected == 'true')
				openIcon = webFXTreeConfig.protectedOpenFolderIcon;
			else
				openIcon = webFXTreeConfig.openFolderIcon;
		}
	}
	
	if(contentTypeDefinitionId)
	{
		var contentTypeIcon = webFXTreeConfig.contentTypeIcons[contentTypeDefinitionId];
		var contentTypeIconHiddenIcon = webFXTreeConfig.contentTypeIcons[contentTypeDefinitionId + "_hiddenIcon"];
		var contentTypeIconProtectedIcon = webFXTreeConfig.contentTypeIcons[contentTypeDefinitionId + "_protectedIcon"];
		var contentTypeIconFolderIcon = webFXTreeConfig.contentTypeIcons[contentTypeDefinitionId + "_folderIcon"];
		var contentTypeIconOpenFolderIcon = webFXTreeConfig.contentTypeIcons[contentTypeDefinitionId + "_openFolderIcon"];
		var contentTypeIconHiddenFolderIcon = webFXTreeConfig.contentTypeIcons[contentTypeDefinitionId + "_hiddenFolderIcon"];
		var contentTypeIconHiddenOpenFolderIcon = webFXTreeConfig.contentTypeIcons[contentTypeDefinitionId + "_hiddenOpenFolderIcon"];
		var contentTypeIconProtectedFolderIcon = webFXTreeConfig.contentTypeIcons[contentTypeDefinitionId + "_protectedFolderIcon"];
		var contentTypeIconProtectedOpenFolderIcon = webFXTreeConfig.contentTypeIcons[contentTypeDefinitionId + "_protectedOpenFolderIcon"];
		if(contentTypeIcon)
			icon = contentTypeIcon;
		
		if(contentTypeIconOpenFolderIcon)
			openIcon = contentTypeIconOpenFolderIcon;

		if(type.indexOf("Folder") > -1)
		{
			if(isHidden == "true" && contentTypeIconHiddenFolderIcon)
				icon = contentTypeIconHiddenFolderIcon;
			else
			{
				if(isProtected == 'true' && contentTypeIconProtectedFolderIcon)
					icon = contentTypeIconProtectedFolderIcon;
				else if(contentTypeIconFolderIcon)
					icon = contentTypeIconFolderIcon;
			}
				
			if(isHidden == "true")
				openIcon = contentTypeIconHiddenOpenFolderIcon;
			else
			{
				if(isProtected == 'true' && contentTypeIconProtectedOpenFolderIcon)
					openIcon = contentTypeIconProtectedOpenFolderIcon;
				else if(contentTypeIconOpenFolderIcon)
					openIcon = contentTypeIconOpenFolderIcon;
			}
			
			if(contentTypeIconProtectedFolderIcon)
				icon = contentTypeIconProtectedFolderIcon;
	
			if(contentTypeIconProtectedOpenFolderIcon)
				openIcon = contentTypeIconProtectedOpenFolderIcon;
		}
		else
		{
			if(isHidden == "true" && contentTypeIconHiddenIcon)
				icon = contentTypeIconHiddenIcon;
			else
			{
				if(isProtected == 'true' && contentTypeIconProtectedIcon)
					icon = contentTypeIconProtectedIcon;
				else if(contentTypeIcon)
					icon = contentTypeIcon;
			}							
		}
	}
	
	// Addition end
	
	// create jsNode
	var jsNode;
	if (src != null && src != "")
		jsNode = new WebFXLoadTreeItem(text, src, action, parent, icon, openIcon, hasChildren, isProtected, stateId, isHidden, contentTypeDefinitionId, isLocalized, isLanguageAvailable);
	else
		jsNode = new WebFXTreeItem(text, action, parent, icon, openIcon, isProtected, stateId, isHidden, contentTypeDefinitionId, isLocalized, isLanguageAvailable);
		

	jsNode.myType = type;
	jsNode.myId = oNode.getAttribute("id");
	
	// go through childNOdes
	var cs = oNode.childNodes;
	var l = cs.length;
	for (var i = 0; i < l; i++) {
		if (cs[i].tagName == "tree")
			jsNode.add( _xmlTreeToJsTree(cs[i]), true );
	}
	
	return jsNode;
}

// Inserts an xml document as a subtree to the provided node
function _xmlFileLoaded(oXmlDoc, jsParentNode) {
	if (jsParentNode.loaded)
		return;


	var bIndent = false;
	var bAnyChildren = false;
	jsParentNode.loaded = true;
	jsParentNode.loading = false;

	// check that the load of the xml file went well
	if( oXmlDoc == null || oXmlDoc.documentElement == null) {
		//alert("" + oXmlDoc.xml);
		jsParentNode.errorText = parseTemplateString(webFXTreeConfig.loadErrorTextTemplate,
							jsParentNode.src);
	}
	else {
		// there is one extra level of tree elements
		var root = oXmlDoc.documentElement;

		// loop through all tree children
		var cs = root.childNodes;
		var l = cs.length;
		for (var i = 0; i < l; i++) {
			if (cs[i].tagName == "tree") {
				bAnyChildren = true;
				bIndent = true;
				jsParentNode.add( _xmlTreeToJsTree(cs[i]), true);
			}
		}

		// if no children we got an error
		/*
		if (!bAnyChildren)
			jsParentNode.errorText = parseTemplateString(webFXTreeConfig.emptyErrorTextTemplate,
										jsParentNode.src);
		*/
		if (!bAnyChildren)
		{
		}
	}
	
	// remove dummy
	if (jsParentNode._loadingItem != null) {
		jsParentNode._loadingItem.remove();
		bIndent = true;
	}
	
	if (bIndent) {
		// indent now that all items are added
		jsParentNode.indent();
	}
	
	// show error in status bar
	if (jsParentNode.errorText != "")
		; //alert(jsParentNode.errorText);
		// window.status = jsParentNode.errorText;
		
	// alert(jsParentNode.myType);
	
}

// parses a string and replaces %n% with argument nr n
function parseTemplateString(sTemplate) {
	var args = arguments;
	var s = sTemplate;
	
	s = s.replace(/\%\%/g, "%");
	
	for (var i = 1; i < args.length; i++)
		s = s.replace( new RegExp("\%" + i + "\%", "g"), args[i] )
	
	return s;
}
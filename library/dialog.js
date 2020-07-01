// Copyright (C) 2005 Rod Roark <rod@sunsetsystems.com>
// Copyright (C) 2018 Jerry Padgett <sjpadgett@gmail.com>
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.

// open a new cascaded window
function cascwin(url, winname, width, height, options) {
    var mywin = window.parent ? window.parent : window;
    var newx = 25, newy = 25;
    if (!isNaN(mywin.screenX)) {
        newx += mywin.screenX;
        newy += mywin.screenY;
    } else if (!isNaN(mywin.screenLeft)) {
        newx += mywin.screenLeft;
        newy += mywin.screenTop;
    }
    if ((newx + width) > screen.width || (newy + height) > screen.height) {
        newx = 0;
        newy = 0;
    }
    top.restoreSession();

    // MS IE version detection taken from
    // http://msdn2.microsoft.com/en-us/library/ms537509.aspx
    // to adjust the height of this box for IE only -- JRM
    if (navigator.appName == 'Microsoft Internet Explorer') {
        var ua = navigator.userAgent;
        var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) != null)
            rv = parseFloat(RegExp.$1); // this holds the version number
        height = height + 28;
    }

    retval = window.open(url, winname, options +
        ",width=" + width + ",height=" + height +
        ",left=" + newx + ",top=" + newy +
        ",screenX=" + newx + ",screenY=" + newy);

    return retval;
}

// recursive window focus-event grabber
function grabfocus(w) {
    for (var i = 0; i < w.frames.length; ++i) grabfocus(w.frames[i]);
    w.onfocus = top.imfocused;
}

// Call this when a "modal" windowed dialog is desired.
// Note that the below function is free standing for either
// ui's.Use dlgopen() for responsive b.s modal dialogs.
// Can now use anywhere to cascade natives...12/1/17 sjp
//
function dlgOpenWindow(url, winname, width, height) {
    if (top.modaldialog && !top.modaldialog.closed) {
        if (window.focus) top.modaldialog.focus();
        if (top.modaldialog.confirm(top.oemr_dialog_close_msg)) {
            top.modaldialog.close();
            top.modaldialog = null;
        } else {
            return false;
        }
    }
    top.modaldialog = cascwin(url, winname, width, height,
        "resizable=1,scrollbars=1,location=0,toolbar=0");
    // grabfocus(top); // cross origin issues. leave as placeholder for a bit.
    return false;
}

// This is called from del_related() which in turn is invoked by find_code_dynamic.php.
// Deletes the specified codetype:code from the indicated input text element.
function my_del_related(s, elem, usetitle) {
    if (!s) {
        // Deleting everything.
        elem.value = '';
        if (usetitle) {
            elem.title = '';
        }
        return;
    }
    // Convert the codes and their descriptions to arrays for easy manipulation.
    var acodes = elem.value.split(';');
    var i = acodes.indexOf(s);
    if (i < 0) {
        return; // not found, should not happen
    }
    // Delete the indicated code and description and convert back to strings.
    acodes.splice(i, 1);
    elem.value = acodes.join(';');
    if (usetitle) {
        var atitles = elem.title.split(';');
        atitles.splice(i, 1);
        elem.title = atitles.join(';');
    }
}

function dialogID() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return s4() + s4() + s4() + s4() + s4() + +s4() + s4() + s4();
}

/*
* function includeScript(url, async)
*
* @summary Dynamically include JS Scripts or Css.
*
* @param {string} url file location.
* @param {boolean} async true/false load asynchronous/synchronous.
* @param {string} 'script' | 'link'.
*
* */
function includeScript(url, async, type) {

    try {
        let rqit = new XMLHttpRequest();
        if (type === "link") {
            let headElement = document.getElementsByTagName("head")[0];
            let newScriptElement = document.createElement("link")
            newScriptElement.type = "text/css";
            newScriptElement.rel = "stylesheet";
            newScriptElement.href = url;
            headElement.appendChild(newScriptElement);
            console.log('Needed to load:[ ' + url + ' ] For: [ ' + location + ' ]');
            return false;
        }

        rqit.open("GET", url, async); // false = synchronous.
        rqit.send(null);

        if (rqit.status === 200) {
            if (type === "script") {
                let headElement = document.getElementsByTagName("head")[0];
                let newScriptElement = document.createElement("script");
                newScriptElement.type = "text/javascript";
                newScriptElement.text = rqit.responseText;
                headElement.appendChild(newScriptElement);
                console.log('Needed to load:[ ' + url + ' ] For: [ ' + location + ' ]');
                return false; // in case req comes from a submit form.
            }
        }

        throw new Error("Failed to get URL:" + url);

    } catch (e) {
        throw e;
    }

}

// test for and/or remove dependency.
function inDom(dependency, type, remove) {
    let el = type;
    let attr = type === 'script' ? 'src' : type === 'link' ? 'href' : 'none';
    let all = document.getElementsByTagName(el)
    for (let i = all.length; i > -1; i--) {
        if (all[i] && all[i].getAttribute(attr) != null && all[i].getAttribute(attr).indexOf(dependency) != -1) {
            if (remove) {
                all[i].parentNode.removeChild(all[i]);
                console.log("Removed from DOM: " + dependency)
                return true
            } else {
                return true;
            }
        }
    }
    return false;
}

// These functions may be called from scripts that may be out of scope with top so...
// if opener is tab then we need to be in tabs UI scope and while we're at it, let's bring webroot along...
//
if (typeof top.tab_mode === "undefined" && opener) {
    if (typeof opener.top.tab_mode !== "undefined") {
        top.tab_mode = opener.top.tab_mode;
        top.webroot_url = opener.top.webroot_url;
    }
}
// We'll need these if out of scope
//
if (typeof top.set_opener !== "function") {
    var opener_list = [];

    function set_opener(window, opener) {
        top.opener_list[window] = opener;
    }

    function get_opener(window) {
        return top.opener_list[window];
    }
}

// universal alert popup message
if (typeof alertMsg !== "function") {
    function alertMsg(message, timer = 5000, type = 'danger', size = '', persist = '') {
        // example of get php to js variables.
        let isPromise = top.jsFetchGlobals('alert');
        isPromise.then(xl => {
            $('#alert_box').remove();
            let oHidden = '';
            oHidden = !persist ? "hidden" : '';
            let oSize = (size == 'lg') ? 'left:10%;width:80%;' : 'left:25%;width:50%;';
            let style = "position:fixed;top:25%;" + oSize + " bottom:0;z-index:9999;";
            $("body").prepend("<div class='container text-center' id='alert_box' style='" + style + "'></div>");
            let mHtml = '<div id="alertmsg" hidden class="alert alert-' + type + ' alert-dismissable">' +
                '<button type="button" class="btn btn-link ' + oHidden + '" id="dontShowAgain" data-dismiss="alert">' +
                xl.alert.gotIt + '&nbsp;<i class="fa fa-thumbs-up"></i></button>' +
                '<h4 class="alert-heading text-center">' + xl.alert.title + '!</h4><hr>' + '<p style="color:#000;">' + message + '</p>' +
                '<button type="button" class="pull-right btn btn-link" data-dismiss="alert">' + xl.alert.dismiss + '</button></br></div>';
            $('#alert_box').append(mHtml);
            $('#alertmsg').fadeIn(800);
            $('#alertmsg').on('closed.bs.alert', function () {
                clearTimeout(AlertMsg);
                $('#alert_box').remove();
                return false;
            });
            $('#dontShowAgain').on('click', function (e) {
                persistUserOption(persist, 1);
            });
            let AlertMsg = setTimeout(function () {
                $('#alertmsg').fadeOut(800, function () {
                    $('#alert_box').remove();
                });
            }, timer);
        }).catch(error => {
            console.log(error.message)
        });
    }
    const persistUserOption = function (option, value) {
        return $.ajax({
            url: top.webroot_url + "/library/ajax/user_settings.php",
            type: 'post',
            contentType: 'application/x-www-form-urlencoded',
            data: {
                csrf_token_form: top.csrf_token_js,
                target: option,
                setting: value
            },
            beforeSend: function () {
                top.restoreSession;
            },
            error: function (jqxhr, status, errorThrown) {
                console.log(errorThrown);
            }
        });
    };
}

// Test if supporting dialog callbacks and close dependencies are in scope.
// This is useful when opening and closing the dialog is in the same scope. Still use include_opener.js
// in script that will close a dialog that is not in the same scope dlgopen was used
// or use parent.dlgclose() if known decendent.
// dlgopen() will always have a name whether assigned by dev or created by function.
// Callback, onClosed and button clicks are still available either way.
// For a callback on close use: dlgclose(functionName, farg1, farg2 ...) which becomes: functionName(farg1,farg2, etc)
//
if (typeof dlgclose !== "function") {
    if (!opener) {
        if (!top.tab_mode && typeof top.get_opener === 'function') {
            opener = top.get_opener(window.name) ? top.get_opener(window.name) : window;
        } else {
            opener = window;
        }
    }

    function dlgclose(call, args) {
        var frameName = window.name;
        var wframe = opener;
        if (frameName === '') {
            // try to find dialog. dialogModal is embedded dialog class
            // It has to be here somewhere.
            frameName = $(".dialogModal").attr('id');
            if (!frameName) {
                frameName = parent.$(".dialogModal").attr('id');
                if (!frameName) {
                    console.log("Unable to find dialog.");
                    return false;
                }
            }
        }
        if (!top.tab_mode) {
            for (; wframe.name !== 'RTop' && wframe.name !== 'RBot'; wframe = wframe.parent) {
                if (wframe.parent === wframe) {
                    wframe = window;
                }
            }
            for (let i = 0; wframe.document.body.localName !== 'body' && i < 4; wframe = wframe[i++]) {
                if (i === 3) {
                    console.log("Opener: unable to find modal's frame");
                    return false;
                }
            }
            dialogModal = wframe.$('div#' + frameName);
            if (dialogModal.length === 0) {
                // Never give up...
                frameName = $(".dialogModal").attr('id');
                dialogModal = wframe.$('div#' + frameName);
                console.log("Frame: used local find dialog");
            }
        } else {
            var dialogModal = top.$('div#' + frameName);
            wframe = top;
        }

        var removeFrame = dialogModal.find("iframe[name='" + frameName + "']");
        if (removeFrame.length > 0) {
            removeFrame.remove();
        }

        if (dialogModal.length > 0) {
            if (call) {
                wframe.setCallBack(call, args); // sets/creates callback function in dialogs scope.
            }
            dialogModal.modal('hide');
        }
    };
}

/*
* function dlgopen(url, winname, width, height, forceNewWindow, title, opts)
*
* @summary Stackable, resizable and draggable responsive ajax/iframe dialog modal.
*
* @param {url} string Content location.
* @param {String} winname If set becomes modal id and/or iframes name. Or, one is created/assigned(iframes).
* @param {Number| String} width|modalSize(modal-xlg) For sizing: an number will be converted to a percentage of view port width.
* @param {Number} height Initial minimum height. For iframe auto resize starts at this height.
* @param {boolean} forceNewWindow Force using a native window.
* @param {String} title If exist then header with title is created otherwise no header and content only.
* @param {Object} opts Dialogs options.
* @returns {Object} dialog object reference.
* */
function dlgopen(url, winname, width, height, forceNewWindow, title, opts) {
    // First things first...
    top.restoreSession();
    // A matter of Legacy
    if (forceNewWindow) {
        return dlgOpenWindow(url, winname, width, height);
    }

    // wait for DOM then check dependencies needed to run this feature.
    // dependency duration is while 'this' is in scope, temporary...
    // seldom will this get used as more of U.I is moved to Bootstrap
    // but better to continue than stop because of a dependency...
    //
    let jqurl = top.webroot_url + '/public/assets/jquery-1-9-1/jquery.min.js';
    if (typeof jQuery === 'undefined') {
        includeScript(jqurl, false, 'script'); // true is async
    }
    jQuery(function () {
        // Check for dependencies we will need.
        // webroot_url is a global defined in main_screen.php or main.php.
        let bscss = top.webroot_url + '/public/assets/bootstrap/dist/css/bootstrap.min.css';
        let bscssRtl = top.webroot_url + '/public/assets/bootstrap-rtl/dist/css/bootstrap-rtl.min.css';
        let bsurl = top.webroot_url + '/public/assets/bootstrap/dist/js/bootstrap.min.js';
        let jqui = top.webroot_url + '/public/assets/jquery-ui/jquery-ui.min.js';

        let version = jQuery.fn.jquery.split(' ')[0].split('.');
        if ((version[0] < 2 && version[1] < 9) || (version[0] == 1 && version[1] == 9 && version[2] < 1)) {
            inDom('jquery-min', 'script', true);
            includeScript(jqurl, false, 'script');
            console.log('Replacing jQuery version:[ ' + version + ' ]');
        }
        if (!inDom('bootstrap.min.css', 'link', false)) {
            includeScript(bscss, false, 'link');
            if (top.jsLanguageDirection === 'rtl') {
                includeScript(bscssRtl, false, 'link');
            }
        }
        if (typeof jQuery.fn.modal === 'undefined') {
            if (!inDom('bootstrap.min.js', 'script', false))
                includeScript(bsurl, false, 'script');
        }
        if (typeof jQuery.ui === 'undefined') {
            includeScript(jqui, false, 'script');
        }
    });

    // onward

    var opts_defaults = {
        type: 'iframe', // POST, GET (ajax) or iframe
        async: true,
        frameContent: "", // for iframe embedded content
        html: "", // content for alerts, comfirm etc ajax
        allowDrag: true,
        allowResize: true,
        sizeHeight: 'auto', // 'full' will use as much height as allowed
        // use is onClosed: fnName ... args not supported however, onClosed: 'reload' is auto defined and requires no function to be created.
        onClosed: false,
        callBack: false // use {call: 'functionName, args: args, args} if known or use dlgclose.
    };
    if (!opts) var opts = {};

    opts = jQuery.extend({}, opts_defaults, opts);
    opts.type = opts.type ? opts.type.toLowerCase() : '';

    var mHeight, mWidth, mSize, msSize, dlgContainer, fullURL, where; // a growing list...

    if (top.tab_mode) {
        where = opts.type === 'iframe' ? top : window;
    } else { // if frames u.i, this will search for the first body node so we have a landing place for stackable's
        let wframe = window;
        if (wframe.name !== 'left_nav') {
            for (let i = 0; wframe.name !== 'RTop' && wframe.name !== 'RBot' && i < 6; wframe = wframe.parent) {
                if (i === 5) {
                    wframe = window;
                }
                i++;
            }
        } else {
            wframe = top.window['RTop'];
        }
        for (let i = 0; wframe.document.body.localName !== 'body' && i < 6; wframe = wframe[i++]) {
            if (i === 5) {
                alert('Unable to find window to build');
                return false;
            }
        }

        where = wframe; // A moving target for Frames UI.
    }

    // get url straight...
    var fullURL = "";
    if (opts.url) {
        url = opts.url;
    }
    if (url) {
        if (url[0] === "/") {
            fullURL = url
        } else {
            fullURL = window.location.href.substr(0, window.location.href.lastIndexOf("/") + 1) + url;
        }
    }

    // what's a window without a name. important for stacking and opener.
    winname = (winname === "_blank" || !winname) ? dialogID() : winname;

    // Convert dialog size to percentages and/or css class.
    var sizeChoices = ['modal-sm', 'modal-md', 'modal-mlg', 'modal-lg', 'modal-xl'];
    if (Math.abs(width) > 0) {
        width = Math.abs(width);
        mWidth = (width / where.innerWidth * 100).toFixed(4) + '%';
        msSize = '<style>.modal-custom-' + winname + ' {width:' + mWidth + ';}</style>';
        mSize = 'modal-custom' + winname;
    } else if (jQuery.inArray(width, sizeChoices) !== -1) {
        mSize = width; // is a modal class
    } else {
        msSize = '<style>.modal-custom-' + winname + ' {width:35%;}</style>'; // standard B.S. modal default (modal-md)
    }
    // leave below for legacy
    if (mSize === 'modal-sm') {
        msSize = '<style>.modal-custom-' + winname + ' {width:25%;}</style>';
    } else if (mSize === 'modal-md') {
        msSize = '<style>.modal-custom-' + winname + ' {width:40%;}</style>';
    } else if (mSize === 'modal-mlg') {
        msSize = '<style>.modal-custom-' + winname + ' {width:55%;}</style>';
    } else if (mSize === 'modal-lg') {
        msSize = '<style>.modal-custom-' + winname + ' {width:75%;}</style>';
    } else if (mSize === 'modal-xl') {
        msSize = '<style>.modal-custom-' + winname + ' {width:96%;}</style>';
    }
    mSize = 'modal-custom-' + winname;

    // Initial responsive height.
    var vpht = where.innerHeight;
    mHeight = height > 0 ? (height / vpht * 100).toFixed(4) + 'vh' : '';

    // Build modal template. For now !title = !header and modal full height.
    var mTitle = title > "" ? '<h4 class=modal-title>' + title + '</h4>' : '';

    var waitHtml =
        '<div class="loadProgress text-center">' +
        '<span class="fa fa-circle-o-notch fa-spin fa-3x text-primary"></span>' +
        '</div>';

    var headerhtml =
        ('<div class=modal-header><span type=button class="x close" data-dismiss=modal>' +
            '<span aria-hidden=true>&times;</span>' +
            '</span><h5 class=modal-title>%title%</h5></div>')
            .replace('%title%', mTitle);

    var frameHead =
        ('<div><span class="close data-dismiss=modal aria-hidden="true">&times;</span></div>');

    var frameHtml =
        ('<iframe id="modalframe" class="embed-responsive-item modalIframe" name="%winname%" %url% frameborder=0></iframe>')
            .replace('%winname%', winname)
            .replace('%url%', fullURL ? 'src=' + fullURL : '');

    var embedded = 'embed-responsive embed-responsive-16by9';

    var bodyStyles = (' style="margin:2px;padding:2px;height:%initHeight%;max-height:94vh;overflow-y:auto;"')
        .replace('%initHeight%', opts.sizeHeight !== 'full' ? mHeight : '94vh');

    var altClose = '<div class="closeDlgIframe" data-dismiss="modal" ></div>';

    var mhtml =
        ('<div id="%id%" class="modal fade dialogModal" tabindex="-1" role="dialog">%sStyle%' +
            '<style>.modal-backdrop{opacity:0; transition:opacity 1s;}.modal-backdrop.in{opacity:0.2;}</style>' +
            '<div %dialogId% class="modal-dialog %szClass%" role="document">' +
            '<div class="modal-content">' +
            '%head%' + '%altclose%' + '%wait%' +
            '<div class="modal-body %embedded%" %bodyStyles%>' +
            '%body%' + '</div></div></div></div>')
            .replace('%id%', winname)
            .replace('%sStyle%', msSize ? msSize : '')
            .replace('%dialogId%', opts.dialogId ? ('id=' + opts.dialogId + '"') : '')
            .replace('%szClass%', mSize ? mSize : '')
            .replace('%head%', mTitle !== '' ? headerhtml : '')
            .replace('%altclose%', mTitle === '' ? altClose : '')
            .replace('%wait%', '') // maybe option later
            .replace('%bodyStyles%', bodyStyles)
            .replace('%embedded%', opts.type === 'iframe' ? embedded : '')
            .replace('%body%', opts.type === 'iframe' ? frameHtml : '');

    // Write modal template.
    //
    dlgContainer = where.jQuery(mhtml);
    dlgContainer.attr("name", winname);

    // No url and just iframe content
    if (opts.frameContent && opts.type === 'iframe') {
        var ipath = 'data:text/html,' + encodeURIComponent(opts.frameContent);
        dlgContainer.find("iframe[name='" + winname + "']").attr("src", ipath);
    }

    if (opts.buttons) {
        dlgContainer.find('.modal-content').append(buildFooter());
    }
// Ajax setup
    if (opts.type === 'alert') {
        dlgContainer.find('.modal-body').html(opts.html);
    }
    if (opts.type !== 'iframe' && opts.type !== 'alert') {
        var params = {
            async: opts.async,
            method: opts.type || '', // if empty and has data object, then post else get.
            content: opts.data || opts.html, // ajax loads fetched content.
            url: opts.url || fullURL,
            dataType: opts.dataType || '' // xml/json/text etc.
        };

        dialogAjax(params, dlgContainer);
    }

    // let opener array know about us.
    top.set_opener(winname, window);

    // Write the completed template to calling document or 'where' window.
    where.jQuery("body").append(dlgContainer);

    jQuery(function () {
        // DOM Ready. Handle events and cleanup.
        if (opts.type === 'iframe') {
            var modalwin = where.jQuery('body').find("[name='" + winname + "']");
            jQuery('div.modal-dialog', modalwin).css({'margin': '15px auto'});
            modalwin.on('load', function (e) {
                setTimeout(function () {
                    if (opts.sizeHeight === 'auto') {
                        SizeModaliFrame(e, height);
                    } else if (opts.sizeHeight === 'fixed') {
                        sizing(e, height);
                    } else {
                        sizing(e, height); // must be full height of container
                    }
                }, 500);
            });
        }

        dlgContainer.on('show.bs.modal', function () {
            if (opts.allowResize) {
                jQuery('.modal-content', this).resizable({
                    grid: [5, 5],
                    animate: true,
                    animateEasing: "swing",
                    animateDuration: "fast",
                    alsoResize: jQuery('div.modal-body', this)
                })
            }
            if (opts.allowDrag) {
                jQuery('.modal-dialog', this).draggable({
                    iframeFix: true,
                    cursor: false
                });
            }
        }).on('shown.bs.modal', function () {
            // Remove waitHtml spinner/loader etc.
            jQuery(this).parent().find('div.loadProgress')
                .fadeOut(function () {
                    jQuery(this).remove();
                });
            dlgContainer.modal('handleUpdate'); // allow for scroll bar
        }).on('hidden.bs.modal', function (e) {
            // remove our dialog
            jQuery(this).remove();

            // now we can run functions in our window.
            if (opts.onClosed) {
                console.log('Doing onClosed:[' + opts.onClosed + ']');
                if (opts.onClosed === 'reload') {
                    window.location.reload();
                } else {
                    window[opts.onClosed]();
                }
            }
            if (opts.callBack.call) {
                console.log('Doing callBack:[' + opts.callBack.call + '|' + opts.callBack.args + ']');
                if (opts.callBack.call === 'reload') {
                    window.location.reload();
                } else {
                    window[opts.callBack.call](opts.callBack.args);
                }
            }

        }).modal({backdrop: 'static', keyboard: true}, 'show');// Show Modal

        // define local dialog close() function. openers scope
        window.dlgCloseAjax = function (calling, args) {
            if (calling) {
                opts.callBack = {call: calling, args: args};
            }
            dlgContainer.modal('hide'); // important to clean up in only one place, hide event....
            return false;
        };

        // define local callback function. Set with opener or from opener, will exe on hide.
        window.dlgSetCallBack = function (calling, args) {
            opts.callBack = {call: calling, args: args};
            return false;
        };

        // in residents dialog scope
        where.setCallBack = function (calling, args) {
            opts.callBack = {call: calling, args: args};
            return true;
        };

        where.getOpener = function () {
            return where;
        };

        // Return the dialog ref. looking towards deferring...
        return dlgContainer;

    }); // end events
// Ajax call with promise
    function dialogAjax(data, $dialog) {
        var params = {
            async: data.async,
            method: data.method || '',
            data: data.content,
            url: data.url,
            dataType: data.dataType || 'html'
        };

        if (data.url) {
            jQuery.extend(params, data);
        }

        jQuery.ajax(params)
            .done(aOkay)
            .fail(oops);

        return true;

        function aOkay(html) {
            $dialog.find('.modal-body').html(data.success ? data.success(html) : html);

            return true;
        }

        function oops(r, s) {
            var msg = data.error ?
                data.error(r, s, params) :
                '<div class="alert alert-danger">' +
                '<strong>XHR Failed:</strong> [ ' + params.url + '].' + '</div>';

            $dialog.find('.modal-body').html(msg);

            return false;
        }
    }

    function buildFooter() {
        if (opts.buttons === false) {
            return '';
        }
        var oFoot = jQuery('<div>').addClass('modal-footer').prop('id', 'oefooter');
        if (opts.buttons) {
            for (var i = 0, k = opts.buttons.length; i < k; i++) {
                var btnOp = opts.buttons[i];
                if (typeof btnOp.class !== 'undefined') {
                    var btn = jQuery('<button>').addClass('btn ' + (btnOp.class || 'btn-primary'));
                } else { // legacy
                    var btn = jQuery('<button>').addClass('btn btn-' + (btnOp.style || 'primary'));
                    btnOp.style = "";
                }
                for (var index in btnOp) {
                    if (btnOp.hasOwnProperty(index)) {
                        switch (index) {
                            case 'close':
                                //add close event
                                if (btnOp[index]) {
                                    btn.attr('data-dismiss', 'modal');
                                }
                                break;
                            case 'click':
                                //binds button to click event of fn defined in calling document/form
                                var fn = btnOp.click.bind(dlgContainer.find('.modal-content'));
                                btn.click(fn);
                                break;
                            case 'text':
                                btn.html(btnOp[index]);
                                break;
                            case 'class':
                                break;
                            default:
                                //all other possible HTML attributes to button element
                                // name, id etc
                                btn.attr(index, btnOp[index]);
                        }
                    }
                }

                oFoot.append(btn);
            }
        } else {
            //if no buttons defined by user, add a standard close button.
            oFoot.append('<button class="closeBtn btn btn-default" data-dismiss=modal type=button><i class="fa fa-times-circle"></i></button>');
        }

        return oFoot; // jquery object of modal footer.
    }

    // dynamic sizing - special case for full height - @todo use for fixed wt and ht
    function sizing(e, height) {
        let viewPortHt = 0;
        let $idoc = jQuery(e.currentTarget);
        if (top.tab_mode) {
            viewPortHt = Math.max(top.window.document.documentElement.clientHeight, top.window.innerHeight || 0);
            viewPortWt = Math.max(top.window.document.documentElement.clientWidth, top.window.innerWidth || 0);
        } else {
            viewPortHt = window.innerHeight || 0;
            viewPortWt = window.innerWidth || 0;
        }
        let frameContentHt = opts.sizeHeight === 'full' ? viewPortHt : height;
        frameContentHt = frameContentHt > viewPortHt ? viewPortHt : frameContentHt;
        let hasHeader = $idoc.parents('div.modal-content').find('div.modal-header').height() || 0;
        let hasFooter = $idoc.parents('div.modal-content').find('div.modal-footer').height() || 0;
        frameContentHt = frameContentHt - hasHeader - hasFooter;
        size = (frameContentHt / viewPortHt * 100).toFixed(4);
        let maxsize = hasHeader ? 90 : hasFooter ? 86.5 : 95.5;
        maxsize = hasHeader && hasFooter ? 80 : maxsize;
        maxsize = maxsize + 'vh';
        size = size + 'vh';
        $idoc.parents('div.modal-body').css({'height': size, 'max-height': maxsize, 'max-width': '96vw'});

        return size;
    }

    // sizing for modals with iframes
    function SizeModaliFrame(e, minSize) {
        let viewPortHt;
        let idoc = e.currentTarget.contentDocument ? e.currentTarget.contentDocument : e.currentTarget.contentWindow.document;
        jQuery(e.currentTarget).parents('div.modal-content').height('');
        jQuery(e.currentTarget).parent('div.modal-body').css({'height': 0});
        if (top.tab_mode) {
            viewPortHt = top.window.innerHeight || 0;
        } else {
            viewPortHt = where.window.innerHeight || 0;
        }
        //minSize = 100;
        let frameContentHt = Math.max(jQuery(idoc).height(), idoc.body.offsetHeight || 0) + 30;
        frameContentHt = frameContentHt < minSize ? minSize : frameContentHt;
        frameContentHt = frameContentHt > viewPortHt ? viewPortHt : frameContentHt;
        let hasHeader = jQuery(e.currentTarget).parents('div.modal-content').find('div.modal-header').length;
        let hasFooter = jQuery(e.currentTarget).parents('div.modal-content').find('div.modal-footer').length;
        size = (frameContentHt / viewPortHt * 100).toFixed(4);
        let maxsize = hasHeader ? 90 : hasFooter ? 87.5 : 96;
        maxsize = hasHeader && hasFooter ? 80 : maxsize;
        maxsize = maxsize + 'vh';
        size = size + 'vh'; // will start the dialog as responsive. Any resize by user turns dialog to absolute positioning.

        jQuery(e.currentTarget).parent('div.modal-body').css({'height': size, 'max-height': maxsize}); // Set final size. Width was previously set.

        return size;
    }
}

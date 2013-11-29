/*!
 * Copyright (c) 2009 - 2013 Erik van den Berg (http://www.tweego.nl/jeegoopopup)
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php) license.
 * Consider linking back to author's homepage: http://www.tweego.nl
 *
 * Version: 1.0.0
 * Requires jQuery 1.4.2+
 */
(function ($) {
   
    var _popups;
    var _init;
    var _popupsLeft;
    var _fadeIn;

    // Drag & drop & resize vars
    var _dragX;
    var _dragY;
    var _mouseX;
    var _mouseY;
    var _width;
    var _height;

    var _initialize = function () {
        if (!_init) 
        {
            // Add popup container.
            $('body').append(
                '<div id="jg_popup_overlay"></div>' +
                '<div id="jg_popup_inner">' +
                    '<table id="jg_popup_table" cellpadding="0" cellspacing="0" border="0">' +
                        '<tr>' +
                            '<td id="jg_popup_tl"></td>' +
                            '<td id="jg_popup_title"></td>' +
                            '<td id="jg_popup_tr"><div id="jg_popup_close"></div></td>' +
                        '</tr>' +
                        '<tr>' +
                            '<td id="jg_popup_l"></td>' +
                            '<td><div id="jg_popup_content"></div><div id="jg_popup_loader"><div></div></div></td>' +
                            '<td id="jg_popup_r"></td>' +
                        '</tr>' +
                        '<tr>' +
                            '<td id="jg_popup_bl"></td>' +
                            '<td id="jg_popup_b"></td>' +
                            '<td id="jg_popup_br"></td>' +
                        '</tr>' +
                    '</table>' +
                    '<div id="jg_popup_garbage" style="display:none"></div>' +
                '</div>'
            );

            // Set defaults.
            _fadeIn = 300;

            // Init popup list.
            _popups = [];

            _init = true;
        }
    };

    var _position = function (close) {
        if(_popups.length > 0)
        {
            var popup = _popups[_popups.length - 1];
            var css = {
                position: popup.fixed ? 'fixed' : 'absolute'
            };

            if(close)
            {
                $('#jg_popup_inner').css(popup.css);
            }
            else
            {
                var $window = $(window);
                var scrollLeft = $window.scrollLeft();
                var scrollTop = $window.scrollTop();
            
                // Determine x-position popup.
                if(popup.left != undefined) 
                {
                    css.right = 'auto';
                    css.left = popup.fixed ? popup.left + 'px' : scrollLeft + popup.left + 'px';
                }
                else if(popup.right != undefined)
                {
                    css.left = 'auto';
                    css.right = popup.fixed ? popup.right + 'px' : popup.right - scrollLeft + 'px';
                }
                else if(popup.center)
                {
                    css.right = 'auto';
                    var left = ($window.width() - $('#jg_popup_inner').outerWidth()) / 2;
                    css.left = popup.fixed ? left + 'px' : scrollLeft + left + 'px';
                }
                else
                {
                    css.right = 'auto';
                    css.left = popup.fixed ? '0px' : scrollLeft + 'px';
                }

                // Determine y-position popup.
                if(popup.top != undefined) 
                {
                    css.bottom = 'auto';
                    css.top = popup.fixed ? popup.top + 'px' : scrollTop + popup.top + 'px';
                }
                else if(popup.bottom != undefined)
                {
                    css.top = 'auto';
                    css.bottom = popup.fixed ? popup.bottom + 'px' : popup.bottom - scrollTop + 'px';
                }
                else if(popup.center)
                {
                    css.bottom = 'auto';
                    var top = ($window.height() - $('#jg_popup_inner').outerHeight()) / 2;
                    css.top = popup.fixed ? top + 'px' : scrollTop + top + 'px';
                }
                else
                {
                    css.bottom = 'auto';
                    css.top = popup.fixed ? '0px' : scrollTop + 'px';
                }

                $('#jg_popup_inner').css(css);
                popup.css = css;
            }
        }
    };

    var _close = function (args) {
        if (_popups && _popups.length > 0) 
        {
            var index = _popups.length - 1;

            var onClose = _popups[index].onClose;

            // Remove popup's data.
            _popups.pop();

            // Move popup's content to garbage.
            var content = $('#jg_popup_content > div:eq(' + index + ')');

            // Unload all iframes inside content.
            try
            {
                var iframes = content.find('iframe');
                for(var i = 0; i < iframes.length; i++)
                {
                    $(iframes[i]).attr('src', 'about:blank');
                }
            }catch(err){}

            // ie9 hack.
            setTimeout(function(){
                content.appendTo('#jg_popup_garbage');
            }, 0);

            // Unbind handlers and reset overflow if last popup.
            if (index == 0) 
            {
                $('#jg_popup_close').unbind('click.jg_popup');
                $('#jg_popup_title').unbind('mousedown.jg_popup');
                $('.jg_popup_scroller').removeClass('jg_popup_scroller').css('overflow', 'auto');
            }

            _refresh(true);

            // Invoke popup's onClose callback if present.
            if (onClose) 
            {
                if (args) onClose.apply(window, args);
                else onClose();
            }
        }
    };

    var _refreshWidth = function () {
        var content = $('#jg_popup_content');
        var width = _popups[_popups.length - 1].width;
        content.css('width', width == 'auto' ? 'auto' : width + 'px');
    };

    var _refreshHeight = function () {
        var content = $('#jg_popup_content');
        var height = _popups[_popups.length - 1].height;
        if (_popups[_popups.length - 1].url) 
        {
            if (height != 'auto') 
            {
                $('#jg_popup_content div:eq(' + (_popups.length - 1) + ') > iframe.jg_popup_iframe').attr('height', height);
                // Vertically center loader.
                var marginTop = (height - $('#jg_popup_loader div').height()) / 2;
                $('#jg_popup_loader').css('top', (marginTop + _popups[_popups.length - 1].loaderVerticalOffset) + 'px');
            }
            else
                $('#jg_popup_content div:eq(' + (_popups.length - 1) + ') > iframe.jg_popup_iframe').removeAttr('height');
            $('#jg_popup_content').height('auto');
        }
        else $('#jg_popup_content').height(height);
    };

    var _refreshTitle = function () {
        var title = _popups[_popups.length - 1].title;
        var maxLength = _popups[_popups.length - 1].maxTitleLength
        if (maxLength && title && title.length > maxLength)
            $('#jg_popup_title').html(title.substring(0, maxLength) + '...');
        else $('#jg_popup_title').html(title || '');
    };

    var _refreshParentScrolling = function() {
        var parentScrolling = _popups[_popups.length - 1].parentScrolling;
        if(parentScrolling)
        {
            $('.jg_popup_scroller').removeClass('jg_popup_scroller').css('overflow', 'auto');
        }
        else  // Disable scrolling on parent document.
        {
            var scroller = $('body');
            if(scroller.css('overflow') == 'hidden')
            {
                scroller = scroller.find('*').filter(function(){
                    return $(this).css('overflow') == 'auto';
                }).first();
            }
  
            scroller.addClass('jg_popup_scroller').css('overflow', 'hidden');
        }
    };

    var _refreshSkinClass = function(){
        $('#jg_popup_table').removeClass().addClass(_popups[_popups.length - 1].skinClass);
    };

    var _refreshDraggable = function(){
        $('#jg_popup_title')[_popups[_popups.length - 1].draggable ? 'addClass' : 'removeClass']('jg_popup_draggable');
    }; 

    var _refreshResizable = function(){
        $('#jg_popup_br')[_popups[_popups.length - 1].resizable ? 'addClass' : 'removeClass']('jg_popup_resizable');
    }; 

    var _refreshOverlay = function(){
        $('#jg_popup_overlay').css('display', _popups[_popups.length - 1].overlay ? 'block' : 'none');
    };

    var _refreshOverlayColor = function(){
        $('#jg_popup_overlay').css('backgroundColor', _popups[_popups.length - 1].overlayColor);
    };

    var _refreshOpacity = function(){
        $('#jg_popup_overlay').css('opacity', _popups[_popups.length - 1].opacity / 100);
    };

    var _refresh = function (close) {
        if (_popups.length <= 0) // No more popups, hide all.
        {
            _popupsLeft = false;
            $('#jg_popup_overlay, #jg_popup_inner').hide();
        }
        else 
        {
            var currentContent = $('#jg_popup_content > div:eq(' + (_popups.length - 1) + ')');

            // Initially hide popup window and show overlay on first popup.
            if (!_popupsLeft) 
            {
                $('#jg_popup_inner').css('visibility', 'hidden');
            }
            else // Hide previous popup contents, show this one.
            {
                $('#jg_popup_content > div:lt(' + (_popups.length - 1) + ')').hide();
                currentContent.show();
            }

            _refreshTitle();
            _refreshWidth();
            _refreshHeight();
            _refreshParentScrolling();
            _refreshSkinClass();
            _refreshDraggable();
            _refreshResizable();
            _refreshOverlay();
            _refreshOverlayColor();
            _refreshOpacity();

            // If the popup content consists of an image and with and/or height are auto and the image should be centered, wait for the image to load before positioning and showing the image.
            if(
                (_popups[_popups.length - 1].width == 'auto' || _popups[_popups.length - 1].height == 'auto') && 
                _popups[_popups.length - 1].center &&
                currentContent.find('img').length > 0 &&
                document.createElement('img').complete != undefined
            ){
                var image = currentContent.find('img:eq(0)').get()[0];
                // Start polling the image for completion.
                var poller = setInterval(function () {
                    if (image.complete) 
                    {
                        // Image is loaded, stop polling.
                        clearInterval(poller);
                        if(_popups.length > 0)
                        {
                            _position(close);
                            $('#jg_popup_inner').css({
                                visibility: 'visible',
                                display: 'none'
                            });
                            $('#jg_popup_inner').fadeIn(_fadeIn, function () {
                                if (_popups.length > 0 && _popups[_popups.length - 1].onOpen) 
                                {
                                    _popups[_popups.length - 1].onOpen();
                                }
                            });
                        }
                    }
                }, 50);
            }
            else 
            {
                _position(close);

                // Fade-in popup if it is the first popup.
                if (!_popupsLeft) 
                {
                    $('#jg_popup_inner').css({
                        visibility: 'visible',
                        display: 'none'
                    });

                    $('#jg_popup_inner').fadeIn(_fadeIn, function () {
                       if (_popups.length > 0 && _popups[_popups.length - 1].onOpen)
                            _popups[_popups.length - 1].onOpen(); 
                    });
                }
                else if (_popups.length > 0 && _popups[_popups.length - 1].onOpen)
                {
                    _popups[_popups.length - 1].onOpen();
                } 
            }

            _popupsLeft = true;
        }
    };

    var _drag = function (e) {
        
        var popup = _popups[_popups.length - 1];
        if (!popup.draggable) return;

        _mouseX = e.pageX;
        _mouseY = e.pageY;
        var offset = $('#jg_popup_inner').offset();
        var fixed = $('#jg_popup_inner').css('position') == 'fixed';
        var $window = $(window);
        _dragX = offset.left - (fixed ? $window.scrollLeft() : 0);
        _dragY = offset.top - (fixed ? $window.scrollTop() : 0);

        // Invoke dragstart callback.
        if (popup.onDragStart)
            popup.onDragStart(popup);

        // Overlay content with transparant overlay.
        $('<div id="jg_drag_aid"></div>').css({
            opacity: 0,
            background: '#000',
            width: '100%',
            height: '100%',
            position: 'fixed',
            left: 0,
            top: 0,
            cursor: 'move'
        }).appendTo('#jg_popup_content');

        $(document).unbind('mousemove.jg_popup_drag').bind('mousemove.jg_popup_drag', function (e) {
            var left = (_dragX + (e.pageX - _mouseX));
            var top = (_dragY + (e.pageY - _mouseY));
            var css = {
                left: left + 'px',
                top: top + 'px',
                right: 'auto',
                bottom: 'auto'
            }; 
            $('#jg_popup_inner').css(css);
            // Save new position with popup.
            popup.left = left;
            popup.top = top;
            popup.css = css;

            if (popup.onDrag) 
                popup.onDrag(popup);

        }).unbind('mouseup.jg_popup_drag').bind('mouseup.jg_popup_drag', function (e) {
            // Remove transparant iframe overlay.
            $('#jg_drag_aid').remove();
            // Unbind drag handler.
            $(this).unbind('.jg_popup_drag');
            // Invoke dragend callback.
            if (popup.onDragEnd) 
                popup.onDragEnd(popup);
        });
    };

    // Resize
    var _resize = function (e) {

        var popup = _popups[_popups.length - 1];
        if (!popup.resizable) return;

        _mouseX = e.pageX;
        _mouseY = e.pageY;
        _width = popup.width;
        if(_width == 'auto')_width = $('#jg_popup_content').width();
        _height = _popups[_popups.length - 1].height;
        if(_height == 'auto')_height = $('#jg_popup_content').height();

        // Invoke resizeStart callback.
        if (popup.onResizeStart)
            popup.onResizeStart(popup);

        // Overlay iframe with transparant overlay.
        $('<div id="jg_drag_aid"></div>').css({
            opacity: 0,
            background: '#000',
            width: '100%',
            height: '100%',
            position: 'fixed',
            left: 0,
            top: 0,
            cursor: 'move'
        }).appendTo('#jg_popup_content');

        $(document).unbind('mousemove.jg_popup_resize').bind('mousemove.jg_popup_resize', function (e) {

            _popups[_popups.length - 1].width = _width + (e.pageX - _mouseX);
            _popups[_popups.length - 1].height = _height + (e.pageY - _mouseY);

            _refreshWidth();
            _refreshHeight();

            if (popup.onResize) 
                popup.onResize(popup);

        }).unbind('mouseup.jg_popup_resize').bind('mouseup.jg_popup_resize', function (e) {

            // Remove transparant iframe overlay.
            $('#jg_drag_aid').remove();

            // Unbind resize handler.
            $(this).unbind('.jg_popup_resize');
          
             // Invoke resizeEnd callback.
            if (popup.onResizeEnd) 
                popup.onResizeEnd(popup);
        });
    };

    var _getValue = function(value)
    {
        return (_popups && _popups.length > 0) ? _popups[_popups.length - 1][value] : null;
    }

    $.jeegoopopup = {
        open: function (options) {

            _initialize();

            // Clear garbage.
            try { $('#jg_popup_garbage').empty(); } catch (ex) { }

            // Add new popup.
            // Default undefined:
            // =============================
            // title, string
            // maxTitleLength, int
            // fadeIn, int
            // url, string
            // html, string
            // left, int
            // top, int
            // right, int
            // bottom, int
            // onOpen, function
            // onClose, function
            // onDragStart, function
            // onDrag, function
            // onDragEnd, function
            // onResizeStart, function
            // onResize, function
            // onResizeEnd, function
            var popupData = $.extend({
                width: 'auto',
                height: 'auto',
                scrolling: 'auto',
                skinClass: 'jg_popup_basic',
                fixed: true,
                center: true,
                overlay: true,
                overlayColor: '#000',
                opacity: 50,
                loaderVerticalOffset: 0, 
                parentScrolling: true,
                draggable: true,
                resizable: true
            }, options || {});

            _popups.push(popupData);

            // Override fadeIn if provided.
            if (options && options.fadeIn != undefined) _fadeIn = options.fadeIn;

            // Take-over underlying popup position if popup is not centered and no left, right, top or bottom are defined.
            if (_popups.length > 1 && !popupData.center) 
            {
                var offset = $('#jg_popup_inner').offset();
                if (popupData.top == undefined && popupData.bottom == undefined)
                {
                    popupData.top = popupData.fixed ? offset.top - $(window).scrollTop() : offset.top;
                }

                if (popupData.left == undefined && popupData.right == undefined)
                {
                    popupData.left = popupData.fixed ? offset.left - $(window).scrollLeft() : offset.left;
                }
            }

            // Add popup content(html or iframe).
            if (popupData.url) // iframe
            {
                // Generate random id to prevent iframe caching.
                var id = "jgpopup" + Math.random().toString().replace(/\D/, "");
                // Show loader animation.
                $('#jg_popup_loader').css('visibility', 'visible');
                $('#jg_popup_content').append(
                    '<div><iframe id="' + id + '" class="jg_popup_iframe" onload="(function(){$(\'#jg_popup_loader\').css(\'visibility\', \'hidden\');})()" frameborder="0" scrolling="' + popupData.scrolling + '" width="100%" ' + (popupData.height == 'auto' ? '' : 'height="' + popupData.height + 'px" ') + 'src="' + popupData.url + '"></iframe></div>'
                );
            }
            else // html
            {
                var overflow = popupData.scrolling;
                if(overflow == 'yes') overflow = 'scroll';
                else if(overflow == 'no') overflow = 'hidden';

                $('#jg_popup_content').append('<div style="width:100%;height:100%;overflow:' + overflow + '">' + (popupData.html || '') + '</div>');
            }

            // Attach handlers on first popup.
            if (_popups.length == 1) 
            {
                // Attach close handler to close button, wrap in function to prevent calling it with click handler argument (e).
                $('#jg_popup_close').unbind('click.jg_popup').bind('click.jg_popup', function () {
                    _close();
                });

                // Bind drag handler to title section.
                $('#jg_popup_title').unbind('mousedown.jg_popup').bind('mousedown.jg_popup', _drag);

                // Bind resize handler to bottom right corner.
                $('#jg_popup_br').unbind('mousedown.jg_popup').bind('mousedown.jg_popup', _resize);
            }

            _refresh();
        },
        close: function () { // close topmost popup.
            _close(arguments);
        },
        // Properties
        opacity: function (value) {
            if (value == undefined) return _getValue('opacity');
            else if (_popups && _popups.length > 0) 
            {
                _popups[_popups.length - 1].opacity = value;
                _refreshOpacity();
            }
            return this;
        },
        overlay: function (value) {
            if (value == undefined) return _getValue('overlay');
            else if (_popups && _popups.length > 0) 
            {
                _popups[_popups.length - 1].overlay = value;
                _refreshOverlay();
            }
            return this;
        },
        overlayColor: function (value) {
            if (value == undefined) return _getValue('overlayColor');
            else if (_popups && _popups.length > 0) 
            {
                _popups[_popups.length - 1].overlayColor = value;
                _refreshOverlayColor();
            }
            return this;
        },
        draggable: function (value) {
            if (value == undefined) return _getValue('draggable');
            else if (_popups && _popups.length > 0) 
            {
                _popups[_popups.length - 1].draggable = value;
                _refreshDraggable(); 
            }
            return this;
        },
        resizable: function (value) {
            if (value == undefined) return _getValue('resizable');
            else if (_popups && _popups.length > 0) 
            {
                _popups[_popups.length - 1].resizable = value;
                _refreshResizable();
            }
            return this;
        },
        fixed: function (value) {
            if (value == undefined) return _getValue('fixed');
            else if (_popups && _popups.length > 0) 
            {
                _popups[_popups.length - 1].fixed = value;
                _position();
            }
            return this;
        },
        height: function (value) {
            if (value == undefined) return _getValue('height');
            else if (_popups && _popups.length > 0) 
            {
                _popups[_popups.length - 1].height = value;
                _refreshHeight();
            }
            return this;
        },
        width: function (value) {
            if (value == undefined)  return _getValue('width');
            else if (_popups && _popups.length > 0) 
            {
                _popups[_popups.length - 1].width = value;
                _refreshWidth();
            }
            return this;
        },
        top: function (value) {
            if (value == undefined) return _getValue('top');
            else if (_popups && _popups.length > 0) 
            {
                _popups[_popups.length - 1].top = value;
                $('#jg_popup_inner').css({
                    top: _getValue('fixed') ? value + 'px' : $(window).scrollTop() + value + 'px',
                    bottom: 'auto'
                });
            }
            return this;
        },
        left: function (value) {
            if (value == undefined) return _getValue('left');
            else if (_popups && _popups.length > 0) 
            {
                _popups[_popups.length - 1].left = value;
                $('#jg_popup_inner').css({
                    left: _getValue('fixed') ? value + 'px' : $(window).scrollLeft() + value + 'px',
                    right: 'auto'
                });
            }
            return this;
        },
        right: function (value) {
            if (value == undefined) return _getValue('right');
            else if (_popups && _popups.length > 0) 
            {
                _popups[_popups.length - 1].right = value;
                _popups[_popups.length - 1].left = undefined;
                $('#jg_popup_inner').css({
                    right: _getValue('fixed') ? value + 'px' : value - $(window).scrollLeft() + 'px',
                    left: 'auto'
                });
            }
            return this;
        },
        bottom: function (value) {
            if (value == undefined) return _getValue('bottom');
            else if (_popups && _popups.length > 0) 
            {
                _popups[_popups.length - 1].bottom = value;
                _popups[_popups.length - 1].top = undefined;
                $('#jg_popup_inner').css({
                    bottom: _getValue('fixed') ? value + 'px' : value - $(window).scrollTop() + 'px',
                    top: 'auto'
                });
            }
            return this;
        },
        title: function (value) {
            if (value == undefined) return _getValue('title');
            else if (_popups && _popups.length > 0) 
            {
                _popups[_popups.length - 1].title = value;
                _refreshTitle(value, _popups[_popups.length - 1].maxTitleLength);
            }
            return this;
        },
        maxTitleLength: function (value) {
            if (value == undefined)  return _getValue('maxTitleLength');
            else if (_popups && _popups.length > 0) 
            {
                _popups[_popups.length - 1].maxTitleLength = value;
                _refreshTitle(_popups[_popups.length - 1].title, value);
            }
            return this;
        },
        skinClass: function (value) {
            if (value == undefined)  return _getValue('skinClass');
            else if (_popups && _popups.length > 0) 
            {
                _popups[_popups.length - 1].skinClass = value;
                _refreshSkinClass();
            }
            return this;
        },
        parentScrolling: function (value) {
            if (value == undefined) return _getValue('parentScrolling');
            else if (_popups && _popups.length > 0) 
            {
                _popups[_popups.length - 1].parentScrolling = value;
                _refreshParentScrolling();
            }
            return this;
        },
        center: function () { // Center popup.
            if (_popups && _popups.length > 0) 
            {
                var $window = $(window);
                var popup = _popups[_popups.length - 1];
                var left = ($window.width() - $('#jg_popup_inner').outerWidth()) / 2;
                var top = ($window.height() - $('#jg_popup_inner').outerHeight()) / 2;
                   
                var css = {
                    left: popup.fixed ? left + 'px' : $window.scrollLeft() + left + 'px',
                    top: popup.fixed ? top + 'px' : $window.scrollTop() + top + 'px',
                    right: 'auto',
                    bottom: 'auto'
                };
                
                popup.css = css;
                $('#jg_popup_inner').css(css);
            }
            return this;
        },
        refresh: function(){ // Reload iframe.
            if (_popups && _popups.length > 0) 
            {
                var iframe = $('#jg_popup_content div:eq(' + (_popups.length - 1) + ') > iframe.jg_popup_iframe');
                if(iframe.length > 0)
                {
                    iframe[0].contentDocument.location.reload(true);
                }
            }
            return this;
        }
    };
})(jQuery);
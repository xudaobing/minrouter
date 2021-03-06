;(function() {
    if(!window) return;
    var win = window, supportPushState = 'pushState' in history, evt = supportPushState ? 'popstate' : 'hashchange', self = {};

    var regexps = [
        /[\-{}\[\]+?.,\\\^$|#\s]/g,
        /\((.*?)\)/g,
        /(\(\?)?:\w+/g,
        /\*\w+/g,
    ],
    getRegExp = function(route) {
        route = route.replace(regexps[0], '\\$&')
            .replace(regexps[1], '(?:$1)?')
            .replace(regexps[2], function(match, optional) {
                return optional ? match : '([^/?]+)'
            }).replace(regexps[3], '([^?]*?)');
        return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
    },
    extractParams = function(route, fragment) {
        var params = route.exec(fragment).slice(1);
        var results = [], i;
        for(i = 0; i < params.length; i++) {
            results.push(decodeURIComponent(params[i]) || null);
        }
        return results;
    };

    function Router(opts) {
        this.opts = opts;
        this.routes = opts.routes;
        this.sep = opts.sep || '';
        this.go(location.pathname, true);
        this.holdLinks(opts.links || []);
        self = this;
    }
    Router.prototype.exec = function(path) {
        for(var r in this.routes) {
            var route = getRegExp(r);
            if (!route.test(path)) {
                continue;
            }
            if (typeof this.routes[r] === 'function') {
                this.routes[r].apply(this, extractParams(route, path));
            } else {
                var fn = this.opts[this.routes[r]];
                fn ? fn.apply(this, extractParams(route, path)) : void 0;
            }
        }
    };
    Router.prototype.emit = function(path) {
        if(supportPushState) {
            path = path.state.path;
        }else {
            path = location.href.split('#')[1] || '';
        }
        self.exec(path);
    }
    Router.prototype.start = function() {
        win.addEventListener ? win.addEventListener(evt, this.emit, false) : win.attachEvent('on' + evt, this.emit)
    };
    Router.prototype.stop = function() {
        win.removeEventListener ? win.removeEventListener(evt, this.emit, false) : win.detachEvent('on' + evt, this.emit);
    };
    Router.prototype.go = function(path, isReplace) {
        if(supportPushState) {
            if(isReplace) {
                history.replaceState({path: path}, document.title, path);
            }else {
                history.pushState({path: path}, document.title, path);
            }
        }else {
            if(this.sep !== '/') {
                location.hash = this.sep + path;
            }
        }
        this.exec(path);
    };
    Router.prototype.back = function() {
        history.back();
    };
    Router.prototype.hold = function(e, href) {
        var isReplace = false, path = href !== undefined ? href : e.target.pathname; 
        if(!supportPushState) {
            path = '/' + path;
        }else {
            if(path === history.state.path) {
                isReplace = true;
            }
        }
        this.go(path, isReplace);
        if(e && e.preventDefault) {
            e.preventDefault();      
        }else {
            e.returnValue = false;              
            return false; 
        }
    };
    Router.prototype.holdLinks = function(links) {
        for(var i = 0; i < links.length; i++) {
            links[i].onclick = function(e) {
                var href;
                if(!e) {
                    e = win.event;
                    href = this.pathname;
                }
                self.hold(e, href);
            }
        }
    };
    if(typeof exports === 'object') {
        module.exports = Router;
    }else if(typeof define === 'function' && define.amd) {
        define(function() { return window.MinRouter = Router; })
    }else {
        window.MinRouter = Router;
    }
})(typeof window != 'undefined' ? window : undefined);
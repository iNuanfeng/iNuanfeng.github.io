var _typeof2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
  return typeof e
} : function (e) {
  return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
};
! function () {
  function e(t, n, i) {
    function o(r, s) {
      if (!n[r]) {
        if (!t[r]) {
          var c = "function" == typeof require && require;
          if (!s && c) return c(r, !0);
          if (a) return a(r, !0);
          var l = new Error("Cannot find module '" + r + "'");
          throw l.code = "MODULE_NOT_FOUND", l
        }
        var d = n[r] = {
          exports: {}
        };
        t[r][0].call(d.exports, function (e) {
          var n = t[r][1][e];
          return o(n || e)
        }, d, d.exports, e, t, n, i)
      }
      return n[r].exports
    }
    for (var a = "function" == typeof require && require, r = 0; r < i.length; r++) o(i[r]);
    return o
  }
  return e
}()({
  1: [function (e, t, n) {
    function o(e) {
      var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : window.location.href,
        n = decodeURIComponent((new RegExp("[?|&]" + e + "=([^&;]+?)(&|#|;|$)").exec(t) || [void 0, ""])[1].replace(/\+/g, "%20")) || null;
      return n ? n.split("/")[0] : ""
    }
    var a = "function" == typeof Symbol && "symbol" === _typeof2(Symbol.iterator) ? function (e) {
      return "undefined" == typeof e ? "undefined" : _typeof2(e)
    } : function (e) {
      return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : "undefined" == typeof e ? "undefined" : _typeof2(e)
    };
    ! function (e, t) {
      function n(t, n, i) {
        Object.defineProperty && i ? Object.defineProperty(e, t, {
          writable: !1,
          value: n
        }) : e[t] = n
      }
      var r, s = null,
        c = 0,
        l = 0,
        d = 0,
        u = 0,
        f = 0,
        p = 0,
        g = "1.0.2",
        y = parseInt(9999 * Math.random()) + parseInt((new Date).getTime()).toString().substr(5, 8),
        h = "prod",
        v = "prod" === h ? "//activity.yuyiya.com" : "//activity.tuiatest.cn",
        m = {
          init: function () {
            this.setCookie(), t.getElementById("send_log") ? (m.countInit(), this.visibilityListen()) : m.noSendId(s), m.setCountLog()
          },
          setCountLog: function () {
            t.addEventListener("touchstart", function () {
              f = new Date
            }, !1), t.addEventListener("touchend", function (e) {
              for (e.path || (e.path = [e.target, e.target.parentNode]), i = e.path.length - 1; i >= 0; --i) e.path[i].dataset && e.path[i].dataset.settingClick && m.setClickEvent(e, e.path[i]), e.path[i].dataset && e.path[i].dataset.settingCopy && m.setCopyEvent(e, e.path[i]), e.path[i].dataset && e.path[i].dataset.settingPress && m.setPressEvent(e, e.path[i])
            }, !1)
          },
          setClickEvent: function (t, n) {
            "A" == n.tagName && n.getAttribute("href") && n.getAttribute("href").indexOf("javascript:") == -1 ? (event.preventDefault(), b.init(function () {
              console.log("??????????????????????????????K"), e.location.href = n.getAttribute("href")
            }, {
              location: n.getAttribute("data-setting-click")
            })) : b.init(function () {
              console.log("??????????????????????????????K1")
            }, {
              location: n.getAttribute("data-setting-click")
            })
          },
          setCopyEvent: function (e, t) {
            var n = t.dataset.settingCopy,
              i = n.match(/\$\{(.+?)\}/g);
            if (i && i.length)
              for (var o = 0; o < i.length; o++) {
                var a = i[o].replace("${", "");
                a = a.replace("}", ""), n = n.replace(i[o], m.getparams(a))
              }
            m.copyBoard(n)
          },
          setPressEvent: function (e, t) {
            p = new Date - f, console.log(p), p > 500 && (b.init(function () {}, {
              location: t.getAttribute("data-setting-press")
            }), console.log("??????????????????????????????K"))
          },
          copyBoard: function (e) {
            var n = t.createElement("textarea");
            n.style.position = "fixed", n.style.top = 0, n.style.left = 0, n.style.width = "2em", n.style.height = "2em", n.style.padding = 0, n.style.border = "none", n.style.outline = "none", n.style.boxShadow = "none", n.style.background = "transparent", n.value = e, t.body.appendChild(n);
            var i = n.hasAttribute("readonly");
            i || n.setAttribute("readonly", ""), n.select(), n.setSelectionRange(0, n.value.length), i || n.removeAttribute("readonly"), selectedText = n.value;
            try {
              t.execCommand("copy") ? console.log("??????????????????") : console.log("?????????????????????????????????????????????????????????????????????????????????")
            } catch (o) {
              console.log("??????????????????????????????????????????????????????")
            }
            t.body.removeChild(n)
          },
          countInit: function () {
            var n = startY = endX = endY = 0;
            r = setInterval(m.countTime, 1e3), t.addEventListener("touchstart", function (t) {
              c++, m.dataAnalysis("touch");
              var i = t.targetTouches[0];
              n = i.pageX, startY = i.pageY;
              var o = o || e.event,
                a = o.target || o.srcElement;
              "input" == a.nodeName.toLowerCase() && (m.dataAnalysis("input"), d++)
            }), t.addEventListener("touchend", function (e) {
              endX = e.changedTouches[0].pageX, endY = e.changedTouches[0].pageY;
              var t = Math.abs(endY - startY),
                i = Math.abs(endX - n);
              0 !== endX && 0 !== endY && (i > 5 || t > 5) && (m.dataAnalysis("move"), l++, endX = 0, endY = 0)
            }, !1)
          },
          visibilityListen: function () {
            var e, n, i;
            "undefined" != typeof t.hidden ? (e = "hidden", i = "visibilitychange", n = "visibilityState") : "undefined" != typeof t.mozHidden ? (e = "mozHidden", i = "mozvisibilitychange", n = "mozVisibilityState") : "undefined" != typeof t.msHidden ? (e = "msHidden", i = "msvisibilitychange", n = "msVisibilityState") : "undefined" != typeof t.webkitHidden && (e = "webkitHidden", i = "webkitvisibilitychange", n = "webkitVisibilityState"), t.addEventListener(i, function () {
              "visible" !== t[n] ? clearInterval(r) : t.getElementById("send_log") && (y = parseInt(9999 * Math.random()) + parseInt((new Date).getTime()).toString().substr(5, 8), c = 0, l = 0, d = 0, u = 0, r = setInterval(m.countTime, 1e3))
            }, !1)
          },
          countTime: function () {
            m.dataAnalysis("perSec"), u++, 300 === u && clearInterval(r)
          },
          ajaxGen: function (e, t, n, i) {
            try {
              this.getoId() ? this.ajax({
                url: v + e,
                callback: "callback",
                data: t,
                time: i || 3e3,
                success: function (e) {
                  n && n(e)
                },
                error: function (e) {
                  n && n(e)
                }
              }) : n && n()
            } catch (o) {
              n && n()
            }
          },
          getUrlParam: function () {
            var e = [],
              t = location.search.replace(/^\?/, "") + location.hash.replace(/^\#/, "&");
            if (t && (t = t.split("&"), t.length > 0))
              for (var n = 0; n < t.length; n++) {
                var i = t[n].split("=");
                if (0 == i[0].indexOf("a_")) {
                  var o = i[0].replace("a_", ""),
                    a = i[1];
                  e.push({
                    key: o,
                    val: a
                  })
                }
              }
            return e
          },
          cookie: function (e, n, i) {
            if ("undefined" == typeof n) {
              var o = null;
              if (t.cookie && "" != t.cookie)
                for (var a = t.cookie.split(";"), r = 0; r < a.length; r++) {
                  var s = a[r].replace(/(^\s*)|(\s*$)/g, "");
                  if (s.substring(0, e.length + 1) == e + "=") {
                    o = decodeURIComponent(s.substring(e.length + 1));
                    break
                  }
                }
              return o
            }
            i = i || {}, null === n && (n = "", i = $.extend({}, i), i.expires = -1);
            var c = "";
            if (i.expires && ("number" == typeof i.expires || i.expires.toUTCString)) {
              var l;
              "number" == typeof i.expires ? (l = new Date, l.setTime(l.getTime() + 24 * i.expires * 60 * 60 * 1e3)) : l = i.expires, c = "; expires=" + l.toUTCString()
            }
            var d = i.path ? "; path=" + i.path : "",
              u = i.domain ? "; domain=" + i.domain : "",
              f = i.secure ? "; secure" : "";
            t.cookie = [e, "=", encodeURIComponent(n), c, d, u, f].join("")
          },
          getoId: function () {
            var e = !1,
              t = location.href;
            return (t.indexOf("a_oId") !== -1 || this.cookie("_coll_oId")) && (e = !0), e
          },
          setCookie: function () {
            var n = this.getUrlParam();
            if (s = {
                referrer: t.referrer,
                url: location.href,
                version: g,
                landId: o("id"),
                origin: e.landOrigin
              }, n.length > 0)
              for (var i = 0; i < n.length; i++) s[n[i].key] = n[i].val, this.cookie("_coll_" + n[i].key, n[i].val, {
                path: "/",
                expires: 1
              });
            if (location.search.indexOf("a_oId") == -1)
              for (var a = t.cookie.split(";"), i = 0; i < a.length; i++)
                if (a[i].indexOf("_coll_") !== -1) {
                  var r = a[i].split("=")[0];
                  s[r.substr(r.indexOf("_coll_") + 6)] = a[i].split("=")[1]
                } s.oId && s.oId.indexOf("enc-") !== -1 && this.sendEncLog({
              type: 97,
              json: JSON.stringify(s)
            }), this.sendLog({
              type: 7,
              json: JSON.stringify(s)
            }), this.sendLandLog({
              type: 49,
              json: JSON.stringify(s)
            })
          },
          formatParams: function (e) {
            var t = [];
            for (var n in e) t.push(encodeURIComponent(n) + "=" + encodeURIComponent(e[n]));
            return t.join("&")
          },
          ajax: function (n) {
            if (n = n || {}, !n.url || !n.callback) throw new Error("????????????????????????");
            var i = ("jsonp_" + Math.random()).replace(".", ""),
              o = t.getElementsByTagName("head")[0];
            n.data[n.callback] = i;
            var a = this.formatParams(n.data),
              r = t.createElement("script");
            o.appendChild(r), e[i] = function (t) {
              o.removeChild(r), clearTimeout(r.timer), e[i] = null, n.success && n.success(t)
            }, r.src = n.url + "?" + a, n.time && (r.timer = setTimeout(function () {
              e[i] = null, o.removeChild(r), n.error && n.error({
                message: "?????????"
              })
            }, n.time))
          },
          sendDataLog: function (e) {
            this.ajaxGen("/statistics/stopPageCount", e)
          },
          sendLog: function (e, t) {
            "test" == m.getparams("log") && (7 == e.type ? alert("type7 send!") : alert("type8 send!")), this.ajaxGen("/log/inner", e, t)
          },
          sendEncLog: function (e, t) {
            this.ajaxGen("/log/enc/inner", e, t)
          },
          sendLandLog: function (e, t) {
            this.ajaxGen("/log/landLog", e, t)
          },
          noSendId: function (e, t) {
            e.type = "nosend", this.ajaxGen("/statistics/activityPagePerf", e, t)
          },
          cloneObj: function (e) {
            var t = this;
            if ("object" != ("undefined" == typeof e ? "undefined" : a(e))) return e;
            if (null == e) return e;
            var n = new Object;
            for (var i in e) n[i] = t.cloneObj(e[i]);
            return n
          },
          extendObj: function () {
            var e = arguments;
            if (!(e.length < 2)) {
              for (var t = this.cloneObj(e[0]), n = 1; n < e.length; n++)
                for (var i in e[n]) t[i] = e[n][i];
              return t
            }
          },
          dataAnalysis: function (e) {
            var t = (this.getUrlParam(), {
              sessionID: y,
              action: e,
              touchNum: c,
              inputNum: d,
              moveNum: l
            });
            t = Object.assign(t, s), m.sendDataLog(t)
          },
          getparams: function (e) {
            var t = "[\\?&]" + e + "=([^&#]*)",
              n = new RegExp(t),
              i = n.exec(location.href);
            return null === i ? "" : i[1]
          }
        },
        b = {
          init: function (e, t, n) {
            n = n || "open";
            var i = m.extendObj(s, t);
            if (i.oId && i.oId.indexOf("enc-") !== -1) {
              var o = {
                type: 98,
                json: JSON.stringify(i)
              };
              m.sendEncLog(o, e)
            }
            var a = {
              type: 8,
              json: JSON.stringify(i)
            };
            "open" == n ? (m.sendLog(a, e), m.sendLandLog({
              type: 50,
              json: JSON.stringify(i)
            })) : "close" == n ? m.sendLandLog({
              type: 50,
              json: JSON.stringify(i)
            }, e) : m.sendLog(a, e)
          },
          sendClickData: function (e, t) {
            var n = m.extendObj(s, t),
              i = {
                type: 110,
                json: JSON.stringify(n)
              };
            m.sendLandLog(i, e)
          }
        },
        x = function () {
          function e(e) {
            var t = e.split("//"),
              n = t[1].indexOf("/"),
              i = t[1].substring(0, n);
            return i
          }
          var n = ["tuiasnake", "dui88", "host"],
            i = t.getElementsByTagName("script"),
            o = i[i.length - 1];
          if (o && o.src)
            for (var a = e(o.src), r = 0; r < n.length; r++)
            {
              
              if (a.indexOf(n[r]) != -1) {
                console.log(a)

                return !0;
              }
              return !1
            }
              
          
        }();
      n("countLog", b, x), m.init()
    }(window, document)
  }, {}]
}, {}, [1]);
//# sourceMappingURL=index4.4.source_201901101508.js.map
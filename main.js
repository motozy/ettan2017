// twitter: @mmzy3
"use strict";

var ettan2017 = {
    imageSize: window.innerWidth,
    imageX: 0,
    imageY: 0,
    imageScale: 1,
    tapEnabled: false, // iOSのSafariでd3のclickが来ないのでtouchend代用するためのもの
    loginButton: null,
    logoutButton: null,
    userParam: {
        uid: null,
        id: null,
        name: null,
        icon: null
    },
    dbRefPath: "ettan2017/",
    userNameFontSize: 1.0, // 画像上ユーザー名のフォントサイズ係数（大きいほど大きくなる）

    init: function () {
        window.onload = function() {
            this.didLoad();
        }.bind(this);
    },

    didLoad: function() {
        // iOS10 の Safari で user-scalable=no が効かなくなったことへの対処
        this.fxxkinApple();

        // ログインボタン
        this.loginButton = document.getElementById("login");
        this.loginButton.addEventListener('click', function (event) {
            event.stopPropagation(); // 下にclickイベントが行かないように
            this.tapEnabled = false;
            this.onLogin();
        }.bind(this));

        // ログアウトボタン
        this.logoutButton = document.getElementById("logout");
        this.logoutButton.addEventListener('click', function (event) {
            event.stopPropagation(); // 下にclickイベントが行かないように
            this.tapEnabled = false;
            this.onLogout();
        }.bind(this));
        
        // リサイズ時処理
        window.addEventListener('resize', function (event) {
            this.onResize();
        }.bind(this));

        // ズーム（ピンチ・パン）処理
        var zoom = d3.behavior.zoom();
        zoom.scale(1);
        //zoom.translate([translate])
        zoom.scaleExtent([1, 10]);
        zoom.on("zoom", function() {
            this.tapEnabled = false;
            this.onZoom();
        }.bind(this));
            
        // クリック・タップ時の処理
        var body = d3.select("body");
        body.call(zoom)
        body.on("click", function() {
            this.tapEnabled = false;
            this.onClick(d3.event.clientX, d3.event.clientY);
        }.bind(this));
        body.on("touchstart", function() {
            this.tapEnabled = true;
        }.bind(this));
        body.on("touchend", function() {
            var pageX = d3.event.pageX;
            var pageY = d3.event.pageY
            setTimeout(function() {
                if(this.tapEnabled){
                    this.onClick(pageX, pageY);
                }
            }.bind(this), 200); // iOSのSafariでボタンクリックより先にtouchendが来るのを回避するためタイマを使う
        }.bind(this));

        // 画像表示初期化
        this.setImagePosition(0, 0, 1);

        // firebaseのDBから読み取り
        firebase.database().ref(this.dbRefPath).once('value').then(function(snapshot) {
            var obj = snapshot.val();
            Object.keys(obj).forEach(function (uid) {
                // ユーザー名の表示
                var param = obj[uid];
                this.addUserTag(uid, param.icon, param.name, param.id, param.x, param.y);
            }.bind(this));
        }.bind(this));

        // ログアウト状態からスタート
        this.onLogout();

        // 表示（フェードイン）
        this.fadeIn();

        // はじめる
        var startButton = document.getElementById("start");
        startButton.addEventListener('click', function (event) {
            var description = document.getElementById("description");
            description.style.pointerEvents = "none";
            description.style.opacity = 0;
            return false;
        }.bind(this));
    },

    onResize: function() {
        this.imageSize = window.innerWidth;
    },

    onZoom: function() {
        this.setImagePosition(d3.event.translate[0], d3.event.translate[1], d3.event.scale);            
    },

    onClick: function(x, y) {
        if(this.userParam.uid){
            var posX = (x - this.imageX) / (this.imageSize * this.imageScale);
            var posY = (y - this.imageY) / (this.imageSize * this.imageScale);

            this.removeUserTag(this.userParam.uid);
            this.addUserTag(this.userParam.uid, this.userParam.icon, this.userParam.name, this.userParam.id, posX, posY);

            // firebaseのDBに書き込み
            firebase.database().ref(this.dbRefPath + this.userParam.uid).set({
                id: this.userParam.id,
                name: this.userParam.name,
                icon : this.userParam.icon,
                x: posX,
                y: posY
            });
        }
    },
    
    addUserTag: function(uid, icon, name, id, x, y){
        var userName = document.createElement("div");
        userName.className = "userName";
        userName.id = uid;
        userName.innerText = name;
        userName.style.left = x * 100 + "%";
        userName.style.top = y * 100 + "%";

        var userIcon = document.createElement("img");
        userIcon.className = "userIcon";
        userIcon.id = uid;
        userIcon.src = icon;
        userIcon.alt = id;
        userIcon.style.right = (1 - x) * 100 + "%";
        userIcon.style.top = y * 100 + "%";
        userIcon.addEventListener('click', function (event) {
            event.stopPropagation(); // 下にclickイベントが行かないように
            var twitterId = event.currentTarget.alt;
            window.open("https://twitter.com/" + twitterId);
        }.bind(this));

        var imageContainer = document.getElementById("imageContainer");
        imageContainer.appendChild(userIcon);
        imageContainer.appendChild(userName);
    },

    removeUserTag: function(uid){
        var element = document.getElementById(uid);
        if(element){
            element.parentNode.removeChild(element);
            this.removeUserTag(uid);
        }
    },

    setImagePosition: function(x, y, scale) {
        this.imageX = x;
        this.imageY = y;
        this.imageScale = scale;
        this.updateImagePosition();
    },

    updateImagePosition: function() {
        var imageContainer = document.getElementById("imageContainer");
        imageContainer.style.left = this.imageX / this.imageSize * 100 + "vw";
        imageContainer.style.top = this.imageY / this.imageSize * 100 + "vw";
        imageContainer.style.width = this.imageScale * 100 + "vw";
        imageContainer.style.height = this.imageScale * 100 + "vw";
        imageContainer.style.fontSize = this.imageScale * this.userNameFontSize + "vw";
    },

    onLogin: function() {
        this.fadeOut();

        // JavaScript で Twitter を使用して認証する
        // 参照→ https://firebase.google.com/docs/auth/web/twitter-login
        var provider = new firebase.auth.TwitterAuthProvider();
        provider.setCustomParameters({
            'lang': 'ja'
        });
        firebase.auth().signInWithPopup(provider).then(function(result) {
            this.userParam.id = result.additionalUserInfo.username;
            this.userParam.name = result.user.displayName;
            this.userParam.icon = result.user.photoURL;
            this.userParam.uid = result.user.uid;

            this.didLogin();
            this.fadeIn();
        }.bind(this)).catch(function(error) {
            window.alert("ログインに失敗しました");
            this.fadeIn();
        }.bind(this));
    },

    didLogin: function() {
        this.loginButton.style.display = "none";
        this.logoutButton.style.display = "inline";

        var icon = document.getElementById("icon")
        icon.src = this.userParam.icon;
        icon.hidden = false;
        document.getElementById("name").innerText = this.userParam.name;
    },

    onLogout: function() {
        this.fadeOut();
        firebase.auth().signOut().then(function() {
            this.didLogout();
            this.fadeIn();
        }.bind(this)).catch(function(error) {
            window.alert("ログアウトに失敗しました");
            this.fadeIn();
        }.bind(this));
    },

    didLogout: function() {
        this.loginButton.style.display = "inline";
        this.logoutButton.style.display = "none";
        this.userParam.uid = null;

        var icon = document.getElementById("icon")
        icon.src = "";
        icon.hidden = true;
        document.getElementById("name").innerText = "";
    },
        
    fadeIn: function() {
        document.body.style.opacity = 1;
        document.getElementById("progress").style.opacity = 0;
    },
    
    fadeOut: function() {
        document.getElementById("progress").style.opacity = 0.7;
    },
    
    fxxkinApple() {
        // ブラウザ自身でのピンチ・ドラッグ操作を禁止する
        document.addEventListener('touchstart', function (e){
            if (e.target.nodeName !== "INPUT") {
                e.preventDefault();
            }
        }, true);
        document.addEventListener('touchmove', function (e){
            e.preventDefault();
        }, true);
    }
}

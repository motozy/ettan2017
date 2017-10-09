// twitter: @mmzy3
"use strict";

var ettan2017 = {
    imageSize: window.innerWidth,   // 画像サイズ（１倍時）px
    imageX: 0,                      // 画像表示X原点
    imageY: 0,                      // 画像表示Y原点
    imageScale: 1,                  // 画像表示倍率
    tapEnabled: false,              // iOSのSafariでd3のclickが来ないのでtouchend代用するためのもの
    userParam: {                    // ユーザパラメータ（Twitter認証時に取得）
        uid: null,  // firebaseのuid（認証されていなければnull）
        id: null,   // twitterユーザーID
        name: null, // twitter表示名
        icon: null  // twitterアイコン
    },
    dbRefPath: "ettan2017/",        // firebaseのDBのパス
    userNameFontSize: 1.0,          // 画像上ユーザー名のフォントサイズ係数（大きいほど大きくなる）

    // 初期化（ここからスタート）
    init: function () {
        window.onload = function() {
            this.didLoad();
        }.bind(this);
    },

    // html読み込み完了
    didLoad: function() {
        // iOS10 の Safari で user-scalable=no が効かなくなったことへの対処
        this.fxxkinApple();

        // ログインボタン
        document.getElementById("login").addEventListener('click', function (event) {
            event.stopPropagation(); // 下にclickイベントが行かないように
            this.tapEnabled = false;
            this.onLogin();
        }.bind(this));

        // ログアウトボタン
        document.getElementById("logout").addEventListener('click', function (event) {
            event.stopPropagation(); // 下にclickイベントが行かないように
            this.tapEnabled = false;
            this.onLogout();
        }.bind(this));
        
        // 削除ボタン
        document.getElementById("remove").addEventListener('click', function (event) {
            event.stopPropagation(); // 下にclickイベントが行かないように
            this.tapEnabled = false;
            this.onRemove();
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

        // 説明画面の「はじめる」ボタン
        var startButton = document.getElementById("start");
        startButton.addEventListener('click', function (event) {
            // 説明画面を消す
            var description = document.getElementById("description");
            description.style.pointerEvents = "none";
            description.style.opacity = 0;
            return false;
        }.bind(this));
    },

    // ウィンドウサイズ変更時
    onResize: function() {
        this.imageSize = window.innerWidth;
    },

    // d3でのパン・ピンチによる画像拡大縮小移動
    onZoom: function() {
        this.setImagePosition(d3.event.translate[0], d3.event.translate[1], d3.event.scale);            
    },

    // 画像上クリック時
    onClick: function(x, y) {
        if(this.userParam.uid){
            // クリック位置を正規化
            var posX = (x - this.imageX) / (this.imageSize * this.imageScale);
            var posY = (y - this.imageY) / (this.imageSize * this.imageScale);

            // 既存のユーザー名とアイコンがあれば削除
            this.removeUserTag(this.userParam.uid);

            // 新しいユーザー名とアイコンを追加
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

    // 削除
    onRemove: function() {
        if(this.userParam.uid){
            // 既存のユーザー名とアイコンがあれば削除
            this.removeUserTag(this.userParam.uid);

            // firebaseのDBから削除
            firebase.database().ref(this.dbRefPath + this.userParam.uid).set(null);
        }
    },
    
    // imageContainerに新しいユーザー名とアイコンを追加
    addUserTag: function(uid, icon, name, id, x, y){
        // ユーザー名
        var userName = document.createElement("div");
        userName.className = "userName";
        userName.id = uid;
        userName.innerText = name;
        userName.style.left = x * 100 + "%";
        userName.style.top = y * 100 + "%";

        // アイコン
        var userIcon = document.createElement("img");
        userIcon.className = "userIcon";
        userIcon.id = uid;
        userIcon.src = icon;
        userIcon.alt = id;
        userIcon.style.right = (1 - x) * 100 + "%";
        userIcon.style.top = y * 100 + "%";
        userIcon.addEventListener('click', function (event) {
            // ログイン中でなければアイコンクリックでTwitterページ表示（ログイン中＝編集中の誤操作防止）
            if(!this.userParam.uid){
                event.stopPropagation(); // 下にclickイベントが行かないように
                this.openTwitter(event.currentTarget.alt);
            }
        }.bind(this));

        // imageContainerに追加
        var imageContainer = document.getElementById("imageContainer");
        imageContainer.appendChild(userIcon);
        imageContainer.appendChild(userName);
    },

    // Twitterページ表示
    openTwitter: function(twitterId){
        window.open("https://twitter.com/" + twitterId);
    },
        
    // imageContainerから uid に該当するユーザー名とアイコンを削除
    removeUserTag: function(uid){
        var element = document.getElementById(uid);
        if(element){
            element.parentNode.removeChild(element);
            this.removeUserTag(uid);
        }
    },

    // 画像表示位置の設定
    setImagePosition: function(x, y, scale) {
        this.imageX = x;
        this.imageY = y;
        this.imageScale = scale;
        this.updateImagePosition();
    },

    // 画像表示位置の更新
    updateImagePosition: function() {
        var imageContainer = document.getElementById("imageContainer");
        imageContainer.style.left = this.imageX / this.imageSize * 100 + "vw";
        imageContainer.style.top = this.imageY / this.imageSize * 100 + "vw";
        imageContainer.style.width = this.imageScale * 100 + "vw";
        imageContainer.style.height = this.imageScale * 100 + "vw";
        imageContainer.style.fontSize = this.imageScale * this.userNameFontSize + "vw";
    },

    // ログイン
    onLogin: function() {
        this.fadeOut();

        // JavaScript で Twitter を使用して認証する
        // 参照→ https://firebase.google.com/docs/auth/web/twitter-login
        var provider = new firebase.auth.TwitterAuthProvider();
        provider.setCustomParameters({
            'lang': 'ja'
        });
        firebase.auth().signInWithPopup(provider).then(function(result) {
            // サインイン成功・ユーザパラメータを設定
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

    // ログイン成功時
    didLogin: function() {
        document.getElementById("login").style.display = "none";
        document.getElementById("logout").style.display = "inline";
        document.getElementById("remove").style.display = "inline";
        
        var icon = document.getElementById("icon")
        icon.src = this.userParam.icon;
        icon.hidden = false;
        document.getElementById("name").innerText = this.userParam.name;
    },

    // ログアウト
    onLogout: function() {
        this.fadeOut();
        firebase.auth().signOut().then(function() {
            // サインアウト成功・ユーザパラメータをクリア
            this.userParam.id = null;
            this.userParam.name = null;
            this.userParam.icon = null;
            this.userParam.uid = null;

            this.didLogout();
            this.fadeIn();
        }.bind(this)).catch(function(error) {
            window.alert("ログアウトに失敗しました");
            this.fadeIn();
        }.bind(this));
    },

    // ログアウト成功時
    didLogout: function() {
        document.getElementById("login").style.display = "inline";
        document.getElementById("logout").style.display = "none";
        document.getElementById("remove").style.display = "none";

        var icon = document.getElementById("icon")
        icon.src = "";
        icon.hidden = true;
        document.getElementById("name").innerText = "";
    },
        
    // メイン画面のフェードイン（処理中くるくるの消去）
    fadeIn: function() {
        document.body.style.opacity = 1;
        document.getElementById("progress").style.opacity = 0;
    },
    
    // メイン画面のフェードアウト（処理中くるくるの表示）
    fadeOut: function() {
        document.getElementById("progress").style.opacity = 0.7;
    },
    
    // iOSのSafariのための処理
    fxxkinApple() {
        // ブラウザ自身でのピンチ・ドラッグ操作を禁止する
        document.addEventListener('touchstart', function (e){
            // input と userIcon 以外を禁止
            if (e.target.nodeName !== "INPUT" && e.target.className !== "userIcon") {
                e.preventDefault();
            }
        }, true);
        document.addEventListener('touchmove', function (e){
            e.preventDefault();
        }, true);
    }
}

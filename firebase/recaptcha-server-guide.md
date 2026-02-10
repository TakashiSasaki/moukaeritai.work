# reCAPTCHA / Firebase App Check Server-Side Requirements

"recaptchaってサーバサイドで何を動かさないといけないの？" という疑問について、**現在の設定（Firebase App Check）** と **通常の reCAPTCHA** の場合で異なります。

## 1. Firebase App Check を使用している場合 (現在の `test-recaptcha.html` の構成)

**結論: Firebaseのサービスを使うだけなら、サーバサイドのコードを書く必要はありません。**

Firebase App Check は、クライアント（ブラウザ）と Firebase サービス（Firestore, Storage, Authenticationなど）の間で自動的に連携します。

*   **クライアント側**: SDKが自動的にトークンを取得し、リクエストヘッダー（`X-Firebase-AppCheck`）に付与します。
*   **サーバ側 (Firebase)**: Firebaseのサーバがリクエストを受け取った際、自動的にトークンを検証し、正規のアプリ/サイトからのアクセスかどうかを判断します。
    *   **設定**: Firebaseコンソールの "App Check" タブで、各サービス（Firestoreなど）の「強制 (Enforcement)」をオンにするだけです。

### 例外: Cloud Functions や 自作バックエンド API を守りたい場合

もしあなたが作った API（例えば Node.js のサーバや Cloud Functions の HTTP トリガー）を App Check で守りたい場合は、**検証コードが必要**です。

**Node.js (Firebase Admin SDK) の例:**

```javascript
const admin = require('firebase-admin');
// ... 初期化 ...

app.get('/your-api-endpoint', async (req, res) => {
    const appCheckToken = req.header('X-Firebase-AppCheck');

    if (!appCheckToken) {
        res.status(401).send('Unauthorized');
        return;
    }

    try {
        // トークンを検証
        const appCheckClaims = await admin.appCheck().verifyToken(appCheckToken);
        
        // 成功！処理を続行
        res.send(`Hello, verified user! (App ID: ${appCheckClaims.appId})`);
    } catch (err) {
        res.status(401).send('Unauthorized');
    }
});
```

---

## 2. Firebase App Check を使わず、通常の reCAPTCHA (v2/v3/Enterprise) を使う場合

**結論: Googleの検証APIを叩くサーバサイド処理が必須です。**

App Check を介さない場合、クライアントから送られてきた「reCAPTCHAトークン」を、あなたのサーバからGoogleのサーバに送信して「本物かどうか」を問い合わせる必要があります。

1.  **クライアント側**: `grecaptcha.execute()` などでトークンを取得し、フォーム送信やAPIリクエストと一緒にサーバへ送る。
2.  **サーバ側**: 受け取ったトークンと「シークレットキー」を使って、Googleの検証API (`siteverify`) を叩く。

**Node.js のイメージ:**

```javascript
const axios = require('axios');
const SECRET_KEY = 'YOUR_SECRET_KEY'; // 公開してはいけないキー

app.post('/submit', async (req, res) => {
    const userToken = req.body.recaptchaToken;

    // Googleに問い合わせ
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${SECRET_KEY}&response=${userToken}`;
    
    const response = await axios.post(verifyUrl);
    const data = response.data;

    if (data.success && data.score > 0.5) {
        // 人間である確率が高い -> 処理実行
    } else {
        // ボットの可能性が高い -> 拒否
    }
});
```

## まとめ

*   **Firebase App Check (DB/Storage)**: サーバ処理不要。コンソールでONにするだけ。
*   **Firebase App Check (自作API)**: Admin SDK で `verifyToken` する。
*   **通常 reCAPTCHA**: Googleの `siteverify` API を叩く処理を自作する。

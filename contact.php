<?php
// サキモトシャリョウ お問い合わせフォーム送信処理（ConoHa WING / PHP）
mb_language("Japanese");
mb_internal_encoding("UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { header('Location: /contact.html'); exit; }

// スパム対策：ハニーポット（人間は入力しない隠しフィールド）
if (!empty($_POST['_gotcha'])) { header('Location: /thanks.html'); exit; }

function field($k){ return isset($_POST[$k]) ? trim($_POST[$k]) : ''; }
$name    = field('name');
$tel     = field('tel');
$email   = field('email');
$type    = field('type');
$message = field('message');

// 必須・形式チェック
if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  header('Location: /contact.html?err=1#mailform'); exit;
}
// ヘッダインジェクション対策（改行混入を拒否）
foreach (array($name, $email, $tel, $type) as $x) {
  if (preg_match('/[\r\n]/', $x)) { header('Location: /contact.html?err=1#mailform'); exit; }
}

$to      = 'sakimotosyaryou.032026@outlook.jp';
$subject = '【HPお問い合わせ】' . $type . ' / ' . $name . ' 様';
$body =
  "サキモトシャリョウ 公式サイトのメールフォームからお問い合わせがありました。\n\n" .
  "■お名前：{$name}\n" .
  "■電話：{$tel}\n" .
  "■メール：{$email}\n" .
  "■ご相談の種類：{$type}\n" .
  "■内容：\n{$message}\n\n" .
  "--------------------------------\n" .
  "送信日時：" . date('Y-m-d H:i:s') . "\n" .
  "送信元IP：" . (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '') . "\n";

// 送信元はドメイン(SPF/DKIM設定済み)にして到達性を確保、返信先はお客様に
$from    = 'no-reply@sakimoto-vehicle-serv.com';
$headers = "From: " . mb_encode_mimeheader('サキモトシャリョウHP') . " <{$from}>\r\n";
$headers .= "Reply-To: {$email}\r\n";

if (mb_send_mail($to, $subject, $body, $headers)) {
  header('Location: /thanks.html'); exit;
} else {
  header('Location: /contact.html?err=2#mailform'); exit;
}

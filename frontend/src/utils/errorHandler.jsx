export const getErrorDetails = (error) => {
  const code = error?.response?.status || 500;
  let title;
  let message;

  switch (code) {
    case 400:
      title = "不正なリクエスト";
      message = "リクエストが不正です。";
      break;
    case 401:
      title = "認証が必要です";
      message = "このデータを表示するにはログインが必要です。";
      break;
    case 403:
      title = "アクセス権限がありません";
      message = "このデータを表示する権限がありません。";
      break;
    case 404:
      title = "データが見つかりません";
      message = "データが見つかりませんでした。";
      break;
    case 500:
      title = "サーバーエラー";
      message = "サーバーで問題が発生しました。しばらくしてから再度お試しください。";
      break;
    case 502:
      title = "不正なゲートウェイ";
      message = "サーバー間の通信でエラーが発生しました。しばらくしてから再度お試しください。";
      break;
    case 503:
      title = "サービス利用不可";
      message = "現在サーバーが混み合っているかメンテナンス中です。しばらくしてから再度お試しください。";
      break;
    case 504:
      title = "ゲートウェイタイムアウト";
      message = "サーバーからの応答がありませんでした。しばらくしてから再度お試しください。";
      break;
    default:
      title = "エラーが発生しました";
      message = error?.message || "データの読み込み中にエラーが発生しました。";
      break;
  }

  return { code, title, message };
};

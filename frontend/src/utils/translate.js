export function initGoogleTranslate() {
  // すでに初期化済みなら何もしない
  if (window.googleTranslateInitialized) return;
  window.googleTranslateInitialized = true;

  // 翻訳スクリプトがまだ読み込まれていなければ読み込む
  if (!document.getElementById("google-translate-script")) {
    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }

  // Google Translate 初期化関数（グローバルで必要）
  window.googleTranslateElementInit = () => {
    const container = document.getElementById("google_translate_element");
    if (!container) return;

    // 初期化済みなら何もしない
    if (container.getAttribute("data-initialized")) return;
    container.setAttribute("data-initialized", "true");

    // 翻訳ウィジェットの作成
    new window.google.translate.TranslateElement(
      {
        pageLanguage: "ja",
        includedLanguages: "ja,en,zh-CN,zh-TW,ko,fr,de,es,th,vi,ru",
        layout: window.google.translate.TranslateElement.InlineLayout.HORIZONTAL,
      },
      "google_translate_element"
    );

    // ウィジェット周りのスタイル調整
    const style = document.createElement("style");
    style.textContent = `
      .goog-te-banner-frame.skiptranslate,
      .goog-te-gadget-icon,
      .goog-logo-link,
      .goog-te-balloon-frame,
      #goog-gt-tt,
      .goog-te-spinner-pos {
        display: none !important;
      }
      body { top: 0 !important; }
      #google_translate_element {
        position: fixed !important;
        bottom: 10px !important;
        left: 10px !important;
        z-index: 9999 !important;
        background: white !important;
        border-radius: 6px !important;
        padding: 4px !important;
        box-shadow: 0 0 6px rgba(0,0,0,0.1) !important;
      }
      .goog-te-gadget { font-size: 12px !important; color: #333 !important; }
      .goog-te-gadget .goog-te-combo {
        background: white !important;
        border-radius: 6px !important;
        border: 1px solid #ccc !important;
        padding: 3px !important;
        color: black !important;
      }
    `;
    document.head.appendChild(style);
  };
}

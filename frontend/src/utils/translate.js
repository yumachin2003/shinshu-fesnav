export function initGoogleTranslate() {
  if (window.googleTranslateInitialized) return;
  window.googleTranslateInitialized = true;

  if (document.getElementById("google-translate-script")) return;

  const script = document.createElement("script");
  script.id = "google-translate-script";
  script.src =
    "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  document.body.appendChild(script);

  window.googleTranslateElementInit = () => {
    if (document.getElementById("google_translate_element_initialized")) return;

    const container = document.getElementById("google_translate_element");
    if (!container) return;

    container.id = "google_translate_element_initialized";

    new window.google.translate.TranslateElement(
      {
        pageLanguage: "ja",
        // ✅ 日本語を含めて多言語対応
        includedLanguages: "ja,en,zh-CN,zh-TW,ko,fr,de,es,th,vi,ru",
        layout: window.google.translate.TranslateElement.InlineLayout.HORIZONTAL,
      },
      "google_translate_element"
    );

    // ✅ 翻訳バーやロゴなどを非表示にしてUIを左下に固定
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

      /* ✅ 左下に配置 */
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

      /* ✅ ドロップダウンのスタイル */
      .goog-te-gadget {
        font-size: 12px !important;
        color: #333 !important;
      }

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

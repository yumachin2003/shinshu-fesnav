// utils/translate.js
export function initGoogleTranslate() {
  if (window.googleTranslateInitialized) return;
  window.googleTranslateInitialized = true;

  if (document.getElementById("google-translate-script")) return;
  if (document.querySelector(".goog-te-gadget")) return;

  const script = document.createElement("script");
  script.id = "google-translate-script";
  script.src =
    "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  script.defer = true;
  document.body.appendChild(script);

  window.googleTranslateElementInit = () => {
    if (document.querySelector(".goog-te-gadget")) return;

    let container = document.getElementById("google_translate_element");
    if (!container) {
      container = document.createElement("div");
      container.id = "google_translate_element";
      document.body.appendChild(container);
    }

    new window.google.translate.TranslateElement(
      {
        pageLanguage: "ja",
        includedLanguages: "ja,en,zh-CN,zh-TW,ko,fr,de,es,th,vi,ru",
        layout: window.google.translate.TranslateElement.InlineLayout.HORIZONTAL,
      },
      "google_translate_element"
    );

    const style = document.createElement("style");
    style.textContent = `
      /* 🧹 Google翻訳ウィジェット周りの最小限の非表示設定 */
      .goog-te-banner-frame.skiptranslate,
      .goog-te-balloon-frame,
      #goog-gt-tt,
      .goog-te-spinner-pos {
        display: none !important;
      }

      /* ✅ 「Powered by Google 翻訳」は非表示にしない */
      /* .goog-logo-link,
         .goog-te-gadget span { display: none !important; } */

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

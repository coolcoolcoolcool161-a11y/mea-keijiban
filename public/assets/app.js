// 掲示板の小さな補助JS: コードのコピー、コメント文字数、フォームの非同期送信。
// JSが無効でもフォームは通常のPOST+リダイレクトで動作する（プログレッシブ・エンハンスメント）。

// --- コードのコピー ---
document.querySelectorAll("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const text = btn.getAttribute("data-copy") ?? "";
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    const original = btn.textContent;
    btn.textContent = "コピーしたよ♪";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove("copied");
    }, 1600);
  });
});

// --- コメント文字数 ---
const commentInput = document.getElementById("f-comment");
const commentCount = document.getElementById("comment-count");
if (commentInput && commentCount) {
  const update = () => {
    commentCount.textContent = String(commentInput.value.length);
  };
  commentInput.addEventListener("input", update);
  update();
}

// --- フォームの非同期送信（失敗時は理由をその場で表示） ---
function enhanceForm(formId, errorId, onSuccess) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const errorBox = document.getElementById(errorId);
    if (errorBox) {
      errorBox.hidden = true;
      errorBox.textContent = "";
    }
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    try {
      const res = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        onSuccess(data);
      } else {
        if (errorBox) {
          errorBox.textContent = data.error ?? "送信できませんでした。時間をおいてもう一度お試しください。";
          errorBox.hidden = false;
        }
        if (submitBtn) submitBtn.disabled = false;
      }
    } catch {
      // 通信に失敗したら通常のフォーム送信にフォールバック
      form.submit();
    }
  });
}

enhanceForm("post-form", "form-error", () => {
  window.location.href = `${window.location.pathname}?posted=1#board-form`;
});
enhanceForm("report-form", "report-error", () => {
  const id = document.querySelector('input[name="post_id"]')?.value;
  window.location.href = id ? `/post/${id}/?reported=1#report` : "/?reported=1";
});

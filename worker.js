/**
 * Cloudflare Worker - サイボクファーム カレンダー
 * 
 * Workers Sites または Pages Functions を使っている場合の
 * レスポンスヘッダー追加スクリプトです。
 * 
 * 使い方：
 *   Cloudflare Dashboard > Workers > 対象Worker > コードに追加するか、
 *   wrangler.toml の [site] 設定と組み合わせて使ってください。
 */

export default {
  async fetch(request, env, ctx) {
    // 静的アセットを取得（Workers Sites / Assets Binding の場合）
    let response;
    try {
      response = await env.ASSETS.fetch(request);
    } catch (e) {
      response = new Response('Not Found', { status: 404 });
    }

    // レスポンスヘッダーをコピーして追加
    const newHeaders = new Headers(response.headers);

    // Google OAuth ポップアップの window.opener 通信を許可
    newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    newHeaders.set('Cross-Origin-Embedder-Policy', 'unsafe-none');

    // Edge / Safari の Tracking Prevention 対策
    newHeaders.set('Permissions-Policy', 'storage-access=*');

    // 基本セキュリティヘッダー
    newHeaders.set('X-Content-Type-Options', 'nosniff');
    newHeaders.set('X-Frame-Options', 'SAMEORIGIN');
    newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};

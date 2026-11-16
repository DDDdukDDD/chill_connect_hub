import { NextResponse } from 'next/server';

/**
 * GET /.well-known/assetlinks.json: Digital Asset Links, the proof that the Android app (a Trusted Web Activity,
 * docs/ANDROID_APP.md) belongs to this site. With it Android opens the site full screen inside the app with no browser
 * bar, and links to the site open in the app. Without it the app still works but shows a URL bar.
 *
 * ANDROID_CERT_SHA256: the SHA-256 fingerprints of the signing keys, comma separated (the upload key and, once the app
 * is on Google Play, the Play App Signing key from Play Console → Test and release → App integrity).
 * ANDROID_PACKAGE_ID: the app's package name, set once and never changed (default com.chillwaa.app).
 */
export const dynamic = 'force-dynamic';

export function GET() {
  const fingerprints = (process.env.ANDROID_CERT_SHA256 ?? '')
    .split(',')
    .map((value) => value.trim().toUpperCase())
    .filter((value) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(value));
  const body = fingerprints.length
    ? [
        {
          relation: ['delegate_permission/common.handle_all_urls'],
          target: { namespace: 'android_app', package_name: process.env.ANDROID_PACKAGE_ID || 'com.chillwaa.app', sha256_cert_fingerprints: fingerprints },
        },
      ]
    : [];
  return NextResponse.json(body, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}

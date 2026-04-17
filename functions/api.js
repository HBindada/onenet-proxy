// functions/api.js
export default async function onRequest(context) {
    const { request, env } = context;

    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    }

    try {
        // ========== 请替换成你自己的 OneNET 信息 ==========
        const userId = '485448';
        const productId = 'CM002025584596';
        const deviceName = 'project_01';
        // ===============================================

        const accessKey = env.ONENET_ACCESS_KEY;

        async function generateToken(userId, accessKey) {
            const version = '2020-05-29';
            const res = `userid/${userId}`;
            const et = Math.floor(Date.now() / 1000) + 3600;
            const method = 'sha1';

            const key = Uint8Array.from(atob(accessKey), c => c.charCodeAt(0));
            const org = `${et}\n${method}\n${res}\n${version}`;
            const encoder = new TextEncoder();
            const data = encoder.encode(org);

            const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
            const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
            const sign = btoa(String.fromCharCode(...new Uint8Array(signature)));

            return `version=${version}&res=${encodeURIComponent(res)}&et=${et}&method=${method}&sign=${encodeURIComponent(sign)}`;
        }

        const token = await generateToken(userId, accessKey);
        const apiUrl = `https://openapi.heclouds.com/thingmodel/query-device-property?product_id=${productId}&device_name=${deviceName}`;

        const response = await fetch(apiUrl, {
            headers: { 'Authorization': token },
        });

        const data = await response.json();

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        return new Response(`Error: ${error.message}`, { status: 500 });
    }
}
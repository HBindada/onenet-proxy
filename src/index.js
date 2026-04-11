// src/index.js
export default {
    async fetch(request, env) {
        // ========== 请替换成你自己的 OneNET 信息 ==========
        const userId = '485448';
        const accessKey = env.ONENET_ACCESS_KEY; // 从环境变量读取
        const productId = 'at7Rc10d8W';
        const deviceName = 'project_01';
        // ===============================================

        // 处理 CORS 预检请求
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            });
        }

        // 生成 OneNET 安全鉴权 Token 的函数
        async function generateToken(userId, accessKey) {
            const version = '2020-05-29';
            const res = `userid/${userId}`;
            const et = Math.floor(Date.now() / 1000) + 3600; // 有效期1小时
            const method = 'sha1';

            // Base64 解码 accessKey
            const key = Uint8Array.from(atob(accessKey), c => c.charCodeAt(0));

            // 构建待签名字符串
            const org = `${et}\n${method}\n${res}\n${version}`;
            const encoder = new TextEncoder();
            const data = encoder.encode(org);

            // HMAC-SHA1 签名
            const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
            const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
            const sign = btoa(String.fromCharCode(...new Uint8Array(signature)));

            return `version=${version}&res=${encodeURIComponent(res)}&et=${et}&method=${method}&sign=${encodeURIComponent(sign)}`;
        }

        try {
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
    },
};
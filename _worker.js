const config = {
  WebToken: 'sub',
  FileName: 'Colab',
  MainData: '',
  urls: [],
  subconverter: "SUBAPI.fxxk.dedyn.io",
  subconfig: "https://raw.githubusercontent.com/cmliu/ACL4SSR/main/Clash/config/ACL4SSR_Online_MultiCountry.ini",
  subProtocol: 'https'
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 强制 HTTPS 重定向
    if (url.protocol === 'http:') {
      return new Response(null, {
        status: 301,
        headers: {
          'Location': url.href.replace('http:', 'https:'),
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
        }
      });
    }

    // 添加安全响应头
    const securityHeaders = {
      'Content-Security-Policy': "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Permissions-Policy': 'interest-cohort=()'
    };

    const userAgent = request.headers.get('User-Agent')?.toLowerCase() || "null";
    const token = url.searchParams.get('token');
    
    // 环境变量配置
    config.WebToken = env.TOKEN || config.WebToken;
    config.subconverter = env.SUBAPI || config.subconverter;
    config.subconfig = env.SUBCONFIG || config.subconfig;
    config.FileName = env.SUBNAME || config.FileName;
    config.MainData = env.LINK || config.MainData;
    
    if (env.LINKSUB) config.urls = await addLinks(env.LINKSUB);
    
    await fetchAndDecryptData();
    
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const fakeToken = await MD5MD5(`${config.WebToken}${Math.ceil(currentDate.getTime() / 1000)}`);
    
    let allLinks = await addLinks(config.MainData + '\n' + config.urls.join('\n'));
    let selfHostedNodes = "", subscriptionLinks = "";
    allLinks.forEach(x => x.toLowerCase().startsWith('http') ? subscriptionLinks += x + '\n' : selfHostedNodes += x + '\n');
    
    config.MainData = selfHostedNodes;
    config.urls = await addLinks(subscriptionLinks);

    if (![config.WebToken, fakeToken].includes(token) && !url.pathname.includes("/" + config.WebToken)) {
      return new Response(await forbiddenPage(), {
        status: 200,
        headers: { 
          'Content-Type': 'text/html; charset=UTF-8',
          ...securityHeaders 
        }
      });
    }

    const subscriptionFormat = determineSubscriptionFormat(userAgent, url);
    let subscriptionConversionUrl = `${url.origin}/${await MD5MD5(fakeToken)}?token=${fakeToken}`;
    let req_data = config.MainData + (await getSubscription(config.urls, "v2rayn", request.headers.get('User-Agent')))[0].join('\n');
    subscriptionConversionUrl += `|${(await getSubscription(config.urls, "v2rayn", request.headers.get('User-Agent')))[1]}`;
    
    if (env.WARP) subscriptionConversionUrl += `|${(await addLinks(env.WARP)).join("|")}`;
    
    const base64Data = btoa(req_data);
    
    if (subscriptionFormat === 'base64' || token === fakeToken) {
      return new Response(base64Data, {
        headers: { 
          "content-type": "text/plain; charset=utf-8",
          ...securityHeaders
        }
      });
    }

    try {
      const subconverterResponse = await fetch(buildSubconverterUrl(subscriptionFormat, subscriptionConversionUrl));
      if (!subconverterResponse.ok) throw new Error();
      let subconverterContent = await subconverterResponse.text();
      if (subscriptionFormat === 'clash') subconverterContent = await clashFix(subconverterContent);
      
      return new Response(subconverterContent, {
        headers: {
          "Content-Disposition": `attachment; filename*=utf-8''${encodeURIComponent(config.FileName)}; filename=${config.FileName}`,
          "content-type": "text/plain; charset=utf-8",
          ...securityHeaders
        },
      });
    } catch {
      return new Response(base64Data, {
        headers: { 
          "content-type": "text/plain; charset=utf-8",
          ...securityHeaders
        }
      });
    }
  }
};

async function forbiddenPage() {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>订阅转换</title>
    <style>
        :root {
            --primary: #FC456A;
            --secondary: #2D3436;
            --text: #2C3E50;
            --bg: #F8F9FA;
            --card-bg: #FFFFFF;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
        }
        
        .header {
            background: var(--secondary);
            color: white;
            padding: 2rem 1rem;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, #FC456A, #FD7272);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 1rem;
        }
        
        .software-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }
        
        .software-card {
            background: var(--card-bg);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
            border: 1px solid rgba(0,0,0,0.1);
        }
        
        .software-card:hover {
            transform: translateY(-5px);
        }
        
        .card-image {
            width: 100%;
            height: 200px;
            background-size: cover;
            background-position: center;
            border-bottom: 1px solid rgba(0,0,0,0.1);
        }
        
        .card-content {
            padding: 1.5rem;
        }
        
        .card-title {
            font-size: 1.5rem;
            color: var(--primary);
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .platform-tags {
            display: flex;
            gap: 0.5rem;
            margin: 1rem 0;
            flex-wrap: wrap;
        }
        
        .platform-tag {
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.9rem;
            background: rgba(252,69,106,0.1);
            color: var(--primary);
        }
        
        .card-description {
            color: #666;
            margin: 1rem 0;
            line-height: 1.6;
        }
        
        .feature-list {
            list-style: none;
            margin: 1rem 0;
        }
        
        .feature-list li {
            margin: 0.5rem 0;
            padding-left: 1.5rem;
            position: relative;
        }
        
        .feature-list li:before {
            content: "✦";
            color: var(--primary);
            position: absolute;
            left: 0;
        }
        
        .download-btn {
            display: inline-block;
            padding: 0.8rem 1.5rem;
            background: var(--primary);
            color: white;
            text-decoration: none;
            border-radius: 25px;
            transition: opacity 0.3s ease;
            margin-top: 1rem;
        }
        
        .download-btn:hover {
            opacity: 0.9;
        }
        
        footer {
            text-align: center;
            padding: 2rem;
            background: var(--secondary);
            color: white;
            margin-top: 3rem;
        }
        
        @media (max-width: 768px) {
            .software-grid {
                grid-template-columns: 1fr;
            }
            
            .header h1 {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <h1>订阅转换服务</h1>
        <p>支持多种客户端配置转换，轻松实现跨平台使用</p>
    </header>
    
    <main class="container">
        <div class="software-grid">
            <div class="software-card">
                <div class="card-image" style="background-image: url('https://raw.githubusercontent.com/2dust/v2rayN/master/v2rayN/Resources/NotifyIcon1.ico')"></div>
                <div class="card-content">
                    <h3 class="card-title">v2rayN</h3>
                    <div class="platform-tags">
                        <span class="platform-tag">Windows</span>
                        <span class="platform-tag">开源免��</span>
                    </div>
                    <p class="card-description">Windows 平台下最受欢迎的代理工具，界面简洁，功能强大。</p>
                    <ul class="feature-list">
                        <li>支持多种协议</li>
                        <li>可视化配置界面</li>
                        <li>规则分流功能</li>
                        <li>支持订阅更新</li>
                    </ul>
                    <a href="https://github.com/2dust/v2rayN" class="download-btn" target="_blank">了解更多</a>
                </div>
            </div>
            
            <div class="software-card">
                <div class="card-image" style="background-image: url('https://raw.githubusercontent.com/hiddify/hiddify-next/main/assets/images/logo.png')"></div>
                <div class="card-content">
                    <h3 class="card-title">Hiddify</h3>
                    <div class="platform-tags">
                        <span class="platform-tag">跨平台</span>
                        <span class="platform-tag">开源免费</span>
                    </div>
                    <p class="card-description">新一代跨平台代理工具，支持多平台，界面美观。</p>
                    <ul class="feature-list">
                        <li>支持 Windows/Mac/Linux</li>
                        <li>多语言界面</li>
                        <li>智能分流</li>
                        <li>配置导入导出</li>
                    </ul>
                    <a href="https://github.com/hiddify/hiddify-next" class="download-btn" target="_blank">了解更多</a>
                </div>
            </div>
            
            <div class="software-card">
                <div class="card-image" style="background-image: url('https://play-lh.googleusercontent.com/EoiTA0z1LdQHV1RjOBGgH0liGDJGGqk8UKs7_AoNvX5C6nrXRG-NVjMvvD_Ef_yMJQ')"></div>
                <div class="card-content">
                    <h3 class="card-title">Karing</h3>
                    <div class="platform-tags">
                        <span class="platform-tag">Android</span>
                        <span class="platform-tag">简单易用</span>
                    </div>
                    <p class="card-description">Android 平台的轻量级代理工具，操作简单。</p>
                    <ul class="feature-list">
                        <li>界面直观</li>
                        <li>快速导入配置</li>
                        <li>支持多种协议</li>
                        <li>省电模式</li>
                    </ul>
                    <a href="https://github.com/KaringX/karing" class="download-btn" target="_blank">了解更多</a>
                </div>
            </div>
            
            <div class="software-card">
                <div class="card-image" style="background-image: url('https://raw.githubusercontent.com/Fclash/Fclash/main/img/logo.png')"></div>
                <div class="card-content">
                    <h3 class="card-title">FClash</h3>
                    <div class="platform-tags">
                        <span class="platform-tag">跨平台</span>
                        <span class="platform-tag">图形界面</span>
                    </div>
                    <p class="card-description">基于 Clash 内核的跨平台图形客户端。</p>
                    <ul class="feature-list">
                        <li>支持多平台</li>
                        <li>规则分流</li>
                        <li>策略组切换</li>
                        <li>流量统计</li>
                    </ul>
                    <a href="https://github.com/chen08209/FlClash" class="download-btn" target="_blank">了解更多</a>
                </div>
            </div>
        </div>
    </main>
    
    <footer>
        <p>© ${new Date().getFullYear()} Sub Hub - 专业的订阅转换服务</p>
    </footer>
</body>
</html>
`;
}

// 保持原有的其他函数不变
async function fetchAndDecryptData() {
  const apiUrl = 'https://web.enkelte.ggff.net/api/serverlist';
  const headers = {
    'accept': '/',
    'appversion': '1.3.1',
    'user-agent': 'SkrKK/1.3.1',
    'content-type': 'application/x-www-form-urlencoded'
  };
  const key = new TextEncoder().encode('65151f8d966bf596');
  const iv = new TextEncoder().encode('88ca0f0ea1ecf975');
  
  try {
    const encryptedData = await (await fetch(apiUrl, { headers })).text();
    const decryptedData = await aes128cbcDecrypt(encryptedData, key, iv);
    const data = JSON.parse(decryptedData.match(/({.*})/)[0]).data;
    config.MainData = data.map(o => 
      `ss://${btoa(`aes-256-cfb:${o.password}`)}@${o.ip}:${o.port}#${encodeURIComponent(o.title || '未命名')}`
    ).join('\n');
  } catch (error) {
    throw new Error('Error fetching or decrypting data: ' + error.message);
  }
}

function determineSubscriptionFormat(userAgent, url) {
  if (userAgent.includes('null') || userAgent.includes('subconverter')) return 'base64';
  if (userAgent.includes('clash') || url.searchParams.has('clash')) return 'clash';
  if (userAgent.includes('sing-box') || url.searchParams.has('sb') || url.searchParams.has('singbox')) return 'singbox';
  if (userAgent.includes('surge') || url.searchParams.has('surge')) return 'surge';
  return 'base64';
}

function buildSubconverterUrl(subscriptionFormat, subscriptionConversionUrl) {
  return `${config.subProtocol}://${config.subconverter}/sub?target=${subscriptionFormat}&url=${encodeURIComponent(subscriptionConversionUrl)}&config=${encodeURIComponent(config.subconfig)}`;
}

async function addLinks(data) {
  return data.split("\n").filter(e => e.trim() !== "");
}

async function getSubscription(urls, UA, userAgentHeader) {
  const headers = { "User-Agent": userAgentHeader || UA };
  let subscriptionContent = [], unconvertedLinks = [];
  
  for (const url of urls) {
    try {
      const response = await fetch(url, { headers });
      if (response.status === 200) {
        subscriptionContent.push((await response.text()).split("\n"));
      } else {
        unconvertedLinks.push(url);
      }
    } catch {
      unconvertedLinks.push(url);
    }
  }
  
  return [subscriptionContent.flat(), unconvertedLinks];
}

async function clashFix(content) {
  return content.split("\n").reduce((acc, line) => {
    if (line.startsWith("  - name: ")) {
      acc += `  - name: ${line.split("name: ")[1]}\n`;
    } else {
      acc += line + "\n";
    }
    return acc;
  }, '');
}

async function MD5MD5(value) {
  const encoded = new TextEncoder().encode(value);
  const buffer = await crypto.subtle.digest("MD5", await crypto.subtle.digest("MD5", encoded));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function aes128cbcDecrypt(encryptedText, key, iv) {
  const encryptedBuffer = hexStringToUint8Array(encryptedText);
  const algorithm = { name: 'AES-CBC', iv };
  const keyObj = await crypto.subtle.importKey('raw', key, algorithm, false, ['decrypt']);
  
  try {
    const decryptedBuffer = await crypto.subtle.decrypt(algorithm, keyObj, encryptedBuffer);
    return new TextDecoder().decode(decryptedBuffer).replace(/\0+$/, '');
  } catch {
    throw new Error('Decryption failed');
  }
}

function hexStringToUint8Array(hexString) {
  return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}

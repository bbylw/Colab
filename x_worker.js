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
            --primary: #f90;
            --primary-dark: #e50;
            --secondary: #0a0a0a;
            --text: #ffffff;
            --bg: #000000;
            --card-bg: #151515;
            --card-hover: #1a1a1a;
            --text-gray: #999;
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
            line-height: 1.4;
            min-height: 100vh;
        }
        
        .header {
            background: var(--secondary);
            padding: 2rem 1rem;
            text-align: center;
            position: relative;
            border-bottom: 2px solid var(--primary);
        }
        
        .header h1 {
            font-size: 2.8rem;
            margin-bottom: 0.5rem;
            color: var(--text);
            font-weight: 800;
            letter-spacing: -0.5px;
        }
        
        .header h1 span {
            color: var(--primary);
            position: relative;
            display: inline-block;
        }
        
        .header h1 span::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 100%;
            height: 2px;
            background: var(--primary);
        }
        
        .header p {
            font-size: 1rem;
            color: var(--text-gray);
            max-width: 500px;
            margin: 0 auto;
        }
        
        .container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 1rem;
        }
        
        .software-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
        }
        
        .software-card {
            background: var(--card-bg);
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: all 0.25s ease;
            position: relative;
            border: 1px solid #222;
        }
        
        .software-card:hover {
            transform: translateY(-5px);
            border-color: var(--primary);
            box-shadow: 0 8px 25px rgba(255,153,0,0.15);
        }
        
        .card-image {
            height: 80px;
            position: relative;
            display: flex;
            align-items: center;
            padding-left: 100px;
            background-color: rgba(255,153,0,0.03);
            border-bottom: 1px solid rgba(255,153,0,0.1);
        }
        
        .card-image::before {
            content: '';
            position: absolute;
            left: 20px;
            width: 60px;
            height: 60px;
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
            background-image: inherit;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }
        
        .card-image::after {
            content: attr(data-name);
            color: var(--primary);
            font-size: 1.5rem;
            font-weight: bold;
        }
        
        .card-content {
            padding: 1rem;
        }
        
        .card-title {
            display: none;
        }
        
        .platform-tags {
            margin: 0.5rem 0;
            display: flex;
            gap: 0.5rem;
        }
        
        .platform-tag {
            padding: 0.25rem 0.6rem;
            border-radius: 4px;
            font-size: 0.75rem;
            background: rgba(255,153,0,0.15);
            color: var(--primary);
            font-weight: 500;
        }
        
        .card-description {
            color: var(--text-gray);
            font-size: 0.95rem;
            margin-bottom: 1rem;
            line-height: 1.5;
        }
        
        .feature-list {
            list-style: none;
            margin-bottom: 1.5rem;
        }
        
        .feature-list li {
            margin: 0.4rem 0;
            padding-left: 1.2rem;
            position: relative;
            color: var(--text-gray);
            font-size: 0.9rem;
        }
        
        .feature-list li::before {
            content: "›";
            color: var(--primary);
            position: absolute;
            left: 0;
            font-size: 1.2rem;
            line-height: 1;
            top: 1px;
        }
        
        .download-btn {
            display: inline-block;
            padding: 0.6rem 1.2rem;
            background: var(--primary);
            color: var(--bg);
            text-decoration: none;
            border-radius: 4px;
            font-size: 0.9rem;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        
        .download-btn:hover {
            background: var(--primary-dark);
            transform: translateY(-1px);
        }
        
        footer {
            text-align: center;
            padding: 2rem;
            background: var(--secondary);
            color: var(--text-gray);
            font-size: 0.9rem;
            margin-top: 2rem;
            border-top: 2px solid var(--primary);
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 2rem;
            }
            
            .container {
                padding: 0 1rem;
            }
            
            .software-grid {
                grid-template-columns: 1fr;
                gap: 1rem;
            }
            
            .card-content {
                padding: 1.2rem;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <h1>SUB<span>HUB</span></h1>
        <p>专业的订阅转换服务</p>
    </header>
    
    <main class="container">
        <div class="software-grid">
            <div class="software-card">
                <div class="card-image" 
                     style="background-image: url('https://raw.githubusercontent.com/2dust/v2rayN/master/v2rayN/Resources/NotifyIcon1.ico')"
                     data-name="v2rayN">
                </div>
                <div class="card-content">
                    <div class="platform-tags">
                        <span class="platform-tag">Windows</span>
                        <span class="platform-tag">开源免费</span>
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
                <div class="card-image" 
                     style="background-image: url('https://raw.githubusercontent.com/hiddify/hiddify-next/main/assets/images/logo.png')"
                     data-name="Hiddify">
                </div>
                <div class="card-content">
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
                <div class="card-image" 
                     style="background-image: url('https://play-lh.googleusercontent.com/EoiTA0z1LdQHV1RjOBGgH0liGDJGGqk8UKs7_AoNvX5C6nrXRG-NVjMvvD_Ef_yMJQ')"
                     data-name="Karing">
                </div>
                <div class="card-content">
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
        </div>
    </main>
    
    <footer>
        <p>© ${new Date().getFullYear()} SubHub - 专业的订阅转换服务</p>
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

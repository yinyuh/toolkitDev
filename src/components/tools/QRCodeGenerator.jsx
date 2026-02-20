import React, { useState, useRef, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Share2, Link, Wifi, Contact, Smartphone, Mail, FileText, Image as ImageIcon, Settings, Check } from 'lucide-react';
import { saveAs } from 'file-saver';

const QRCodeGenerator = () => {
  const [content, setContent] = useState('https://example.com');
  const [activeTab, setActiveTab] = useState('url');
  
  // Customization
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [size, setSize] = useState(256);
  const [level, setLevel] = useState('M'); // L, M, Q, H
  const [includeLogo, setIncludeLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoSize, setLogoSize] = useState(24);

  // WiFi specific states
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState('WPA');
  const [wifiHidden, setWifiHidden] = useState(false);

  // VCard specific states
  const [vcardFirstName, setVcardFirstName] = useState('');
  const [vcardLastName, setVcardLastName] = useState('');
  const [vcardPhone, setVcardPhone] = useState('');
  const [vcardEmail, setVcardEmail] = useState('');
  const [vcardOrg, setVcardOrg] = useState('');

  const qrRef = useRef(null);
  const fileInputRef = useRef(null);

  // Update content based on active tab and inputs
  useEffect(() => {
    let newContent = '';
    
    switch (activeTab) {
      case 'url':
      case 'text':
        // content is managed directly by input
        break;
      case 'wifi':
        // WIFI:S:MySSID;T:WPA;P:MyPass;H:false;;
        const ssid = wifiSsid.replace(/([\\;,:])/g, '\\$1');
        const pass = wifiPassword.replace(/([\\;,:])/g, '\\$1');
        newContent = `WIFI:S:${ssid};T:${wifiEncryption};P:${pass};H:${wifiHidden};;`;
        setContent(newContent);
        break;
      case 'vcard':
        // Simple vCard 3.0
        newContent = `BEGIN:VCARD\nVERSION:3.0\nN:${vcardLastName};${vcardFirstName}\nFN:${vcardFirstName} ${vcardLastName}\nORG:${vcardOrg}\nTEL:${vcardPhone}\nEMAIL:${vcardEmail}\nEND:VCARD`;
        setContent(newContent);
        break;
      case 'phone':
        // TEL:+123456789
        // content managed by input
        break;
      case 'email':
        // MAILTO:someone@example.com
        // content managed by input
        break;
    }
  }, [activeTab, wifiSsid, wifiPassword, wifiEncryption, wifiHidden, vcardFirstName, vcardLastName, vcardPhone, vcardEmail, vcardOrg]);

  const handleDownload = (format) => {
    const canvas = qrRef.current.querySelector('canvas');
    if (canvas) {
      if (format === 'png') {
        canvas.toBlob((blob) => {
          saveAs(blob, 'qrcode.png');
        });
      } else if (format === 'svg') {
        // qrcode.react renders canvas by default, need to switch to SVG mode or extract
        // For simplicity with this lib, we might stick to PNG download or switch render prop
        // But qrcode.react's QRCodeCanvas renders canvas. QRCodeSVG renders svg.
        // Let's just support PNG for now or dynamically render SVG for download.
        alert("暂仅支持 PNG 下载");
      }
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoUrl(e.target.result);
        setIncludeLogo(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'url', label: '网址/文本', icon: Link },
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'vcard', label: '名片', icon: Contact },
    // { id: 'phone', label: '电话', icon: Smartphone },
    // { id: 'email', label: '邮件', icon: Mail },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Configuration */}
        <div className="lg:col-span-7 space-y-6">
           {/* Tabs */}
           <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                        setActiveTab(tab.id);
                        if(tab.id === 'url') setContent('https://');
                        if(tab.id === 'wifi') setContent('WIFI:S:;T:WPA;P:;;');
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'bg-white dark:bg-gray-700 text-theme-primary shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                )
              })}
           </div>

           {/* Input Forms */}
           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              {activeTab === 'url' && (
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">网址或文本内容</label>
                   <textarea 
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-theme-primary outline-none h-32"
                      placeholder="https://example.com"
                   />
                </div>
              )}

              {activeTab === 'wifi' && (
                <div className="space-y-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">WiFi 名称 (SSID)</label>
                      <input 
                        type="text" 
                        value={wifiSsid}
                        onChange={(e) => setWifiSsid(e.target.value)}
                        className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-theme-primary outline-none"
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">密码</label>
                      <input 
                        type="text" 
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-theme-primary outline-none"
                      />
                   </div>
                   <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">加密方式</label>
                        <select 
                          value={wifiEncryption}
                          onChange={(e) => setWifiEncryption(e.target.value)}
                          className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 outline-none"
                        >
                           <option value="WPA">WPA/WPA2</option>
                           <option value="WEP">WEP</option>
                           <option value="nopass">无密码</option>
                        </select>
                      </div>
                      <div className="flex items-center pt-8">
                         <label className="flex items-center cursor-pointer gap-2">
                            <input 
                              type="checkbox" 
                              checked={wifiHidden}
                              onChange={(e) => setWifiHidden(e.target.checked)}
                              className="w-4 h-4 text-theme-primary rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">隐藏网络</span>
                         </label>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'vcard' && (
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">姓</label>
                        <input type="text" value={vcardLastName} onChange={(e) => setVcardLastName(e.target.value)} className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">名</label>
                        <input type="text" value={vcardFirstName} onChange={(e) => setVcardFirstName(e.target.value)} className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 outline-none" />
                      </div>
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">公司/组织</label>
                      <input type="text" value={vcardOrg} onChange={(e) => setVcardOrg(e.target.value)} className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 outline-none" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">电话</label>
                      <input type="text" value={vcardPhone} onChange={(e) => setVcardPhone(e.target.value)} className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 outline-none" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">邮箱</label>
                      <input type="email" value={vcardEmail} onChange={(e) => setVcardEmail(e.target.value)} className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 outline-none" />
                   </div>
                </div>
              )}
           </div>

           {/* Customization */}
           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                 <Settings size={18} />
                 样式设置
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">前景色</label>
                    <div className="flex gap-2">
                       <input 
                         type="color" 
                         value={fgColor}
                         onChange={(e) => setFgColor(e.target.value)}
                         className="h-10 w-14 p-1 rounded border border-gray-200 dark:border-gray-700 cursor-pointer"
                       />
                       <input 
                         type="text" 
                         value={fgColor}
                         onChange={(e) => setFgColor(e.target.value)}
                         className="flex-1 p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 uppercase font-mono"
                       />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">背景色</label>
                    <div className="flex gap-2">
                       <input 
                         type="color" 
                         value={bgColor}
                         onChange={(e) => setBgColor(e.target.value)}
                         className="h-10 w-14 p-1 rounded border border-gray-200 dark:border-gray-700 cursor-pointer"
                       />
                       <input 
                         type="text" 
                         value={bgColor}
                         onChange={(e) => setBgColor(e.target.value)}
                         className="flex-1 p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 uppercase font-mono"
                       />
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo 图片</label>
                    <div className="flex gap-2 items-center">
                       <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm flex items-center gap-2"
                       >
                          <ImageIcon size={16} />
                          上传
                       </button>
                       <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleLogoUpload} 
                          accept="image/*" 
                          className="hidden" 
                       />
                       {logoUrl && (
                          <div className="relative">
                             <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded object-cover border border-gray-200" />
                             <button 
                               onClick={() => { setLogoUrl(''); setIncludeLogo(false); }}
                               className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                             >
                                <X size={10} />
                             </button>
                          </div>
                       )}
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">纠错等级 (Error Level)</label>
                    <select 
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 outline-none"
                    >
                       <option value="L">低 (L) - 7%</option>
                       <option value="M">中 (M) - 15%</option>
                       <option value="Q">四分之一 (Q) - 25%</option>
                       <option value="H">高 (H) - 30%</option>
                    </select>
                 </div>
              </div>
           </div>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-5">
           <div className="sticky top-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 flex flex-col items-center">
                 <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">二维码预览</h2>
                 
                 <div 
                   ref={qrRef}
                   className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 mb-8"
                 >
                    <QRCodeCanvas
                       value={content}
                       size={size}
                       bgColor={bgColor}
                       fgColor={fgColor}
                       level={level}
                       includeMargin={true}
                       imageSettings={includeLogo && logoUrl ? {
                          src: logoUrl,
                          x: undefined,
                          y: undefined,
                          height: logoSize,
                          width: logoSize,
                          excavate: true,
                       } : undefined}
                    />
                 </div>

                 <div className="w-full space-y-4">
                    <div>
                       <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">尺寸</span>
                          <span className="text-gray-700 dark:text-gray-300 font-mono">{size}px</span>
                       </div>
                       <input 
                         type="range" 
                         min="128" 
                         max="1024" 
                         step="32" 
                         value={size} 
                         onChange={(e) => setSize(parseInt(e.target.value))}
                         className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                       />
                    </div>

                    <button 
                      onClick={() => handleDownload('png')}
                      className="w-full py-3 bg-theme-primary text-white rounded-xl font-bold hover:bg-theme-primary/90 flex items-center justify-center gap-2 shadow-lg shadow-theme-primary/20 transition-all active:scale-[0.98]"
                    >
                       <Download size={20} />
                       下载 PNG 图片
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// Simple X icon component since I didn't import it
const X = ({ size = 24, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export default QRCodeGenerator;
